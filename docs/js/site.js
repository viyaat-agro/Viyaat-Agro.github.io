(function () {
  var nav = document.getElementById('nav');
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('navMenu');
  if (!nav) return;

  function onScroll() {
    nav.classList.toggle('is-solid', window.scrollY > 40);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  function setOpen(open) {
    toggle.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
    nav.classList.toggle('is-open', open);
  }
  toggle.addEventListener('click', function () {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });
  menu.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') setOpen(false);
  });
})();

/* Gallery slideshow: slow auto-advance, seamless loop, arrows, dots, swipe */
(function () {
  var root = document.getElementById('gallerySlider');
  if (!root) return;
  var viewport = root.querySelector('.slider__viewport');
  var track = root.querySelector('.slider__track');
  var all = Array.prototype.slice.call(track.children);
  var clones = all.filter(function (s) { return s.hasAttribute('data-clone'); });
  var n = all.length - clones.length;
  var prevBtn = root.querySelector('.slider__btn--prev');
  var nextBtn = root.querySelector('.slider__btn--next');
  var dotsEl = root.querySelector('.slider__dots');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HOLD = 5200, GLIDE = 1400;
  var i = 0, moving = false, timer = null, paused = false, dots = [];

  root.classList.add('is-enhanced');
  prevBtn.hidden = nextBtn.hidden = dotsEl.hidden = false;

  for (var d = 0; d < n; d++) {
    (function (k) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Show photo ' + (k + 1));
      b.addEventListener('click', function () { goTo(k); restart(); });
      dotsEl.appendChild(b); dots.push(b);
    })(d);
  }

  function step() {
    var gap = parseFloat(getComputedStyle(track).columnGap) || 16;
    return all[0].getBoundingClientRect().width + gap;
  }
  function place(idx, animate) {
    track.style.transition = (animate && !reduce) ? 'transform ' + GLIDE + 'ms cubic-bezier(.45,.05,.25,1)' : 'none';
    track.style.transform = 'translateX(' + (-idx * step()) + 'px)';
  }
  function paint() {
    var cur = ((i % n) + n) % n;
    dots.forEach(function (b, k) { b.setAttribute('aria-current', k === cur ? 'true' : 'false'); });
  }
  function settle() {
    if (i >= n) { i = i - n; place(i, false); }
    moving = false; paint();
  }
  function move(idx) {
    if (moving) return;
    moving = true; i = idx; place(i, true); paint();
    if (reduce) { settle(); return; }
    var done = false;
    function end() { if (done) return; done = true; track.removeEventListener('transitionend', end); settle(); }
    track.addEventListener('transitionend', end);
    setTimeout(end, GLIDE + 150);
  }
  function next() { move(i + 1); }
  function prev() {
    if (moving) return;
    if (i === 0) { i = n; place(i, false); void track.offsetWidth; }
    move(i - 1);
  }
  function goTo(k) { if (!moving && k !== ((i % n) + n) % n) move(k); }

  function start() { if (reduce || timer) return; timer = setInterval(function () { if (!paused) next(); }, HOLD); }
  function stop() { clearInterval(timer); timer = null; }
  function restart() { stop(); start(); }

  nextBtn.addEventListener('click', function () { next(); restart(); });
  prevBtn.addEventListener('click', function () { prev(); restart(); });
  root.addEventListener('mouseenter', function () { paused = true; });
  root.addEventListener('mouseleave', function () { paused = false; });
  root.addEventListener('focusin', function () { paused = true; });
  root.addEventListener('focusout', function () { paused = false; });
  viewport.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { next(); restart(); }
    if (e.key === 'ArrowLeft') { prev(); restart(); }
  });

  var x0 = null;
  viewport.addEventListener('pointerdown', function (e) { x0 = e.clientX; paused = true; });
  viewport.addEventListener('pointerup', function (e) {
    if (x0 !== null) {
      var dx = e.clientX - x0;
      if (dx < -40) { next(); restart(); } else if (dx > 40) { prev(); restart(); }
    }
    x0 = null; paused = false;
  });
  viewport.addEventListener('pointercancel', function () { x0 = null; paused = false; });
  viewport.style.touchAction = 'pan-y';

  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  window.addEventListener('resize', function () { place(i, false); });

  /* Load every photo once the slideshow is near the screen (offscreen slides would otherwise stay lazy). */
  var imgs = track.querySelectorAll('img');
  function eager() { imgs.forEach(function (im) { im.loading = 'eager'; }); }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { eager(); io.disconnect(); }
    }, { rootMargin: '600px 0px' });
    io.observe(root);
  } else { eager(); }

  place(0, false); paint(); start();
})();
