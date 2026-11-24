(function () {
  'use strict';

  var QUOTES = [
    { title: '“A Zenith transformou nossa formatura em algo inesquecível.”', body: 'Do início ao fim, a equipe foi impecável. Cada detalhe superou nossas expectativas e tornou esse momento ainda mais especial para toda a turma.', who: 'Aluna', meta: 'Medicina 2024', initial: 'A' },
    { title: '“Pudemos viver a noite sem pensar nos bastidores.”', body: 'A comissão teve apoio em cada decisão, e no dia tudo aconteceu exatamente como planejamos.', who: 'Comissão de formatura', meta: 'Curso · Ano', initial: 'C' },
    { title: '“Cada entrada, cada música, no tempo certo.”', body: 'A produção cuidou de tudo com calma e precisão. As famílias comentam até hoje.', who: 'Formando', meta: 'Curso · Ano', initial: 'F' }
  ];

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var mq = window.matchMedia('(max-width: 819px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var state = { q: 0, menu: false, reel: false, sound: false, mobile: mq.matches };
  var lenis = null, auto = null, qBusy = false, tInView = false, flip = null;

  /* ---------- helpers ---------- */
  function playVideos() {
    $$('video[data-bgvideo]').forEach(function (v) {
      v.muted = true; v.playsInline = true; v.loop = true;
      var p = v.play && v.play(); if (p && p.catch) p.catch(function () {});
    });
  }

  function setMenu(open) {
    state.menu = open && state.mobile;
    var menu = $('#mobile-menu'), btn = $('#menu-toggle');
    if (menu) menu.hidden = !state.menu;
    if (btn) { btn.textContent = state.menu ? 'Fechar' : 'Menu'; btn.setAttribute('aria-expanded', String(state.menu)); }
  }

  function setReel(open) {
    state.reel = open;
    var box = $('#reel'), v = $('#reel-video');
    if (!box || !v) return;
    box.hidden = !open;
    if (open) { v.src = v.dataset.src; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    else { v.pause(); v.removeAttribute('src'); v.load(); }
    if (lenis) open ? lenis.stop() : lenis.start();
    else document.documentElement.style.overflow = open ? 'hidden' : '';
  }

  function toggleSound() {
    var on = !state.sound; state.sound = on;
    var v = $('video[data-herovideo]');
    if (v) { v.muted = !on; if (on) { v.volume = 0.6; var p = v.play(); if (p && p.catch) p.catch(function () {}); } }
    var label = on ? 'Desativar som' : 'Ativar som';
    $$('[data-sound-label]').forEach(function (n) { n.textContent = label; });
    $$('[data-sound]').forEach(function (n) { n.setAttribute('aria-label', label); });
    var bars = $$('[data-eq] > span');
    if (window.gsap && bars.length) {
      gsap.killTweensOf(bars);
      if (on) bars.forEach(function (b, i) { gsap.to(b, { scaleY: 0.35 + Math.random() * 0.65, duration: 0.35 + i * 0.07, ease: 'sine.inOut', repeat: -1, yoyo: true }); });
      else gsap.to(bars, { scaleY: 0.25, duration: 0.4, ease: 'power2.out' });
    }
  }

  function goTo(href) {
    setMenu(false);
    var t = href === '#top' ? 0 : $(href);
    if (t === null) return;
    if (lenis) lenis.scrollTo(t, { duration: 1.8 });
    else window.scrollTo({ top: t === 0 ? 0 : t.getBoundingClientRect().top + window.scrollY, behavior: reduce ? 'auto' : 'smooth' });
  }

  /* ---------- testimonials ---------- */
  function renderQuote() {
    var q = QUOTES[state.q];
    $$('[data-q]').forEach(function (el) {
      var k = el.dataset.q;
      el.textContent = k === 'index' ? String(state.q + 1).padStart(2, '0') : q[k];
    });
    var sec = $('[data-tsec]');
    if (sec) sec.style.flexDirection = state.mobile ? 'column' : (state.q % 2 ? 'row-reverse' : 'row');
    if (reduce || !window.gsap) {
      $$('[data-tlayer]').forEach(function (l) { l.style.opacity = (+l.dataset.tlayer === state.q) ? 1 : 0; });
    }
  }

  function goQuote(n) {
    if (n === state.q || qBusy) return;
    var prev = state.q;
    if (!window.gsap || reduce) { state.q = n; renderQuote(); return; }
    qBusy = true;
    if (auto) auto.pause();
    gsap.killTweensOf('[data-quote] > *');
    gsap.to('[data-quote] > *', { y: -18, autoAlpha: 0, duration: 0.55, stagger: 0.05, ease: 'power2.in', overwrite: true, onComplete: function () {
      var img = $('[data-timg]'), txt = $('[data-ttxt]');
      flip = { img: img && img.getBoundingClientRect(), txt: txt && txt.getBoundingClientRect() };
      state.q = n; renderQuote();
      try { afterQuote(prev); }
      catch (err) { console.warn(err); gsap.set('[data-quote] > *', { autoAlpha: 1, y: 0 }); qBusy = false; startAuto(); }
    } });
  }

  function afterQuote(prevQ) {
    var q = state.q, img = $('[data-timg]'), txt = $('[data-ttxt]'), f = flip || {}, dur = 1.5;
    [[img, f.img], [txt, f.txt]].forEach(function (p) {
      var el = p[0], r = p[1];
      if (!el || !r) return;
      var nr = el.getBoundingClientRect(), dx = r.left - nr.left, dy = r.top - nr.top;
      if (dx || dy) gsap.fromTo(el, { x: dx, y: dy }, { x: 0, y: 0, duration: dur, ease: 'expo.inOut', clearProps: 'transform' });
    });
    $$('[data-tlayer]').forEach(function (l) {
      var i = +l.dataset.tlayer;
      if (i === q) gsap.fromTo(l, { opacity: 0, scale: 1.12 }, { opacity: 1, scale: 1, duration: 1.8, ease: 'power3.out', delay: 0.2 });
      else if (i === prevQ) gsap.to(l, { opacity: 0, duration: 1.2, ease: 'power2.inOut', delay: 0.2 });
      else gsap.set(l, { opacity: 0 });
    });
    gsap.fromTo('[data-quote] > *', { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.2, stagger: 0.1, ease: 'power3.out', overwrite: true, delay: (f.img ? dur * 0.6 : 0.2), onComplete: function () { qBusy = false; } });
    flip = null;
    startAuto();
  }

  function startAuto() {
    if (!window.gsap || reduce) return;
    if (auto) auto.kill();
    auto = gsap.fromTo('[data-tprog]', { scaleX: 0 }, { scaleX: 1, duration: 7, ease: 'none', onComplete: function () { goQuote((state.q + 1) % QUOTES.length); } });
    if (!tInView) auto.pause();
  }

  /* ---------- motion ---------- */
  function init() {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.defaults({ toggleActions: 'play none none reverse' });
    playVideos();
    if (reduce) return;

    if (window.Lenis) {
      lenis = new Lenis({ duration: 1.3, easing: function (t) { return 1 - Math.pow(1 - t, 4); }, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }

    var q = function (s) { return gsap.utils.toArray(s); };
    var ST = ScrollTrigger;

    var sec = $('[data-hscroll]'), track = sec && sec.querySelector('[data-track]');
    if (track) {
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      var h = gsap.to(track, { x: function () { return -dist(); }, ease: 'none', scrollTrigger: { trigger: sec, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 } });
      var bar = sec.querySelector('[data-hprogress]');
      if (bar) gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: sec, start: 'top top', end: function () { return '+=' + dist(); }, scrub: true, invalidateOnRefresh: true } });
      q('[data-hitem]').forEach(function (it) {
        var inner = it.querySelector('[data-hinner]');
        if (inner) gsap.fromTo(inner, { xPercent: -5, scale: 1.14 }, { xPercent: 5, scale: 1.04, ease: 'none', scrollTrigger: { trigger: it, containerAnimation: h, start: 'left right', end: 'right left', scrub: true } });
        var ot = it.querySelector('[data-otitle]');
        if (ot) gsap.from(ot, { autoAlpha: 0, x: 24, duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: it, containerAnimation: h, start: 'left 70%' } });
        var cap = it.querySelector('figcaption');
        if (cap) gsap.from(cap, { autoAlpha: 0, y: 10, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: it, containerAnimation: h, start: 'left 80%' } });
      });
    }

    // Logos marquee: continuous, speeds up with scroll velocity
    var mt = $('[data-marquee-track]');
    if (mt) {
      var loop = gsap.to(mt, { xPercent: -50, duration: 38, ease: 'none', repeat: -1 });
      ST.create({ trigger: '[data-marquee]', start: 'top bottom', end: 'bottom top', onUpdate: function (self) {
        var v = Math.min(Math.abs(self.getVelocity()) / 400, 4);
        gsap.to(loop, { timeScale: (self.direction < 0 ? -1 : 1) * (1 + v), duration: 0.3, overwrite: true, onComplete: function () { gsap.to(loop, { timeScale: self.direction < 0 ? -1 : 1, duration: 1.2 }); } });
      } });
      gsap.from('[data-marquee]', { autoAlpha: 0, y: 30, duration: 1.6, ease: 'power3.out', scrollTrigger: { trigger: '[data-marquee]', start: 'top 92%' } });
    }

    // Testimonials: autoplay only while the section is on screen
    var tsec = $('[data-tsec]');
    if (tsec) ST.create({ trigger: tsec, start: 'top 85%', end: 'bottom 15%', onToggle: function (self) {
      tInView = self.isActive;
      if (!auto) startAuto();
      else if (self.isActive && !qBusy) auto.resume();
      else auto.pause();
    } });
    gsap.from('[data-quote]', { y: 56, autoAlpha: 0, duration: 1.6, ease: 'power3.out', scrollTrigger: { trigger: '[data-quote]', start: 'top 78%' } });

    // Hero intro
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('[data-hero-media]', { scale: 1.14, autoAlpha: 0, duration: 3, ease: 'power2.out' })
      .from('[data-hero-line] > span', { yPercent: 115, duration: 1.8, stagger: 0.16, ease: 'expo.out' }, 0.6)
      .from('[data-hero-fade]', { y: 14, autoAlpha: 0, duration: 1.6, stagger: 0.12 }, 1.4)
      .from('[data-nav]', { y: -18, autoAlpha: 0, duration: 1.6 }, 1.1);
    ST.create({ trigger: '[data-hero]', start: 'bottom 80px', toggleActions: 'play none none none',
      onEnter: function () { gsap.to('[data-navbg]', { opacity: 1, duration: 0.6, ease: 'power2.out' }); },
      onLeaveBack: function () { gsap.to('[data-navbg]', { opacity: 0, duration: 0.6, ease: 'power2.out' }); } });

    // Magnetic pills
    if (window.matchMedia('(hover: hover)').matches) {
      q('[data-magnetic]').forEach(function (el) {
        var xTo = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'power3.out' });
        var yTo = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'power3.out' });
        el.addEventListener('mousemove', function (e) { var r = el.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * 0.18); yTo((e.clientY - r.top - r.height / 2) * 0.3); });
        el.addEventListener('mouseleave', function () { xTo(0); yTo(0); });
      });
    }

    var pintro = $('[data-pintro]');
    if (pintro) gsap.from(pintro.children, { y: 36, autoAlpha: 0, duration: 1.5, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: '[data-hscroll]', start: 'top 70%' } });

    // Image strip: bottom-up mask reveal
    q('[data-strip] > div').forEach(function (el, i) {
      gsap.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, delay: i * 0.1, ease: 'expo.out', scrollTrigger: { trigger: '[data-strip]', start: 'top 85%' } });
    });

    // Stats: counters + divider draw
    q('[data-count]').forEach(function (el) {
      var o = { v: 0 }, target = parseFloat(el.dataset.target) || 0;
      gsap.to(o, { v: target, duration: 2.4, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 82%' }, onUpdate: function () { el.textContent = Math.round(o.v).toLocaleString('pt-BR'); } });
    });
    q('[data-vline]').forEach(function (el, i) {
      gsap.fromTo(el, { borderTopColor: 'rgba(169,175,184,0)' }, { borderTopColor: 'rgba(169,175,184,.35)', duration: 1.4, delay: i * 0.12, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
    });

    // Closing headline, letter by letter
    q('[data-chars]').forEach(function (el) {
      var txt = el.textContent.trim();
      el.innerHTML = txt.split('').map(function (c) { return '<span style="display:inline-block">' + (c === ' ' ? '&nbsp;' : c) + '</span>'; }).join('');
      gsap.from(el.children, { yPercent: 110, duration: 1.6, stagger: 0.05, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 80%' } });
    });

    // Footer soft rise
    var ft = $('[data-footer]');
    if (ft) gsap.from(ft, { y: 60, ease: 'none', scrollTrigger: { trigger: ft, start: 'top bottom', end: 'top 40%', scrub: true } });

    gsap.to('[data-hero-media]', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('[data-hero-content]', { y: -70, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: '75% top', scrub: true } });

    q('[data-lines]').forEach(function (el) {
      gsap.from(el.querySelectorAll('[data-line] > span'), { yPercent: 115, duration: 1.6, stagger: 0.14, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 80%' } });
    });
    q('[data-reveal]').forEach(function (el) {
      gsap.from(el, { y: 48, autoAlpha: 0, duration: 1.6, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 82%' } });
    });
    q('[data-stagger]').forEach(function (el) {
      gsap.from(el.children, { y: 56, autoAlpha: 0, duration: 1.5, stagger: 0.14, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 80%' } });
    });
    q('[data-parallax]').forEach(function (el) {
      var v = parseFloat(el.dataset.parallax) || 6;
      gsap.fromTo(el, { yPercent: -v }, { yPercent: v, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    q('[data-clip]').forEach(function (el) {
      gsap.fromTo(el, { clipPath: 'inset(10% 8% 10% 8%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 20%', scrub: true } });
      var inner = el.querySelector('[data-clip-inner]');
      if (inner) gsap.fromTo(inner, { scale: 1.16 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    q('[data-drift]').forEach(function (el) {
      var v = parseFloat(el.dataset.drift) || -25;
      gsap.fromTo(el, { xPercent: 0 }, { xPercent: v, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // Process: sticky step number follows the active step
    var steps = q('[data-step]');
    steps.forEach(function (s, i) {
      gsap.set(s, { opacity: i === 0 ? 1 : 0.28 });
      ST.create({ trigger: s, start: 'top 55%', end: 'bottom 55%', onToggle: function (self) {
        if (!self.isActive) { gsap.to(s, { opacity: 0.28, duration: 0.8, ease: 'power2.out' }); return; }
        gsap.to(s, { opacity: 1, duration: 0.8, ease: 'power2.out' });
        var num = $('[data-pnum]'), bar = $('[data-pbar]');
        if (num) gsap.to(num, { yPercent: -25 * i, duration: 1.1, ease: 'expo.out' });
        if (bar) gsap.to(bar, { scaleX: (i + 1) / steps.length, duration: 1.1, ease: 'expo.out' });
      } });
    });

    window.addEventListener('load', function () { ST.refresh(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
    setTimeout(function () { ST.refresh(); }, 900);
  }

  /* ---------- wiring ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target : e.target.parentElement;
    var a = t.closest('[data-go]');
    if (a) { var href = a.getAttribute('href'); if (href && href[0] === '#') { e.preventDefault(); goTo(href); } return; }
    if (t.closest('#menu-toggle')) return setMenu(!state.menu);
    if (t.closest('[data-open-reel]')) return setReel(true);
    if (t.closest('[data-close-reel]')) return setReel(false);
    if (t.closest('[data-sound]')) return toggleSound();
    if (t.closest('[data-quote-prev]')) return goQuote((state.q + QUOTES.length - 1) % QUOTES.length);
    if (t.closest('[data-quote-next]')) return goQuote((state.q + 1) % QUOTES.length);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (state.reel) setReel(false); else if (state.menu) setMenu(false);
  });

  var onBreakpoint = function () {
    state.mobile = mq.matches;
    if (!state.mobile) setMenu(false);
    var sec = $('[data-tsec]');
    if (sec) sec.style.flexDirection = state.mobile ? 'column' : (state.q % 2 ? 'row-reverse' : 'row');
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  };
  if (mq.addEventListener) mq.addEventListener('change', onBreakpoint); else mq.addListener(onBreakpoint);
  onBreakpoint();

  function boot() {
    if (!(window.gsap && window.ScrollTrigger)) { playVideos(); return; }
    init();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
