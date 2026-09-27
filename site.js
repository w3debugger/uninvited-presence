// Uninvited Presence: the house is watching. Atmosphere only; every piece of content works without this file.
(() => {
  const d = document, root = d.documentElement;
  root.classList.add('js');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hero = d.querySelector('.hero'), torch = d.querySelector('.torch'),
    eyes = d.querySelector('.eyes'), seen = d.querySelector('.seen');

  // Sound: off by default, all synthesized (no files). Built on the first "on".
  let ac, bed, soundOn = false;
  const noise = (secs, brown) => {
    const b = ac.createBuffer(1, ac.sampleRate * secs, ac.sampleRate), c = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < c.length; i++) { const w = Math.random() * 2 - 1; c[i] = brown ? (last = (last + .02 * w) / 1.02) * 3.5 : w; }
    return b;
  };
  const env = (node, t, peak, len) => { node.gain.setValueAtTime(0, t); node.gain.linearRampToValueAtTime(peak, t + .01); node.gain.exponentialRampToValueAtTime(.001, t + len); };
  const knock = (n = 2) => {
    if (!soundOn) return;
    for (let i = 0; i < n; i++) {
      const t = ac.currentTime + i * .22, o = ac.createOscillator(), g = ac.createGain();
      o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(55, t + .15);
      env(g, t, .5, .2); o.connect(g).connect(ac.destination); o.start(t); o.stop(t + .25);
    }
  };
  const creak = () => {
    if (!soundOn) return;
    const t = ac.currentTime, o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
    o.type = 'sawtooth'; f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 6;
    o.frequency.setValueAtTime(70, t); o.frequency.linearRampToValueAtTime(95, t + .35); o.frequency.linearRampToValueAtTime(62, t + .7);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05, t + .1); g.gain.linearRampToValueAtTime(0, t + .75);
    o.connect(f).connect(g).connect(ac.destination); o.start(t); o.stop(t + .8);
  };
  const breath = () => {
    if (!soundOn) return;
    const t = ac.currentTime, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noise(2); f.type = 'bandpass'; f.frequency.value = 500; f.Q.value = 1.5;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.06, t + .8); g.gain.linearRampToValueAtTime(0, t + 1.9);
    s.connect(f).connect(g).connect(ac.destination); s.start(t);
  };
  const btn = d.createElement('button');
  btn.className = 'sound'; btn.type = 'button';
  const label = () => { btn.setAttribute('aria-pressed', soundOn); btn.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 6h3l4-3v10l-4-3H2z"/>' + (soundOn ? '<path d="M11 5.5a4 4 0 0 1 0 5M13 3.5a7 7 0 0 1 0 9"/>' : '<path d="M11 6l4 4M15 6l-4 4"/>') + '</svg>Sound ' + (soundOn ? 'on' : 'off'); };
  btn.onclick = () => {
    if (!ac) {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      bed = ac.createGain(); bed.gain.value = 0; bed.connect(ac.destination);
      const s = ac.createBufferSource(), f = ac.createBiquadFilter(), hum = ac.createOscillator(), hg = ac.createGain();
      s.buffer = noise(6, true); s.loop = true; f.type = 'lowpass'; f.frequency.value = 380;
      hum.frequency.value = 49; hg.gain.value = .25;
      s.connect(f).connect(bed); hum.connect(hg).connect(bed); s.start(); hum.start();
    }
    soundOn = !soundOn; ac.resume();
    bed.gain.setTargetAtTime(soundOn ? .09 : 0, ac.currentTime, .6);
    label(); if (soundOn) knock(3);
  };
  label(); d.querySelector('.soon').after(btn);

  // ENTER: a brief fade to black, then the cases.
  const veil = d.createElement('div');
  veil.className = 'veil'; veil.setAttribute('aria-hidden', 'true'); d.body.append(veil);
  d.querySelector('.enter').addEventListener('click', e => {
    const to = d.getElementById('cases'), h = d.getElementById('cases-title');
    knock();
    if (still) return;
    e.preventDefault(); veil.classList.add('on');
    setTimeout(() => {
      to.scrollIntoView(); history.pushState(null, '', '#cases'); h.focus({ preventScroll: true });
      veil.classList.remove('on');
    }, 480);
  });

  // Cases develop: on hover (mouse), when scrolled into view (touch), and on tap.
  const cases = d.querySelectorAll('.case');
  let lastCreak = 0;
  const develop = () => { if (Date.now() - lastCreak > 1500) { lastCreak = Date.now(); creak(); } };
  if (matchMedia('(hover: hover)').matches) cases.forEach(c => c.addEventListener('mouseenter', () => develop()));
  else {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('dev'); develop(); io.unobserve(e.target); }
    }), { threshold: .6 });
    cases.forEach(c => {
      io.observe(c);
      c.addEventListener('click', () => { c.classList.remove('dev'); void c.offsetWidth; c.classList.add('dev'); develop(); });
    });
  }

  // Map a point on the key art (0..1 of the picture) to the hero, matching object-fit: cover at 50% 35%.
  const artPoint = () => {
    const tall = /tall/.test(hero.querySelector('img').currentSrc), w = tall ? 900 : 1600, h = tall ? 1593 : 904,
      W = hero.clientWidth, H = hero.clientHeight, s = Math.max(W / w, H / h);
    const [px, py] = tall ? [.13, .35] : [.7925, .492];
    return [px * w * s + (W - w * s) * .5, py * h * s + (H - h * s) * .35, s];
  };

  // Flashlight: follows the pointer or finger over the hero, painted once per frame at most.
  let tx, ty, queued = false;
  const aim = (x, y) => {
    const r = hero.getBoundingClientRect(); tx = x - r.left; ty = y - r.top;
    if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; torch.style.setProperty('--x', tx + 'px'); torch.style.setProperty('--y', ty + 'px'); }); }
  };
  if (!still) {
    hero.addEventListener('pointermove', e => e.pointerType === 'mouse' && aim(e.clientX, e.clientY));
    hero.addEventListener('touchstart', e => aim(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
    hero.addEventListener('touchmove', e => aim(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
  }

  // The watcher: stop moving for a few seconds and something looks back from the house. Move and it is gone.
  let idle, watching = false, heroVisible = true;
  new IntersectionObserver(es => { heroVisible = es[0].isIntersecting; }).observe(hero);
  const appear = () => {
    if (!heroVisible || d.hidden) return wake();
    const [x, y, s] = artPoint();
    const fs = Math.max(6, 9 * s);
    eyes.style.fontSize = fs + 'px'; eyes.style.transform = `translate(${x - 1.6 * fs}px, ${y - fs / 2}px)`;
    eyes.classList.remove('gone'); eyes.classList.add('on'); watching = true; breath();
  };
  const wake = () => {
    clearTimeout(idle); idle = setTimeout(appear, 4500);
    if (!watching) return;
    watching = false; eyes.classList.remove('on'); eyes.classList.add('gone');
    // Rarely, it leaves a mark. Never with reduced motion.
    if (!still && Math.random() < .3) {
      const [x, y] = artPoint();
      seen.style.left = Math.max(16, Math.min(x - 60, hero.clientWidth - 150)) + 'px'; seen.style.top = y + 34 + 'px';
      seen.classList.add('on'); setTimeout(() => seen.classList.remove('on'), 900);
    }
  };
  ['pointermove', 'pointerdown', 'keydown', 'scroll', 'touchstart', 'wheel'].forEach(t => addEventListener(t, wake, { passive: true }));
  wake();
})();
