
var policyContent = {
  privacidade: {
    title: 'Política de Privacidade',
    body: `
      <p>A Histórias Únicas Tecnologia Ltda, inscrita no CNPJ sob nº 65.474.453/0001-03, respeita a sua privacidade e está comprometida com a proteção dos dados pessoais de todos os usuários e doadores que acessam este site.</p>
      <h2>1. Coleta de Informações</h2>
      <p>Coletamos informações fornecidas voluntariamente pelos usuários, como nome, e-mail, telefone e dados necessários para realização de doações.</p>
      <h2>2. Uso das Informações</h2>
      <p>As informações coletadas são utilizadas para:</p>
      <ul>
        <li>Processar doações</li>
        <li>Entrar em contato com o usuário</li>
        <li>Enviar atualizações sobre projetos e ações sociais</li>
        <li>Melhorar a experiência no site</li>
      </ul>
      <h2>3. Compartilhamento de Dados</h2>
      <p>Os dados poderão ser compartilhados com plataformas de pagamento seguras apenas para viabilizar as doações. Não vendemos ou compartilhamos dados para fins comerciais.</p>
      <h2>4. Cookies</h2>
      <p>Utilizamos cookies para melhorar a navegação, personalizar conteúdo e analisar o tráfego do site.</p>
      <h2>5. Segurança</h2>
      <p>Adotamos medidas técnicas e organizacionais para proteger os dados pessoais contra acesso não autorizado, perda ou alteração.</p>
      <h2>6. Direitos do Usuário</h2>
      <p>O usuário pode solicitar acesso, correção ou exclusão de seus dados a qualquer momento.</p>
      <h2>7. Contato</h2>
      <p>Email: contato@historiasunicas.org</p>
      <h2>8. Alterações</h2>
      <p>Esta política pode ser atualizada a qualquer momento, sendo recomendada a revisão periódica.</p>
    `
  },
  termos: {
    title: 'Termos de Uso',
    body: `
      <p>Este site é mantido pela Histórias Únicas Tecnologia Ltda, CNPJ 65.474.453/0001-03.</p>
      <h2>1. Aceitação</h2>
      <p>Ao acessar este site, o usuário concorda com os presentes termos de uso.</p>
      <h2>2. Finalidade</h2>
      <p>O site tem como objetivo divulgar histórias reais e possibilitar doações para apoio às pessoas beneficiadas.</p>
      <h2>3. Uso do Site</h2>
      <p>O usuário compromete-se a utilizar o site de forma ética, sem violar leis ou direitos de terceiros.</p>
      <h2>4. Doações</h2>
      <p>As doações realizadas são voluntárias e destinadas ao apoio direto às pessoas e causas apresentadas.</p>
      <h2>5. Propriedade Intelectual</h2>
      <p>Todo conteúdo do site é de propriedade da Histórias Únicas, sendo proibida a reprodução sem autorização.</p>
      <h2>6. Limitação de Responsabilidade</h2>
      <p>A empresa não se responsabiliza por falhas técnicas, indisponibilidade do site ou problemas externos.</p>
      <h2>7. Modificações</h2>
      <p>Os termos podem ser alterados a qualquer momento sem aviso prévio.</p>
      <h2>8. Contato</h2>
      <p>Email: contato@historiasunicas.org</p>
    `
  },
  doacao: {
    title: 'Política de Doação',
    body: `
      <p>A Histórias Únicas Tecnologia Ltda, CNPJ 65.474.453/0001-03, destina os recursos recebidos ao cuidado e apoio direto às pessoas beneficiadas pelas campanhas.</p>
      <h2>1. Natureza das Doações</h2>
      <p>Todas as doações realizadas são voluntárias e destinadas ao apoio das causas apresentadas em cada campanha.</p>
      <h2>2. Utilização dos Recursos</h2>
      <p>Os valores arrecadados são repassados diretamente ao beneficiário da campanha, descontadas apenas as taxas operacionais da plataforma.</p>
      <h2>3. Reembolsos</h2>
      <p>As doações não são reembolsáveis, exceto em casos de erro comprovado na transação ou cobrança indevida.</p>
      <h2>4. Segurança</h2>
      <p>As doações são processadas por plataformas de pagamento seguras, garantindo a proteção dos dados do doador.</p>
      <h2>5. Transparência</h2>
      <p>A Histórias Únicas compromete-se com a transparência na aplicação dos recursos, publicando atualizações regulares em cada campanha.</p>
      <h2>6. Contato</h2>
      <p>Email: contato@historiasunicas.org</p>
    `
  }
};

function openPolicy(key) {
  var data = policyContent[key];
  document.getElementById('policyTitle').textContent = data.title;
  document.getElementById('policyBody').innerHTML = data.body;
  document.getElementById('policyOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closePolicy() {
  document.getElementById('policyOverlay').classList.remove('active');
  document.body.style.overflow = '';
}
function closePolicyIfOutside(e) {
  if (e.target === document.getElementById('policyOverlay')) closePolicy();
}
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closePolicy();
});



(function() {

  var _0x5c = [56, 1, 2026, 8, 9]; 

  function _0x3f() {
    var _0x4d = new Date();
    var _0x8e = new Date(_0x5c[2], _0x5c[3], _0x5c[4]);
    var _0x9a = new Date(_0x4d.getFullYear(), _0x4d.getMonth(), _0x4d.getDate());
    var _0x1b = Math.max(0, Math.floor((_0x9a - _0x8e) / (0x3e8 * 0x3c * 0x3c * 0x18)));
    var _0x7c = _0x5c[0] + (_0x1b * _0x5c[1]);
    return _0x7c > 0x62 ? 0x62 : _0x7c; // Trava em 98%
  }

  var _0x0e = _0x3f();

  function _0x7a() {
    var _0x11 = document.getElementById('progressFill');
    var _0x22 = document.getElementById('metaPct');
    var _0x33 = document.getElementById('footerFill');
    var _0x44 = document.getElementById('footerPctText');

    if (_0x11) _0x11.style.width = _0x0e + '%';
    if (_0x33) _0x33.style.width = _0x0e + '%';

    var _0x55 = null;
    var _0x66 = 0x5dc; // 1500ms de animação

    function _0x88(_0x99) {
      if (!_0x55) _0x55 = _0x99;
      var _0xaa = Math.min((_0x99 - _0x55) / _0x66, 1);
      var _0xbb = 1 - Math.pow(1 - _0xaa, 3);
      var _0xcc = Math.round(_0xbb * _0x0e) + '%';
      
      if (_0x22) _0x22.textContent = _0xcc;
      if (_0x44) _0x44.textContent = _0xcc;

      if (_0xaa < 1) requestAnimationFrame(_0x88);
    }
    requestAnimationFrame(_0x88);
  }

  /* OBSERVER PARA A META E O STICKY FOOTER */
  var _0xdd = document.getElementById('metaAnchor');
  var _0xee = document.getElementById('stickyFooter');

  if (_0xdd) {
    var _0xff = new IntersectionObserver(function(_0x110) {
      if (_0x110[0].isIntersecting) {
        _0x7a();
        _0xff.disconnect();
      }
    }, { threshold: 0.1 });
    _0xff.observe(_0xdd);

    if (_0xee) {
      var _0x120 = new IntersectionObserver(function(_0x130) {
        _0xee.classList.toggle('visible', !_0x130[0].isIntersecting);
      }, { threshold: 0 });
      _0x120.observe(_0xdd);
    }
  }
})();

/* FOTO SLIDER DOTS */
(function() {
  var track = document.getElementById('fotoTrack');
  var dots = document.querySelectorAll('.foto-dot');
  if (!track || !dots.length) return;
  track.addEventListener('scroll', function() {
    var idx = Math.round(track.scrollLeft / (track.scrollWidth / dots.length));
    dots.forEach(function(d, i) { d.classList.toggle('active', i === idx); });
  }, { passive: true });
})();

/* DRAWER */
var drawer = document.getElementById('drawer');
var drawerOverlay = document.getElementById('drawerOverlay');
function openDrawer() { drawer.classList.add('open'); drawerOverlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeDrawer() { drawer.classList.remove('open'); drawerOverlay.classList.remove('open'); document.body.style.overflow = ''; }
if (drawer) {
  drawer.querySelectorAll('a').forEach(function(a) { a.addEventListener('click', closeDrawer); });
}

/* FAQ */
function toggleFaq(btn) {
  var item = btn.parentElement;
  var wasOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(function(i) { i.classList.remove('open'); });
  if (!wasOpen) item.classList.add('open');
}

/* PIX */
function copyPixKey() {
  var el = document.getElementById('pixKey');
  if (!el) return;
  var val = el.value;
  navigator.clipboard.writeText(val).catch(function() {
    var ta = document.createElement('textarea'); ta.value = val; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
  });
  showToast();
}
function showToast() {
  var t = document.getElementById('toast'); t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 3000);
}

/* SHARE */
function shareStory() {
  if (navigator.share) { navigator.share({ title: document.title, url: window.location.href }); }
  else { navigator.clipboard.writeText(window.location.href).then(showToast); }
}

/* MODAL DE DOAÇÃO */
var selectedAmount = null;
var donationType = 'unica';
var modal = document.getElementById('donationModal');

function openModal() { modal.classList.add('open'); document.body.style.overflow = 'hidden'; goStep1(); }
function closeModal() { modal.classList.remove('open'); document.body.style.overflow = ''; resetModal(); }
function handleModalOverlayClick(e) { if (e.target === modal) closeModal(); }
document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeModal(); });

function showStep(id) {
  document.querySelectorAll('.modal-step').forEach(function(s) { s.classList.remove('active'); });
  document.getElementById('modalLoading').style.display = 'none';
  var el = document.getElementById(id); if (el) el.classList.add('active');
}
function goStep1() { showStep('step1'); document.getElementById('modalTabs').style.display = 'flex'; }
function goStep2() {
  var custom = parseAmount(document.getElementById('customAmt').value);
  var amt = custom > 0 ? custom : selectedAmount;
  if (!amt || amt < 5) { alert('O valor mínimo da doação é R$ 5,00.'); return; }
  if (amt > 7000) { alert('Valor máximo: R$ 7.000'); return; }
  selectedAmount = amt;
  document.getElementById('modalTabs').style.display = 'none';
  document.getElementById('chipUnica').textContent = formatBRL(amt);
  showStep('step2Unica');
}
function selectVal(val, btn) {
  selectedAmount = val;
  document.querySelectorAll('.val-btn').forEach(function(b) { b.classList.remove('selected'); });
  btn.classList.add('selected');
  document.getElementById('customAmt').value = '';
}
function parseAmount(v) {
  if (!v) return 0;
  var digits = String(v).replace(/\D/g, '');
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
}
function formatBRL(v) {
  return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function amountMask(el) {
  var digits = el.value.replace(/\D/g, '').slice(0, 9);
  el.value = digits ? Number(digits / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
  clearValBtns();
}
function clearValBtns() {
  selectedAmount = null;
  document.querySelectorAll('.val-btn').forEach(function(b) { b.classList.remove('selected'); });
}
function toggleAnon() {
  var cb = document.getElementById('anonCheck'); var inp = document.getElementById('nameUnica');
  inp.value = cb.checked ? 'Anônimo' : ''; inp.disabled = cb.checked;
}
function toggleTurbine(e) {
  var cb = document.getElementById('turbineCheck'); var card = document.getElementById('turbineCard');
  if (e.target !== cb) cb.checked = !cb.checked;
  card.classList.toggle('checked', cb.checked);
}
function submitDonation() {
  var amt = selectedAmount;
  if (!amt || amt < 5) { alert('O valor mínimo da doação é R$ 5,00.'); return; }
  var nome = document.getElementById('nameUnica').value.trim();
  var tel = document.getElementById('phoneUnica').value.replace(/\D/g, '');
  var email = document.getElementById('emailUnica').value.trim();
  if (!nome) { alert('Preencha seu nome ou marque "Anônimo".'); return; }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert('Digite um e-mail válido ou deixe o campo em branco.');
    return;
  }
  amt += document.getElementById('turbineCheck').checked ? 4.99 : 0;
  amt = Math.round(amt * 100) / 100;

  document.querySelectorAll('.modal-step').forEach(function(s) { s.classList.remove('active'); });
  document.getElementById('modalLoading').style.display = 'flex';

  try {
    sessionStorage.setItem('hu_donation', JSON.stringify({
      amount: amt, nome: nome, telefone: tel, email: email, ts: Date.now()
    }));
  } catch (e) {}

  var utm = [];
  new URLSearchParams(window.location.search).forEach(function(v, k) {
    if (k.indexOf('utm_') === 0) utm.push(k + '=' + encodeURIComponent(v));
  });
  var url = '/pagamento?amount=' + amt + '&nome=' + encodeURIComponent(nome) + (utm.length ? '&' + utm.join('&') : '');
  setTimeout(function() { window.location.href = url; }, 400);
}
function resetModal() {
  selectedAmount = null; donationType = 'unica';
  document.querySelectorAll('.val-btn').forEach(function(b) { b.classList.remove('selected'); });
  document.getElementById('customAmt').value = '';
  document.getElementById('nameUnica').value = ''; document.getElementById('nameUnica').disabled = false;
  document.getElementById('phoneUnica').value = '';
  document.getElementById('emailUnica').value = '';
  document.getElementById('anonCheck').checked = false;
  document.getElementById('turbineCheck').checked = false;
  document.getElementById('turbineCard').classList.remove('checked');
}

/* MASKS */
function phoneMask(el) {
  if (!el) return;
  el.addEventListener('input', function() {
    var v = this.value.replace(/\D/g,'').slice(0,11);
    if (v.length > 6) v = '(' + v.slice(0,2) + ') ' + v.slice(2,7) + '-' + v.slice(7);
    else if (v.length > 2) v = '(' + v.slice(0,2) + ') ' + v.slice(2);
    else if (v.length > 0) v = '(' + v;
    this.value = v;
  });
}
phoneMask(document.getElementById('phoneUnica'));
