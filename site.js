// Uninvited Presence: the house is watching. Atmosphere only; every piece of content works without this file.
(() => {
  const d = document, root = d.documentElement;
  root.classList.add('js');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hero = d.querySelector('.hero'), torch = d.querySelector('.torch'),
    eyes = d.querySelector('.eyes'), seen = d.querySelector('.seen');

  // Sound: off by default. The game's own title music (the music box, loaded only on the first "on") over a faint
  // synthesized rumble, plus synthesized knocks, creaks and breath.
  let ac, bed, music, soundOn = false;
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
      music = ac.createGain(); music.gain.value = 0; music.connect(ac.destination);
      fetch('menu_musicbox.mp3').then(r => r.arrayBuffer()).then(b => ac.decodeAudioData(b)).then(buf => {
        const m = ac.createBufferSource(); m.buffer = buf; m.loop = true; m.connect(music); m.start();   // a buffer loops seamlessly, like the game
      }).catch(() => {});
    }
    soundOn = !soundOn; ac.resume();
    bed.gain.setTargetAtTime(soundOn ? .035 : 0, ac.currentTime, .6);
    music.gain.setTargetAtTime(soundOn ? .5 : 0, ac.currentTime, .8);
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

  // Cases are alive, like a live photo: every still drifts slowly and one small detail lives over its light.
  // [effect, x, y, size, rgb, seconds]: x and y are fractions of the card. Only on-screen cards animate.
  const fx = {
    walls: ['rain'], ridge: ['fog'], call: ['snow'], jungle: ['fireflies'],
    blinds: ['glow', .68, .16, 60, '185,240,235', 13], blue: ['glow pulse', .55, .7, 60, '110,190,255', 3.6],
    funeral: ['glow', .15, .35, 30, '255,210,150', 7], watcher: ['glow', .45, .53, 22, '255,200,120', 9],
    crawl: ['dust', .55, .45], bridge: ['shimmer', .55, .65]
  };
  cases.forEach(c => {
    const img = c.querySelector('img'), f = fx[(img.getAttribute('src').match(/stage-(\w+)/) || [])[1]];
    if (!f) return;
    const el = d.createElement('i');
    el.className = 'fx ' + f[0]; el.setAttribute('aria-hidden', 'true');
    if (f[1] != null) el.style.cssText = `--x:${f[1] * 100}%;--y:${f[2] * 100}%;--s:${f[3]}%;--c:${f[4]};--d:${f[5]}s`;
    if (f[0] == 'fireflies') for (let i = 0; i < 7; i++) {
      const b = d.createElement('b');
      b.style.cssText = `left:${10 + Math.random() * 75}%;top:${20 + Math.random() * 45}%;animation-duration:${5 + Math.random() * 4}s;animation-delay:${-Math.random() * 8}s`;
      el.append(b);
    }
    img.after(el);
  });
  // "Pause motion" stops everything that moves on its own (and the parallax) and is remembered.
  let calm = false;
  try { calm = localStorage.getItem('up-motion') === 'off'; } catch (e) {}
  const casesHead = d.querySelector('#cases .section-head'), motion = d.createElement('button');
  motion.className = 'sound motion'; motion.type = 'button';
  const motionLabel = () => {
    root.classList.toggle('calm', calm); motion.setAttribute('aria-pressed', calm);
    motion.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true">' + (calm ? '<path d="M4 3l9 5-9 5z"/>' : '<path d="M5 3v10M11 3v10"/>') + '</svg>' + (calm ? 'Play motion' : 'Pause motion');
  };
  motion.onclick = () => { calm = !calm; motionLabel(); queue(); try { localStorage.setItem('up-motion', calm ? 'off' : 'on'); } catch (e) {} };

  // A typewriter files each case number as its card comes into view (numbers only, never a total).
  const files = d.createElement('p');
  files.className = 'files'; files.setAttribute('aria-hidden', 'true'); files.innerHTML = 'CASE FILES <span></span><i></i>';
  const typed = files.firstElementChild, filed = new Set();
  let typing = 0;
  const type = () => {
    const want = [...filed].sort().join(' '), have = typed.textContent;
    if (have == want) { clearInterval(typing); typing = 0; return; }
    typed.textContent = want.startsWith(have) ? want.slice(0, have.length + 1) : have.slice(0, -1);
  };
  motionLabel(); casesHead.append(files, motion);

  // Only what is on screen animates: cards, the hero and the footer get .on while visible.
  const liveIo = new IntersectionObserver(es => es.forEach(e => {
    e.target.classList.toggle('on', e.isIntersecting);
    const no = e.isIntersecting && e.target.matches('.case') && e.target.querySelector('.no');
    if (no) { filed.add(no.textContent.slice(-2)); if (!typing) typing = setInterval(type, 70); }
  }));
  [hero, d.querySelector('footer'), ...cases].forEach(el => liveIo.observe(el));

  // Depth: falling ash, a far tree line, a fog band and a near tree line behind the page, each at its own speed as you
  // scroll (and a little with the mouse). The key art, moon and all, drifts slower than the content. Half as much with
  // reduced motion.
  const depth = d.createElement('div'), art = hero.querySelector('picture'), k = still ? .5 : 1;
  depth.className = 'depth'; depth.setAttribute('aria-hidden', 'true');
  depth.innerHTML = '<i class="ash"></i><i class="far"></i><i class="fogband"><b class="gentle"></b></i><i class="near"></i>';
  d.body.prepend(depth);
  const [ash, far, fogBand, near] = depth.children;
  let mx = 0, frame = false, artShift = 0;
  const move = (el, x, y) => { el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`; };
  const paint = () => {
    frame = false;
    if (calm) return;
    const y = scrollY, p = Math.min(1, y / Math.max(1, root.scrollHeight - innerHeight));
    if (y < hero.offsetHeight) { artShift = y * .3 * k; move(art, -mx * 8, artShift); }
    move(ash, mx * 16, -(y * .25 * k % 360));
    move(far, mx * 6, (1 - p) * 40 * k);
    move(fogBand, 0, (1 - p) * 60 * k);
    move(near, mx * 14, (1 - p) * 110 * k);
  };
  const queue = () => { if (!frame) { frame = true; requestAnimationFrame(paint); } };
  addEventListener('scroll', queue, { passive: true }); addEventListener('resize', queue);
  if (!still && matchMedia('(hover: hover)').matches) addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; queue(); }, { passive: true });
  queue();

  // Map a point on the key art (0..1 of the picture) to the hero, matching object-fit: cover at 50% 35%.
  const artPoint = () => {
    const tall = /tall/.test(hero.querySelector('img').currentSrc), w = tall ? 900 : 1600, h = tall ? 1593 : 904,
      W = hero.clientWidth, H = hero.clientHeight, s = Math.max(W / w, H / h);
    const [px, py] = tall ? [.13, .35] : [.7925, .492];
    return [px * w * s + (W - w * s) * .5, py * h * s + (H - h * s) * .35 + artShift, s];
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
