/**
 * KKS Videos — embed loader (estilo VTurb, uma linha)
 *
 * Novo (recomendado):
 * <kks-player embed="vid_XXXXX"></kks-player>
 * <script defer src="https://kksapps.com.br/videos/public/embed.js?v=1"></script>
 *
 * Legado (continua funcionando):
 * <div id="vsl-player" data-embed="vid_XXXXX"></div>
 * <script src="..."></script>
 */
(function () {
  'use strict';

  var SCRIPT_EL = document.currentScript;
  var EMBED_BASE = '';
  var EMBED_VERSION = '1';

  if (SCRIPT_EL && SCRIPT_EL.src) {
    EMBED_BASE = SCRIPT_EL.src.replace(/\/embed\.js(\?.*)?$/, '');
    try {
      EMBED_VERSION = new URL(SCRIPT_EL.src).searchParams.get('v') || '1';
    } catch (e) {}
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + src + '"]');
      if (existing && existing.getAttribute('data-kks-loaded') === '1') {
        resolve();
        return;
      }
      var s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = function () {
        s.setAttribute('data-kks-loaded', '1');
        resolve();
      };
      s.onerror = function () {
        reject(new Error('Falha ao carregar: ' + src));
      };
      document.head.appendChild(s);
    });
  }

  function loadCss(href) {
    if (document.querySelector('link[href="' + href + '"]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    document.head.appendChild(l);
  }

  function getBase() {
    if (EMBED_BASE) {
      return EMBED_BASE;
    }
    var script = document.currentScript;
    if (!script) {
      var scripts = document.getElementsByTagName('script');
      for (var i = scripts.length - 1; i >= 0; i--) {
        if (scripts[i].src && /embed\.js/.test(scripts[i].src)) {
          script = scripts[i];
          break;
        }
      }
    }
    if (script && script.src) {
      return script.src.replace(/\/embed\.js(\?.*)?$/, '');
    }
    return '';
  }

  function getApiBase(publicBase) {
    return publicBase.replace(/\/public\/?$/, '') + '/api';
  }

  function markLoading(node) {
    node.classList.add('kks-embed-loading');
  }

  function getEmbedId(node) {
    return (node.getAttribute('embed') || node.getAttribute('data-embed') || '').trim();
  }

  function getHead() {
    return document.head || document.getElementsByTagName('head')[0] || null;
  }

  function originOf(url) {
    try {
      return new URL(url, window.location.href).origin;
    } catch (e) {
      return '';
    }
  }

  /** dns-prefetch + preconnect — acelera conexão com CDN/host do stream. */
  function warmConnection(url) {
    var head = getHead();
    var origin = originOf(url);
    if (!head || !origin) return;

    if (!document.querySelector('link[rel="dns-prefetch"][href="' + origin + '"]')) {
      var dns = document.createElement('link');
      dns.rel = 'dns-prefetch';
      dns.href = origin;
      head.appendChild(dns);
    }

    if (!document.querySelector('link[rel="preconnect"][href="' + origin + '"]')) {
      var pre = document.createElement('link');
      pre.rel = 'preconnect';
      pre.href = origin;
      pre.crossOrigin = 'anonymous';
      head.appendChild(pre);
    }
  }

  /** Safari iOS com HLS nativo — igual VTurb: preload do master .m3u8. */
  function isAppleMobileNativeHls() {
    var ua = (navigator && navigator.userAgent) || '';
    var vendor = (navigator && navigator.vendor) || '';
    var mobile = /mobile/i.test(ua);
    var apple =
      vendor.indexOf('Apple') > -1 &&
      ua.indexOf('CriOS') === -1 &&
      ua.indexOf('FxiOS') === -1;
    if (!(apple && mobile)) return false;
    try {
      return document.createElement('video').canPlayType('application/vnd.apple.mpegURL') !== '';
    } catch (e) {
      return false;
    }
  }

  function preloadHlsManifest(streamUrl) {
    if (!streamUrl) return;

    warmConnection(streamUrl);

    if (!isAppleMobileNativeHls()) return;

    var head = getHead();
    if (!head) return;
    if (document.querySelector('link[rel="preload"][href="' + streamUrl + '"]')) return;

    var link = document.createElement('link');
    link.rel = 'preload';
    link.href = streamUrl;
    link.setAttribute('as', 'fetch');
    link.setAttribute('crossorigin', 'anonymous');
    head.appendChild(link);
  }

  /** Aceita <kks-player> e o formato antigo div[data-embed]. */
  function findEmbedNodes() {
    var nodes = [];
    var seen = [];

    function pushUnique(node) {
      if (seen.indexOf(node) !== -1) return;
      seen.push(node);
      nodes.push(node);
    }

    document.querySelectorAll('kks-player').forEach(pushUnique);
    document.querySelectorAll('[data-embed]').forEach(function (node) {
      if (node.tagName && node.tagName.toLowerCase() === 'kks-player') return;
      pushUnique(node);
    });

    return nodes;
  }

  function hasEmbedNodes() {
    return findEmbedNodes().length > 0;
  }

  /** Prefere a versão do servidor (assetVersion); landing ?v= ainda força se for mais nova. */
  function resolveAssetVersion(serverVersion) {
    var a = parseInt(String(serverVersion || ''), 10);
    var b = parseInt(String(EMBED_VERSION || ''), 10);
    if (!isNaN(a) && !isNaN(b)) return String(Math.max(a, b));
    if (!isNaN(a)) return String(a);
    if (!isNaN(b)) return String(b);
    return String(serverVersion || EMBED_VERSION || '1');
  }

  function boot() {
    var base = getBase();
    if (!base) {
      console.error('[KKS Embed] Não foi possível detectar a URL base do embed.js');
      return;
    }

    var configBase = getApiBase(base) + '/vsl-config.php';
    var hlsUrl = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js';

    // Aquecimento precoce: HLS lib, painel/API e assets do player
    warmConnection(hlsUrl);
    warmConnection(base);
    warmConnection(configBase);

    var nodes = findEmbedNodes();
    if (nodes.length === 0) {
      console.warn('[KKS Embed] Nenhum <kks-player> ou [data-embed] encontrado.');
      return;
    }

    nodes.forEach(markLoading);

    loadScript(hlsUrl).then(function () {
      var embedIds = [];
      nodes.forEach(function (node, index) {
        var embedId = getEmbedId(node);
        if (!embedId) return;
        if (!node.id) {
          node.id = nodes.length === 1 ? 'vsl-player' : 'vsl-player-' + index;
        }
        embedIds.push({ node: node, id: embedId });
      });

      var assetVersion = EMBED_VERSION;
      var chain = Promise.resolve();
      embedIds.forEach(function (item) {
        chain = chain.then(function () {
          return loadScript(configBase + '?embed_id=' + encodeURIComponent(item.id));
        }).then(function () {
          if (window.VSL_CONFIG) {
            window.VSL_CONFIG.containerId = item.node.id;
            if (window.VSL_CONFIG.assetVersion) {
              assetVersion = resolveAssetVersion(window.VSL_CONFIG.assetVersion);
            }
            // Depois da config: prefetch/preload do host do .m3u8 (CloudFront/S3/domínio do cliente)
            preloadHlsManifest(window.VSL_CONFIG.streamUrl || '');
          }
        });
      });

      return chain.then(function () {
        var ver = encodeURIComponent(assetVersion);
        loadCss(base + '/vsl/player.css?v=' + ver);
        return loadScript(base + '/vsl/player.js?v=' + ver);
      });
    }).catch(function (err) {
      console.error('[KKS Embed] Falha ao carregar player:', err);
    });
  }

  function start() {
    if (hasEmbedNodes()) {
      boot();
      return;
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  }

  start();
})();
