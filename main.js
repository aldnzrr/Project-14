gsap.registerPlugin(ScrollTrigger);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = matchMedia('(hover: none)').matches;

/* ---------- Smooth scroll (Lenis + GSAP ticker) ---------- */
const lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.9 });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(t => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(500, 33);
history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
lenis.stop();

/* ---------- Clock ---------- */
const clock = document.getElementById('clock');
const setClock = () => clock.textContent = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
setClock(); setInterval(setClock, 10000);

/* ---------- Menu ---------- */
document.getElementById('menuBtn').addEventListener('click', () => {
  const open = document.body.classList.toggle('menu-open');
  open ? lenis.stop() : lenis.start();
});

/* ---------- Anchor links ---------- */
document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const id = a.getAttribute('href');
  if (id.length < 2) return;
  const el = document.querySelector(id);
  if (!el) return;
  e.preventDefault();
  if (document.body.classList.contains('menu-open')) { document.body.classList.remove('menu-open'); lenis.start(); }
  lenis.scrollTo(el, { duration: 1.6, easing: t => 1 - Math.pow(1 - t, 4) });
}));

/* ---------- Split words ---------- */
document.querySelectorAll('.split').forEach(el => {
  el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="w"><span>${w}</span></span>`).join(' ');
});

/* ================= COFFEE POUR INTRO ================= */
const SVGNS = 'http://www.w3.org/2000/svg';
function wavePath(amp, len, offsetY = 0) {
  let d = `M -300 ${offsetY}`;
  for (let x = -300; x <= 600; x += 6) d += ` L ${x} ${(offsetY + Math.sin((x / len) * Math.PI * 2) * amp).toFixed(2)}`;
  return d + ` L 600 400 L -300 400 Z`;
}
document.getElementById('crema').setAttribute('d', wavePath(3.2, 75, -3));
document.getElementById('coffee').setAttribute('d', wavePath(2.6, 75, 4));

const liquid = document.getElementById('liquid');
const waves = document.getElementById('waves');
const stream = document.getElementById('stream');
const splash = document.getElementById('splash');
const pct = document.getElementById('pourPct');
const EMPTY = 684, FULL = 470;

gsap.set(liquid, { y: EMPTY });
gsap.set('.pour', { xPercent: -50, x: 0 });
gsap.set('.hero-title .line > span', { y: 0, yPercent: 110 });
gsap.to(waves, { x: -150, duration: 2.4, ease: 'none', repeat: -1 });

// bubbles drifting while pouring
const bubbleTweens = gsap.utils.toArray('.bubble').map((b, i) =>
  gsap.fromTo(b, { y: 40, opacity: 0 }, { y: -10, opacity: 1, duration: 1.4, ease: 'sine.out', repeat: -1, delay: i * 0.35, paused: true })
);

/* ---------- Floating coffee beans ---------- */
// [left%, top%, size px, blur px, depth, rotation]
const BEANS = isTouch || innerWidth < 900
  ? [[8, 34, 34, 0, 1, -25], [82, 30, 42, 0, 1.2, 30], [70, 58, 18, 2, .4, 60], [20, 52, 16, 3, .3, -60], [88, 8, 20, 2, .5, 10]]
  : [[9, 28, 48, 0, 1, -28], [26, 44, 20, 2, .45, 50], [33, 18, 16, 3.5, .3, -70],
     [72, 26, 36, 0, .85, 34], [86, 50, 58, 0, 1.3, -14], [65, 70, 22, 1.5, .5, 80],
     [95, 30, 20, 3, .35, 12], [41, 81, 24, 1, .6, -40], [55, 14, 14, 4, .25, 20]];
const beansWrap = document.getElementById('beans');
const beanEls = BEANS.map(([l, t, s, b, d, r]) => {
  const el = document.createElement('div');
  el.className = 'bean';
  el.style.cssText = `left:${l}%;top:${t}%;width:${s}px;height:${s * 1.33}px;z-index:${Math.round(d * 10)}`;
  el.innerHTML = `<span class="bean-m"><span class="bean-f" style="filter:blur(${b}px)"><svg><use href="#bean"/></svg></span></span>`;
  el.dataset.depth = d; el.dataset.rot = r;
  beansWrap.appendChild(el);
  return el;
});

// pre-set beans (tiny opacity so the browser rasterises their layers BEFORE the reveal -> no frame spike)
beanEls.forEach(el => {
  const d = +el.dataset.depth, r = +el.dataset.rot;
  gsap.set(el.querySelector('.bean-f'), { opacity: 0.01, scale: 0.6, rotation: r - 40, y: 50 * d, force3D: true });
});

function showBeans() {
  beanEls.forEach((el, i) => {
    const f = el.querySelector('.bean-f'), d = +el.dataset.depth, r = +el.dataset.rot;
    const floatY = gsap.utils.random(-18, -30) * d;
    gsap.timeline({ delay: 0.1 + i * 0.09 })
      .to(f, { opacity: 1, duration: 1.4, ease: 'power2.out' }, 0)
      .to(f, { scale: 1, rotation: r, y: 0, duration: 2.6, ease: 'power3.out' }, 0)
      // hand off to the idle float without a velocity jump
      .add(() => {
        gsap.to(f, { y: floatY, duration: gsap.utils.random(3.2, 5), ease: 'sine.inOut', yoyo: true, repeat: -1 });
        gsap.to(f, { rotation: r + gsap.utils.random(-20, 20), duration: gsap.utils.random(4.5, 7), ease: 'sine.inOut', yoyo: true, repeat: -1 });
      }, 2.2);
  });
}

// mouse parallax (depth-based)
if (!isTouch) {
  const movers = beanEls.map(el => ({
    d: +el.dataset.depth,
    x: gsap.quickTo(el.firstChild, 'x', { duration: 1.4, ease: 'power3' }),
    y: gsap.quickTo(el.firstChild, 'y', { duration: 1.4, ease: 'power3' })
  }));
  window.addEventListener('mousemove', e => {
    const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
    movers.forEach(m => { m.x(-nx * 60 * m.d); m.y(-ny * 40 * m.d); });
  });
}
// scroll: beans drift up at different speeds
beanEls.forEach(el => gsap.to(el, { y: -260 * +el.dataset.depth, ease: 'none',
  scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } }));

function revealHero() {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.add(showBeans, 0)
    .to('.header', { opacity: 1, duration: 1.8, ease: 'power1.inOut' }, 0)
    .to('.hero-title .line > span', { yPercent: 0, duration: 1.9, ease: 'power4.out', stagger: 0.14 }, 0.1)
    .fromTo('.hero-fade', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1.8, stagger: 0.1 }, 0.35)
    .fromTo('.hero-marquee', { opacity: 0 }, { opacity: 1, duration: 1.8, ease: 'power1.inOut' }, 0.6)
    .add(() => { lenis.start(); introDone = true; }, 1.2);
  return tl;
}

function startSteam() {
  gsap.utils.toArray('.steam').forEach((s, i) => {
    gsap.timeline({ repeat: -1, delay: i * 0.7 })
      .fromTo(s, { strokeDashoffset: 0.28, opacity: 0 }, { strokeDashoffset: -0.75, duration: 3.2, ease: 'none' })
      .to(s, { opacity: 0.9, duration: 1, ease: 'sine.inOut' }, 0)
      .to(s, { opacity: 0, duration: 1.2, ease: 'sine.inOut' }, 2);
  });
}

function intro() {
  if (reduce) {
    gsap.set(liquid, { y: FULL });
    gsap.set(['.glass-line', '.glass-shine'], { strokeDashoffset: 0 });
    gsap.set(['.glass-body', '.glass-shadow', '.hero-glow'], { opacity: 1 });
    gsap.set('.pour-status', { opacity: 0 });
    gsap.set('.hero-title .line > span', { y: 0, yPercent: 0 });
    gsap.set(['.hero-fade', '.hero-marquee', '.header'], { opacity: 1 });
    beanEls.forEach(el => gsap.set(el.querySelector('.bean-f'), { opacity: 1, rotation: +el.dataset.rot }));
    lenis.start();
    return;
  }
  ScrollTrigger.refresh(); // measure once, before anything moves
  const level = { v: 0 };
  const tl = gsap.timeline({ delay: 0.3 });
  tl.from('.pour-status', { opacity: 0, y: 10, duration: 0.8, ease: 'power2.out' })
    // draw the glass
    .to('.glass-line', { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut', stagger: 0.15 }, 0)
    .to('.glass-shine', { strokeDashoffset: 0, duration: 1, ease: 'power2.out', stagger: 0.1 }, 0.8)
    .to('.glass-body', { opacity: 1, duration: 1 }, 0.8)
    .to('.hero-glow', { opacity: 1, duration: 2.5, ease: 'power1.out' }, 0.6)
    // stream falls in
    .fromTo(stream, { attr: { y: -40, height: 0 } }, { attr: { height: 724 }, duration: 0.55, ease: 'power2.in' }, 1.5)
    .to(splash, { opacity: 0.9, duration: 0.2 }, 2.0)
    .add(() => bubbleTweens.forEach(t => t.play()), 2.0)
    // fill the glass
    .to(level, {
      v: 1, duration: 2.6, ease: 'power1.inOut',
      onUpdate() {
        const y = EMPTY - (EMPTY - FULL) * level.v;
        gsap.set(liquid, { y });
        gsap.set(splash, { attr: { cy: y - 1 } });
        pct.textContent = Math.round(level.v * 100) + '%';
      }
    }, 2.0)
    .to('.glass-shadow', { opacity: 1, duration: 2 }, 2.2)
    // stop pour: stream tail drops into the cup
    .to(stream, { attr: { y: FULL, height: 0 }, duration: 0.55, ease: 'power2.in' }, 4.3)
    .to(splash, { opacity: 0, attr: { rx: 22 }, duration: 0.8, ease: 'power2.out' }, 4.7)
    .add(() => { bubbleTweens.forEach(t => t.pause()); gsap.to('.bubble', { opacity: 0, duration: 0.8 }); }, 4.7)
    // settle: soft slosh
    .to(liquid, { y: FULL - 2.5, duration: 0.5, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 4.65)
    .to('.pour-status', { opacity: 0, y: -6, duration: 0.9, ease: 'power1.inOut' }, 4.3)
    .add(startSteam, 4.5)
    // reveal overlaps the end of the pour -> one continuous motion
    .add(revealHero(), 4.55);
}
// wait for fonts so the reveal is crisp
(document.fonts ? document.fonts.ready : Promise.resolve()).then(intro);

/* Hero parallax out on scroll */
gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
  .to('.hero-bottom, .hero-top', { y: -90, opacity: 0, ease: 'none' }, 0)
  .to('.pour', { y: 120, scale: 0.9, opacity: 0.4, ease: 'none' }, 0);

/* ================= SCROLL ANIMATIONS ================= */
// Word reveal
gsap.utils.toArray('.split').forEach(el => {
  gsap.fromTo(el.querySelectorAll('.w > span'), { yPercent: 115 }, {
    yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.025,
    scrollTrigger: { trigger: el, start: 'top 88%' }
  });
});

// Fade up groups (stagger per container)
gsap.utils.toArray('.products, .articles').forEach(group => {
  gsap.fromTo(group.children, { y: 60, opacity: 0 }, {
    y: 0, opacity: 1, duration: 1.4, ease: 'expo.out', stagger: 0.1,
    scrollTrigger: { trigger: group, start: 'top 85%' }
  });
});

// Case images: clip reveal + inner parallax
gsap.utils.toArray('.case').forEach(c => {
  const box = c.querySelector('.case-img'), img = box.querySelector('img');
  gsap.fromTo(box, { clipPath: 'inset(12% 8% 12% 8%)' }, {
    clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8, ease: 'expo.out',
    scrollTrigger: { trigger: c, start: 'top 85%' }
  });
  gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from(c.querySelectorAll('.case-info > *'), { y: 30, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: c.querySelector('.case-info'), start: 'top 92%' } });
});

// About image parallax
gsap.fromTo('.about-img img', { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.about-img', start: 'top bottom', end: 'bottom top', scrub: true } });
gsap.fromTo('.about-img', { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.8, ease: 'expo.inOut', scrollTrigger: { trigger: '.about', start: 'top 75%' } });

// Lines: offer rows / events draw in
gsap.utils.toArray('.offer-row, .event').forEach(row => {
  gsap.from(row, { y: 40, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: row, start: 'top 92%' } });
});
gsap.from('.logos span', { opacity: 0, y: 20, duration: 1, stagger: 0.06, ease: 'power3.out', scrollTrigger: { trigger: '.logos', start: 'top 90%' } });
gsap.utils.toArray('.trust-side, .about-text > p, .about-text > a, .cta-btns, .section-head > a').forEach(el =>
  gsap.from(el, { opacity: 0, y: 30, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%' } }));
gsap.from('.footer-grid > div', { opacity: 0, y: 40, duration: 1.2, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: '.footer', start: 'top 85%' } });

/* ---------- Velocity-reactive marquees ---------- */
gsap.utils.toArray('.marquee-track').forEach((track, i) => {
  const base = i === 0 ? 40 : 55; // seconds per loop
  const tw = gsap.to(track, { xPercent: -50, duration: base, ease: 'none', repeat: -1 });
  let boost = 1;
  lenis.on('scroll', ({ velocity }) => {
    boost = 1 + Math.min(Math.abs(velocity) * 0.25, 4);
    gsap.to(tw, { timeScale: (velocity < 0 ? -1 : 1) * boost, duration: 0.3, overwrite: true });
    gsap.to(tw, { timeScale: velocity < 0 ? -1 : 1, duration: 1.2, delay: 0.3, ease: 'power2.out' });
  });
});

/* ---------- Header hide on scroll ---------- */
let headerShown = true;
lenis.on('scroll', ({ direction, scroll }) => {
  const show = direction < 0 || scroll < 200;
  if (show !== headerShown) {
    headerShown = show;
    gsap.to('.header', { yPercent: show ? 0 : -100, duration: 0.8, ease: 'expo.out' });
  }
});

/* ---------- Offer: floating image follows cursor ---------- */
if (!isTouch) {
  const float = document.getElementById('offerFloat');
  const inner = float.querySelector('.offer-float-inner');
  const xTo = gsap.quickTo(float, 'x', { duration: 0.7, ease: 'power3' });
  const yTo = gsap.quickTo(float, 'y', { duration: 0.7, ease: 'power3' });
  const rTo = gsap.quickTo(float, 'rotation', { duration: 0.9, ease: 'power3' });
  let lastX = 0;
  window.addEventListener('mousemove', e => {
    xTo(e.clientX); yTo(e.clientY);
    rTo(gsap.utils.clamp(-12, 12, (e.clientX - lastX) * 0.6)); lastX = e.clientX;
  });
  gsap.set(float, { xPercent: -50, yPercent: -50, scale: 0 });
  const offer = document.querySelector('.offer');
  offer.addEventListener('mouseenter', () => gsap.to(float, { scale: 1, duration: 0.7, ease: 'expo.out' }));
  offer.addEventListener('mouseleave', () => gsap.to(float, { scale: 0, duration: 0.6, ease: 'expo.out' }));
  document.querySelectorAll('.offer-row').forEach(row => {
    const src = row.querySelector('.offer-img img').src;
    row.addEventListener('mouseenter', () => {
      const img = new Image(); img.src = src;
      inner.appendChild(img);
      gsap.fromTo(img, { clipPath: 'inset(100% 0 0 0)', scale: 1.3 }, { clipPath: 'inset(0% 0 0 0)', scale: 1, duration: 0.8, ease: 'expo.out',
        onComplete: () => { while (inner.children.length > 1) inner.firstChild.remove(); } });
    });
  });

  /* Magnetic buttons */
  document.querySelectorAll('.btn').forEach(btn => {
    const bx = gsap.quickTo(btn, 'x', { duration: 0.6, ease: 'power3' });
    const by = gsap.quickTo(btn, 'y', { duration: 0.6, ease: 'power3' });
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      bx((e.clientX - r.left - r.width / 2) * 0.25);
      by((e.clientY - r.top - r.height / 2) * 0.35);
    });
    btn.addEventListener('mouseleave', () => { bx(0); by(0); });
  });
}

let introDone = false;
window.addEventListener('load', () => { if (introDone || reduce) ScrollTrigger.refresh(); });
