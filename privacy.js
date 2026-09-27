// Privacy page atmosphere: the site's depth layers behind the page, and something in the empty photo if you stay still.
(() => {
  const d = document, root = d.documentElement, still = matchMedia('(prefers-reduced-motion: reduce)').matches, k = still ? .5 : 1;
  root.classList.add('js');
  const depth = d.createElement('div');
  depth.className = 'depth'; depth.setAttribute('aria-hidden', 'true');
  depth.innerHTML = '<i class="ash"></i><i class="far"></i><i class="fogband"><b class="gentle"></b></i><i class="near"></i>';
  d.body.prepend(depth);
  const [ash, far, fog, near] = depth.children;
  let mx = 0, frame = false;
  const move = (el, x, y) => { el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`; };
  const paint = () => {
    frame = false;
    const y = scrollY, p = Math.min(1, y / Math.max(1, root.scrollHeight - innerHeight));
    move(ash, mx * 16, -(y * .25 * k % 360)); move(far, mx * 6, (1 - p) * 40 * k);
    move(fog, 0, (1 - p) * 60 * k); move(near, mx * 14, (1 - p) * 110 * k);
  };
  const queue = () => { if (!frame) { frame = true; requestAnimationFrame(paint); } };
  addEventListener('scroll', queue, { passive: true }); addEventListener('resize', queue);
  if (!still && matchMedia('(hover: hover)').matches) addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; queue(); }, { passive: true });
  queue();
  new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('on', e.isIntersecting))).observe(d.querySelector('footer'));

  // The file says no photograph. Stay still for a while and a face looks out of the empty slot anyway.
  const peer = d.querySelector('.peer'), photo = d.querySelector('.photo');
  let idle, on = false, seenIt = true;
  new IntersectionObserver(es => { seenIt = es[0].isIntersecting; }).observe(photo);
  const appear = () => { if (seenIt && !d.hidden) { peer.classList.remove('gone'); peer.classList.add('on'); on = true; } else wake(); };
  const wake = () => {
    clearTimeout(idle); idle = setTimeout(appear, 6000);
    if (on) { on = false; peer.classList.remove('on'); peer.classList.add('gone'); }
  };
  ['pointermove', 'pointerdown', 'keydown', 'scroll', 'touchstart', 'wheel'].forEach(t => addEventListener(t, wake, { passive: true }));
  wake();
})();
