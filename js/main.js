(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* en-tete */
  var header = $('.header'), burger = $('.burger');
  function hh() { document.documentElement.style.setProperty('--hh', header.offsetHeight + 'px'); }
  function solid() { header.classList.toggle('solid', window.scrollY > 40); }
  if ($('#top-hero')) header.classList.add('home');
  window.addEventListener('scroll', solid, { passive: true }); solid();
  if (burger) {
    burger.addEventListener('click', function () {
      var o = header.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(o));
    });
    $$('.links a').forEach(function (a) { a.addEventListener('click', function () { header.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }); });
  }

  /* ouvert / ferme, heure de Paris */
  function parisNow() {
    try {
      var p = {};
      new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
      return { d: p.weekday, h: (+p.hour % 24) + (+p.minute) / 60 };
    } catch (e) { var n = new Date(); return { d: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][n.getDay()], h: n.getHours() + n.getMinutes() / 60 }; }
  }
  var now = parisNow(), open = now.d !== 'dimanche' && now.h >= 9 && now.h < 19;
  $$('.status').forEach(function (el) {
    el.classList.add(open ? 'ok' : 'ko');
    $('span', el).textContent = open ? 'Ouvert jusqu’à 19h' : (now.d === 'dimanche' ? 'Fermé, ouvre lundi à 9h' : (now.h < 9 ? 'Fermé, ouvre à 9h' : 'Fermé, ouvre demain à 9h'));
  });
  $$('.hours li').forEach(function (li) { if (li.dataset.d && li.dataset.d.split(',').indexOf(now.d) > -1) li.classList.add('today'); });

  /* apparition douce */
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    $$('.mv').forEach(function (el) { io.observe(el); });
  } else { $$('.mv').forEach(function (el) { el.classList.add('in'); }); }

  /* parallaxe douce de la photo du hero */
  var plate = $('#plate'), lh = $('#top-hero');
  if (plate && lh && !reduce && window.matchMedia('(min-width: 901px)').matches) {
    var img = $('img', plate), px = 0, py = 0, tx = 0, ty = 0, raf = 0;
    var tick = function () { px += (tx - px) * .08; py += (ty - py) * .08; plate.style.translate = (px * -14).toFixed(2) + 'px ' + (py * -10).toFixed(2) + 'px'; if (img) img.style.transform = 'scale(1.05) translate(' + (px * 8).toFixed(2) + 'px,' + (py * 6).toFixed(2) + 'px)'; raf = (Math.abs(tx - px) > .002 || Math.abs(ty - py) > .002) ? requestAnimationFrame(tick) : 0; };
    lh.addEventListener('pointermove', function (e) { var r = lh.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width - .5; ty = (e.clientY - r.top) / r.height - .5; if (!raf) raf = requestAnimationFrame(tick); });
    lh.addEventListener('pointerleave', function () { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(tick); });
  }

  /* boutons aimantes */
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    $$('.btn').forEach(function (b) {
      b.addEventListener('pointermove', function (e) { var r = b.getBoundingClientRect(); b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .18).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * .28 - 2).toFixed(1) + 'px)'; });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  }

  /* toujours en haut a l'arrivee */
  if (!location.hash) {
    var rt = document.documentElement, sb = rt.style.scrollBehavior, forced = true, tries = 0;
    rt.style.scrollBehavior = 'auto';
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function (ev) { window.addEventListener(ev, function () { forced = false; }, { passive: true, once: true }); });
    var iv = setInterval(function () {
      if (!forced || ++tries > 60) { clearInterval(iv); rt.style.scrollBehavior = sb; return; }
      if (window.scrollY > 0) window.scrollTo(0, 0);
    }, 50);
  }

  /* transitions de page : le rideau avec le logo et son reflet */
  var curtain = $('#curtain'), root = document.documentElement;
  if (curtain && root.classList.contains('pt')) {
    var first = !root.classList.contains('arr'), hold = first ? 1000 : 150, t0 = Date.now(), fired = false;
    var reveal = function () {
      if (fired) return; fired = true;
      setTimeout(function () {
        curtain.classList.add('out');
        setTimeout(function () { root.classList.remove('pt'); curtain.classList.remove('out'); }, 650);
      }, Math.max(0, hold - (Date.now() - t0)));
    };
    if (document.readyState !== 'loading') reveal(); else document.addEventListener('DOMContentLoaded', reveal);
    setTimeout(reveal, 2200);
  }
  document.addEventListener('click', function (e) {
    if (!curtain || reduce || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || /^(mailto:|tel:|https?:|\/\/)/i.test(href) || !/\.html(#.*)?$/.test(href)) return;
    var url = new URL(a.href, location.href);
    if (url.pathname === location.pathname) return;
    e.preventDefault();
    try { sessionStorage.setItem('fc-nav', '1'); } catch (_) {}
    root.classList.add('pt'); curtain.classList.remove('out'); curtain.classList.add('pre');
    void curtain.offsetWidth;
    curtain.classList.remove('pre'); curtain.classList.add('go');
    setTimeout(function () { location.href = url.href; }, 560);
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted && curtain) { root.classList.remove('pt'); curtain.className = 'curtain'; } });

  /* cartes : projecteur */
  $$('.card').forEach(function (c) {
    c.addEventListener('pointermove', function (e) { var r = c.getBoundingClientRect(); c.style.setProperty('--x', (e.clientX - r.left) + 'px'); c.style.setProperty('--y', (e.clientY - r.top) + 'px'); });
  });
  $$('[data-pick]').forEach(function (a) { a.addEventListener('click', function () { try { sessionStorage.setItem('fc-formule', a.dataset.pick); } catch (e) {} }); });

  /* prix HT / TTC */
  var spans2 = $$('[data-ht]');
  if (spans2.length && $('#btnHT')) {
    var cur = spans2.map(function (s) { return +s.dataset.ht; });
    var setTVA = function (on) {
      $('#btnHT').setAttribute('aria-pressed', String(!on)); $('#btnTTC').setAttribute('aria-pressed', String(on));
      $$('.u').forEach(function (u) { u.textContent = on ? 'TTC' : 'HT'; });
      spans2.forEach(function (s, i) {
        var to = +s.dataset.ht * (on ? 1.2 : 1), from = cur[i], t0 = performance.now(), D = reduce ? 1 : 450;
        (function step(n) {
          var t = Math.min(1, (n - t0) / D), e = 1 - Math.pow(1 - t, 3), v = from + (to - from) * e;
          s.textContent = String(Math.round(v));
          if (t < 1) requestAnimationFrame(step); else { cur[i] = to; s.textContent = String(Math.round(to * 100) / 100).replace('.', ','); }
        })(t0);
      });
    };
    $('#btnHT').onclick = function () { setTVA(false); };
    $('#btnTTC').onclick = function () { setTVA(true); };
  }

  /* test hydrophobe */
  var wc = $('#water');
  if (wc) {
    var wg = wc.getContext('2d'), trail = document.createElement('canvas'), tg = trail.getContext('2d'), bgc = document.createElement('canvas');
    var WW = 0, WH = 0, DPR = 1, drops = [], ceramic = false, raining = false, hintOn = true;
    var wsize = function () {
      DPR = Math.min(window.devicePixelRatio || 1, 2); WW = wc.clientWidth; WH = wc.clientHeight;
      wc.width = trail.width = bgc.width = Math.round(WW * DPR); wc.height = trail.height = bgc.height = Math.round(WH * DPR);
      var g = bgc.getContext('2d'); g.setTransform(DPR, 0, 0, DPR, 0, 0);
      var b = g.createLinearGradient(0, 0, WW * .4, WH); b.addColorStop(0, '#0e2554'); b.addColorStop(.6, '#071433'); b.addColorStop(1, '#03060f');
      g.fillStyle = b; g.fillRect(0, 0, WW, WH);
      var r1 = g.createRadialGradient(WW * .8, 0, 0, WW * .8, 0, WW * .7); r1.addColorStop(0, 'rgba(0,102,255,.7)'); r1.addColorStop(1, 'rgba(0,102,255,0)'); g.fillStyle = r1; g.fillRect(0, 0, WW, WH);
      var r2 = g.createRadialGradient(WW * .1, WH, 0, WW * .1, WH, WW * .5); r2.addColorStop(0, 'rgba(255,59,48,.45)'); r2.addColorStop(1, 'rgba(255,59,48,0)'); g.fillStyle = r2; g.fillRect(0, 0, WW, WH);
      g.save(); g.rotate(-.1); var s1 = g.createLinearGradient(0, 0, WW, 0); s1.addColorStop(0, 'rgba(255,255,255,0)'); s1.addColorStop(.5, 'rgba(255,255,255,.22)'); s1.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = s1; g.fillRect(-WW * .1, WH * .35, WW * 1.3, WH * .06); g.restore();
      tg.setTransform(DPR, 0, 0, DPR, 0, 0); drops = []; tg.clearRect(0, 0, WW, WH);
    };
    var spawn = function (x, y, n) {
      for (var i = 0; i < n; i++) {
        if (drops.length > 420) drops.shift();
        var a = Math.random() * 6.28, d = Math.random() * 26;
        drops.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, r: ceramic ? 2 + Math.random() * 2.6 : 3 + Math.random() * 4.5, vy: 0 });
      }
    };
    var hideHint = function () { if (hintOn) { hintOn = false; $('#labhint').style.opacity = 0; } };
    wc.addEventListener('pointermove', function (e) { var r = wc.getBoundingClientRect(); spawn(e.clientX - r.left, e.clientY - r.top, 2); hideHint(); });
    wc.addEventListener('pointerdown', function (e) { var r = wc.getBoundingClientRect(); spawn(e.clientX - r.left, e.clientY - r.top, 10); hideHint(); });
    var wstep = function () {
      if (raining) spawn(Math.random() * WW, Math.random() * WH * .7, 2);
      var slideAt = ceramic ? 4.6 : 10.5;
      for (var i = 0; i < drops.length; i++) {
        var d = drops[i];
        for (var j = i + 1; j < drops.length; j++) {
          var o = drops[j], dx = o.x - d.x, dy = o.y - d.y, rr = d.r + o.r;
          if (dx * dx + dy * dy < rr * rr * .55) {
            var a1 = d.r * d.r, a2 = o.r * o.r, t = a1 + a2;
            d.x = (d.x * a1 + o.x * a2) / t; d.y = (d.y * a1 + o.y * a2) / t; d.r = Math.sqrt(t); d.vy = Math.max(d.vy, o.vy);
            drops.splice(j, 1); j--;
          }
        }
        var px = d.x, py = d.y;
        if (d.r >= slideAt) {
          d.vy += ceramic ? .5 : .045; d.vy *= ceramic ? .985 : .9; if (!ceramic) d.vy = Math.min(d.vy, .9);
          d.y += d.vy; if (ceramic) d.x += Math.sin(d.y * .05) * .15;
          if (!ceramic) { tg.strokeStyle = 'rgba(190,210,240,.16)'; tg.lineWidth = d.r * .9; tg.lineCap = 'round'; tg.beginPath(); tg.moveTo(px, py); tg.lineTo(d.x, d.y); tg.stroke(); }
        }
        if (d.y > WH + 20) { drops.splice(i, 1); i--; }
      }
    };
    var wdraw = function () {
      wg.setTransform(1, 0, 0, 1, 0, 0); wg.drawImage(bgc, 0, 0); wg.drawImage(trail, 0, 0); wg.setTransform(DPR, 0, 0, DPR, 0, 0);
      for (var i = 0; i < drops.length; i++) {
        var d = drops[i];
        if (ceramic) {
          var g = wg.createRadialGradient(d.x - d.r * .3, d.y - d.r * .35, 0, d.x, d.y, d.r);
          g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(.25, 'rgba(160,200,255,.4)'); g.addColorStop(1, 'rgba(30,70,160,.55)');
          wg.fillStyle = g; wg.beginPath(); wg.arc(d.x, d.y, d.r, 0, 6.3); wg.fill(); wg.strokeStyle = 'rgba(255,255,255,.55)'; wg.lineWidth = .8; wg.stroke();
          wg.fillStyle = 'rgba(255,255,255,.95)'; wg.beginPath(); wg.arc(d.x - d.r * .35, d.y - d.r * .4, Math.max(.7, d.r * .2), 0, 6.3); wg.fill();
        } else {
          wg.fillStyle = 'rgba(200,215,235,.2)'; wg.beginPath(); wg.ellipse(d.x, d.y, d.r * 1.25, d.r * .95, 0, 0, 6.3); wg.fill(); wg.strokeStyle = 'rgba(255,255,255,.24)'; wg.lineWidth = 1; wg.stroke();
        }
      }
    };
    var mode = function (c) { ceramic = c; $('#mNu').setAttribute('aria-pressed', String(!c)); $('#mCer').setAttribute('aria-pressed', String(c)); drops = []; tg.clearRect(0, 0, WW, WH); };
    $('#mNu').onclick = function () { mode(false); }; $('#mCer').onclick = function () { mode(true); };
    $('#clear').onclick = function () { drops = []; tg.clearRect(0, 0, WW, WH); };
    $('#rain').onclick = function () { raining = !raining; this.setAttribute('aria-pressed', String(raining)); hideHint(); };
    wsize();
    (function wloop() { wstep(); wdraw(); requestAnimationFrame(wloop); })();
    var wt; window.addEventListener('resize', function () { clearTimeout(wt); wt = setTimeout(wsize, 150); });
    setTimeout(function () { spawn(WW * .3, WH * .3, 14); spawn(WW * .7, WH * .25, 12); }, 300);
  }

  /* formulaire (demo, aucun envoi) */
  var form = $('#form');
  if (form) {
    try { var f = sessionStorage.getItem('fc-formule'); if (f && $('#formule')) $('#formule').value = f; } catch (e) {}
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = $('#note'), nom = $('#nom').value.trim(), em = $('#email').value.trim();
      if (!nom || !/.+@.+\..+/.test(em)) { n.className = 'note'; n.textContent = 'Indique ton nom et un e-mail valide.'; return; }
      n.className = 'note ok'; n.textContent = 'Page de démonstration. Rien n’a été envoyé.';
    });
  }

  hh(); window.addEventListener('resize', hh);
})();
