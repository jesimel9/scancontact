// ============================================================
//  app.js : petites fonctions du site ScanContact
//  - apparition douce des blocs au défilement
//  - lien de téléchargement (depuis config.js)
//  - QR code "ouvrir sur mon téléphone" (sur ordinateur)
//  - statistiques : visites, téléchargements, clics « don » (Supabase)
//  - bouton de don Wave et formulaire de suggestion
// ============================================================
(function () {
  var cfg = window.SCANCONTACT || {};

  // ---------- Apparition au défilement ----------
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var blocks = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    blocks.forEach(function (b) { b.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    blocks.forEach(function (b) { io.observe(b); });
  }

  // ---------- Téléchargement ----------
  var apk = (cfg.apk && cfg.apk.recommande) || {};
  var link = document.getElementById('lien-apk');
  if (link && apk.url) link.href = apk.url;
  document.querySelectorAll('[data-taille]').forEach(function (el) {
    el.textContent = apk.taille ? '(' + apk.taille + ')' : '';
  });
  var compat = (cfg.apk && cfg.apk.compatible) || {};
  var link2 = document.getElementById('lien-apk-compatible');
  if (link2 && compat.url) link2.href = compat.url;
  document.querySelectorAll('[data-taille-compatible]').forEach(function (el) {
    el.textContent = compat.taille ? '(' + compat.taille + ')' : '';
  });
  if (link2) {
    link2.addEventListener('click', function () { logEvent('telechargement', 'apk-compatible'); });
  }
  document.querySelectorAll('[data-version]').forEach(function (el) {
    el.textContent = cfg.version || el.textContent;
  });
  document.querySelectorAll('[data-annee]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // ---------- Statistiques (si Supabase est configuré) ----------
  function logEvent(type, variant) {
    if (!cfg.supabaseUrl || !cfg.supabaseKey || !window.fetch) return;
    try {
      fetch(cfg.supabaseUrl.replace(/\/$/, '') + '/rest/v1/rpc/log_site_event', {
        method: 'POST',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
          apikey: cfg.supabaseKey,
          Authorization: 'Bearer ' + cfg.supabaseKey,
        },
        body: JSON.stringify({ p_type: type, p_variant: variant || null }),
      }).catch(function () {});
    } catch (e) { /* jamais bloquant */ }
  }
  // Une visite par session de navigation
  try {
    if (!sessionStorage.getItem('sc-visite')) {
      sessionStorage.setItem('sc-visite', '1');
      logEvent('visite', document.referrer ? 'lien' : 'direct');
    }
  } catch (e) { logEvent('visite'); }
  if (link) {
    link.addEventListener('click', function () { logEvent('telechargement', 'apk'); });
  }

  // ---------- Don avec Wave ----------
  var don = cfg.don || {};
  var linkDon = document.getElementById('lien-don');
  if (linkDon) {
    if (don.url) linkDon.href = don.url;
    linkDon.addEventListener('click', function () { logEvent('don', 'site'); });
  }
  document.querySelectorAll('[data-don-montant]').forEach(function (el) {
    el.textContent = don.montant || el.textContent;
  });

  // ---------- Formulaire de suggestion ----------
  var form = document.getElementById('form-idee');
  if (form) {
    var area = document.getElementById('idee-message');
    var count = document.getElementById('idee-compteur');
    var status = document.getElementById('idee-statut');
    var submit = document.getElementById('idee-envoyer');
    var EMAIL = 'yjesimel4@gmail.com';

    var setStatus = function (text, ok) {
      status.textContent = text;
      status.className = 'form__status ' + (ok ? 'is-ok' : 'is-err');
    };
    area.addEventListener('input', function () {
      count.textContent = area.value.length + ' / 1000';
      if (area.value.trim().length >= 3) area.removeAttribute('aria-invalid');
    });

    // Sans serveur (ou s'il ne répond pas) : on ouvre l'e-mail
    var sendByEmail = function (kind, message, name) {
      var body = message + '\n\n— ' + (name || 'Un visiteur du site');
      location.href = 'mailto:' + EMAIL +
        '?subject=' + encodeURIComponent('Suggestion ScanContact (' + kind + ')') +
        '&body=' + encodeURIComponent(body);
      setStatus("Votre application e-mail s'ouvre : il ne reste qu'à appuyer sur Envoyer.", true);
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.elements.site.value) return; // robot
      var kind = (form.querySelector('input[name="type"]:checked') || {}).value || 'Idée';
      var message = area.value.trim();
      var name = form.elements.nom.value.trim();
      var email = form.elements.email.value.trim();
      if (message.length < 3) {
        area.setAttribute('aria-invalid', 'true');
        setStatus('Écrivez votre suggestion (au moins 3 caractères).', false);
        area.focus();
        return;
      }
      if (email && !form.elements.email.checkValidity()) {
        setStatus("L'adresse e-mail ne semble pas valide.", false);
        form.elements.email.focus();
        return;
      }
      if (!cfg.supabaseUrl || !cfg.supabaseKey || !window.fetch) {
        sendByEmail(kind, message, name);
        return;
      }
      submit.disabled = true;
      setStatus('Envoi en cours…', true);
      fetch(cfg.supabaseUrl.replace(/\/$/, '') + '/rest/v1/rpc/submit_suggestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: cfg.supabaseKey,
          Authorization: 'Bearer ' + cfg.supabaseKey,
        },
        body: JSON.stringify({
          p_message: '[' + kind + '] ' + message,
          p_name: name || null,
          p_email: email || null,
          p_source: 'site',
        }),
      }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        form.reset();
        count.textContent = '0 / 1000';
        setStatus('Merci ! Votre suggestion a bien été envoyée au créateur.', true);
      }).catch(function () {
        sendByEmail(kind, message, name);
      }).then(function () { submit.disabled = false; });
    });
  }

  // ---------- QR "ouvrir sur mon téléphone" (ordinateur seulement) ----------
  function showQr() {
    var zone = document.getElementById('qr-zone');
    var isPhone = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
    if (!zone || isPhone || location.protocol.indexOf('http') !== 0 || !window.qrcode) return;
    var qr = window.qrcode(0, 'M');
    qr.addData(location.origin + location.pathname + '#telecharger');
    qr.make();
    document.getElementById('qr').innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
    zone.hidden = false;
  }
  if (document.readyState === 'complete') showQr();
  else window.addEventListener('load', showQr);
})();
