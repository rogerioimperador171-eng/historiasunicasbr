
(function () {
  'use strict';


  var SCRIPT_TAG = document.currentScript;
  var CONFIG = {
    pixelId: (SCRIPT_TAG && SCRIPT_TAG.getAttribute('data-pixel-id')) || 'SEU_PIXEL_ID_AQUI',
    endpoint: '/fb-capi.php', 


    rules: [
      { match: /obrigado|sucesso|aprovado/i, event: 'Purchase' },
      { match: /qrcode|pix|pagamento|checkout/i, event: 'InitiateCheckout' },
      { match: /.*/, event: 'ViewContent' } // qualquer outra página de campanha
    ],


    valueParams: ['valor', 'value', 'amount', 'total'],
    txidParams: ['txid', 'order_id', 'id', 'transacao', 'transaction_id', 'pedido'],

    currency: 'BRL',

   
    statusEndpoint: '/fb-status.php',
    autoWatch: true,       
    watchInterval: 5000,    
    watchMaxMinutes: 30,    

    debug: !!(SCRIPT_TAG && SCRIPT_TAG.getAttribute('data-debug')) 
  };
  

  function log() { if (CONFIG.debug && window.console) console.log.apply(console, ['[fbtk]'].concat([].slice.call(arguments))); }


  function getCookie(name) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  }
  function setCookie(name, value, days) {
    var d = new Date(); d.setTime(d.getTime() + days * 864e5);
    document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + d.toUTCString() + '; path=/; SameSite=Lax';
  }
  function store(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }
  function read(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } }

  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function getParam(names) {
    var q = new URLSearchParams(location.search);
    for (var i = 0; i < names.length; i++) {
      var v = q.get(names[i]);
      if (v) return v;
    }
    return null;
  }


  function getExternalId() {
    var id = read('fbtk_eid');
    if (!id) { id = uuid(); store('fbtk_eid', id); }
    return id;
  }

  function getFbc() {
    var fbc = getCookie('_fbc');
    if (fbc) return fbc;
    var fbclid = new URLSearchParams(location.search).get('fbclid');
    if (fbclid) {
      fbc = 'fb.1.' + Date.now() + '.' + fbclid;
      setCookie('_fbc', fbc, 90); 
      return fbc;
    }
    return read('fbtk_fbc') || null;
  }

  function getFbp() { return getCookie('_fbp') || null; }

 
  var userData = read('fbtk_ud') || {};

 
  function isGarbage(field, value) {
    var v = value.toLowerCase();
    if (/^an[oô]nimo/.test(v) || v === 'doador' || v === 'teste') return true;
    if (field === 'ph') {
      var d = value.replace(/\D/g, '');
      if (d.length < 10 || /^(\d)\1+$/.test(d) || /^0/.test(d)) return true; // curto, repetido (000..., 111...) ou começando com 0
    }
    if (field === 'em' && /(doador@|teste@|exemplo@|@teste|@exemplo)/.test(v)) return true;
    return false;
  }

  function classifyInput(el) {
    var hint = ((el.name || '') + ' ' + (el.id || '') + ' ' + (el.placeholder || '') + ' ' + (el.getAttribute('autocomplete') || '')).toLowerCase();
    if (el.type === 'email' || /e-?mail/.test(hint)) return 'em';
    if (el.type === 'tel' || /(tel|phone|celular|whats|fone)/.test(hint)) return 'ph';
    if (/(cep|postal|zip)/.test(hint)) return 'zp';
    if (/(cidade|city)/.test(hint)) return 'ct';
    if (/\b(uf|estado|state)\b/.test(hint)) return 'st';
    if (/(nome|name)/.test(hint) && !/user|login|sobre/.test(hint)) return 'name';
    if (/(sobrenome|last.?name)/.test(hint)) return 'ln';
    return null;
  }

  function captureValue(field, value) {
    value = (value || '').trim();
    if (!value) return;
    if (isGarbage(field === 'name' ? 'fn' : field, value)) return log('ignorado (placeholder)', field, value);
    if (field === 'name') {
      var parts = value.split(/\s+/);
      userData.fn = parts.shift();
      if (parts.length) userData.ln = parts.join(' ');
    } else {
      userData[field] = value;
    }
    store('fbtk_ud', userData);
    log('capturado', field, value);
  }

  document.addEventListener('change', function (e) {
    var el = e.target;
    if (!el || !/^(INPUT|SELECT)$/.test(el.tagName)) return;
    var field = classifyInput(el);
    if (field) captureValue(field, el.value);
  }, true);

  
  (function () {
    var q = new URLSearchParams(location.search);
    var map = { nome: 'name', name: 'name', email: 'em', telefone: 'ph', phone: 'ph', tel: 'ph', celular: 'ph', cidade: 'ct', estado: 'st', uf: 'st', cep: 'zp' };
    q.forEach(function (value, key) {
      var field = map[key.toLowerCase()];
      if (field) captureValue(field, value);
    });
  })();

  
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
  document,'script','https://connect.facebook.net/en_US/fbevents.js');


  var am = {};
  if (userData.em) am.em = userData.em.toLowerCase();
  if (userData.ph) am.ph = userData.ph.replace(/\D/g, '');
  if (userData.fn) am.fn = userData.fn.toLowerCase();
  if (userData.ln) am.ln = userData.ln.toLowerCase();
  am.external_id = getExternalId();
  fbq('init', CONFIG.pixelId, am);

  
  function track(eventName, customData, opts) {
    customData = customData || {};
    opts = opts || {};

   
    var eventId = opts.eventId ||
      (eventName === 'Purchase' && customData.txid ? 'p_' + customData.txid : eventName.toLowerCase() + '_' + uuid());

    var txid = customData.txid; delete customData.txid;
    if (customData.value != null) {
      customData.value = parseFloat(String(customData.value).replace(',', '.'));
      if (isNaN(customData.value)) delete customData.value;
    }
    if (customData.value != null && !customData.currency) customData.currency = CONFIG.currency;

   
    fbq('track', eventName, customData, { eventID: eventId });

   
    var payload = {
      pixel_id: CONFIG.pixelId,
      event_name: eventName,
      event_id: eventId,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: location.href,
      custom_data: customData,
      user_data: {
        em: userData.em || null,
        ph: userData.ph || null,
        fn: userData.fn || null,
        ln: userData.ln || null,
        ct: userData.ct || null,
        st: userData.st || null,
        zp: userData.zp || null,
        external_id: getExternalId(),
        fbp: getFbp(),
        fbc: getFbc()
      },
      txid: txid || null
    };

    var body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(CONFIG.endpoint, new Blob([body], { type: 'application/json' }));
    } else {
      fetch(CONFIG.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true });
    }
    log('evento enviado', eventName, eventId, payload);
  }

  function setUser(data) {
    for (var k in data) if (data[k]) captureValue(k === 'name' ? 'name' : k, String(data[k]));
  }

 
  function watchPayment(txid, value) {
    if (!txid) return log('watchPayment: txid vazio');
    var guard = 'fbtk_paid_' + txid;
    if (read(guard)) return log('watchPayment: Purchase já disparado pra', txid);

    var maxTries = Math.ceil((CONFIG.watchMaxMinutes * 60000) / CONFIG.watchInterval);
    var tries = 0;
    log('monitorando pagamento', txid);

    var timer = setInterval(function () {
      if (++tries > maxTries) { clearInterval(timer); return log('watchPayment: tempo esgotado', txid); }
      fetch(CONFIG.statusEndpoint + '?txid=' + encodeURIComponent(txid) + '&pixel_id=' + encodeURIComponent(CONFIG.pixelId), { cache: 'no-store' })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d && d.status === 'paid') {
            clearInterval(timer);
            store(guard, 1);
            track('Purchase', {
              value: value != null ? value : (d.value != null ? parseFloat(d.value) : undefined),
              txid: txid
            });
            log('pagamento confirmado, Purchase disparado', txid);
          }
        })
        .catch(function () { /* rede falhou, tenta de novo no próximo ciclo */ });
    }, CONFIG.watchInterval);
  }

  window.fbtk = { track: track, setUser: setUser, watchPayment: watchPayment, userData: function () { return userData; } };


  track('PageView', {});

  var path = location.pathname + location.search;
  for (var i = 0; i < CONFIG.rules.length; i++) {
    if (CONFIG.rules[i].match.test(path)) {
      var ev = CONFIG.rules[i].event;
      var data = {};
      if (ev === 'Purchase' || ev === 'InitiateCheckout') {
        var v = getParam(CONFIG.valueParams);
        if (v) data.value = parseFloat(String(v).replace(',', '.'));
        var tx = getParam(CONFIG.txidParams);
        if (tx) data.txid = tx;
        if (ev === 'Purchase' && !v) { log('Purchase sem valor na URL — dispare manualmente com fbtk.track'); }
      }
      track(ev, data);
     
      if (ev === 'InitiateCheckout' && CONFIG.autoWatch && data.txid) {
        watchPayment(data.txid, data.value);
      }
      break; 
    }
  }
})();