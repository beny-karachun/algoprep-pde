/* Home page motion: reveals, the opening book, the growing equation and the examples. */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const easeInOut = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeSine = t => (1 - Math.cos(Math.PI * t)) / 2; // gentler than cubic through the middle

  // Reveal blocks once, with a short stagger between siblings.
  const revealed = [...document.querySelectorAll('[data-reveal]')];
  revealed.forEach(node => {
    const siblings = [...node.parentElement.children].filter(child => child.hasAttribute('data-reveal'));
    node.style.setProperty('--rd', `${siblings.indexOf(node) * 90}ms`);
  });
  if (reduce || !('IntersectionObserver' in window)) revealed.forEach(node => node.classList.add('in'));
  else {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in'); observer.unobserve(entry.target);
    }), { rootMargin: '0px 0px -8% 0px', threshold: .12 });
    revealed.forEach(node => observer.observe(node));
  }

  // Pinned book: the page holds on the book while it opens, then scrolls on.
  // Markup: <div class="book-pin" data-book-pin><div class="book-pin-sticky"> book-stage </div></div>.
  // The wrapper gets the sticky block's height plus a scroll "travel"; the sticky block stays in view
  // while the page scrolls through that travel, and the travel maps to opening progress 0..1.
  // Plain scrolling (no wheel hijack), so touch, trackpad, keyboard and scrolling back up all work.
  const bookPin = (() => {
    const pin = document.querySelector('[data-book-pin]');
    const sticky = pin?.querySelector('.book-pin-sticky');
    if (!pin || !sticky || reduce) return { progress: () => null };
    let top = 0; let travel = 0;
    function layout() {
      const vh = window.innerHeight;
      const headerEl = document.querySelector('.site-header');
      const header = headerEl && getComputedStyle(headerEl).position === 'sticky' ? headerEl.offsetHeight : 0;
      const h = sticky.offsetHeight;
      top = Math.max(header + 12, (vh - h) / 2 + header / 2); // centred if it fits, else just under the header
      travel = Math.round(vh * 2.2); // long travel so the cover turns slowly
      sticky.style.top = `${top}px`;
      pin.style.height = `${h + travel}px`;
    }
    function openPosition() { return pin.getBoundingClientRect().top + window.scrollY - top + travel; }
    pin.classList.add('is-pinned');
    layout();
    addEventListener('resize', layout);
    addEventListener('load', layout);
    // In-page links to the chapters land with the book already open.
    document.addEventListener('click', event => {
      const link = event.target.closest?.('a[href$="#chapters"]');
      if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const url = new URL(link.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname) return;
      event.preventDefault(); event.stopPropagation();
      history.replaceState(history.state, '', '#chapters');
      window.scrollTo({ top: openPosition(), behavior: 'smooth' });
    }, true);
    if (location.hash === '#chapters') addEventListener('load', () => window.scrollTo(0, openPosition()));
    return { progress: () => clamp((top - pin.getBoundingClientRect().top) / (travel || 1)) };
  })();

  // Scroll-linked book and equation.
  const book = document.querySelector('[data-book]');
  const grow = document.querySelector('[data-grow]');
  book?.querySelectorAll('.toc li').forEach((item, index) => item.style.setProperty('--i', index));
  function measurePen() {
    const expr = grow?.querySelector('.grow-expr');
    if (expr) grow.style.setProperty('--expr-w', `${expr.offsetWidth}px`);
  }
  let queued = false; let bookP = null;
  function frame() {
    queued = false;
    const vh = window.innerHeight;
    if (book) {
      const rect = book.getBoundingClientRect();
      const pinned = bookPin.progress();
      const target = reduce ? 1 : (pinned != null ? easeSine(pinned) : easeInOut(clamp((vh * .72 - rect.top) / (vh * .55))));
      // Glide toward the scroll position instead of jumping, so a fast flick still turns the cover smoothly.
      bookP = reduce || bookP == null ? target : bookP + (target - bookP) * .12;
      if (Math.abs(target - bookP) < .001) bookP = target; else request();
      book.style.setProperty('--p', bookP.toFixed(4));
      book.classList.toggle('is-open', bookP > .55);
    }
    if (grow) {
      const rect = grow.getBoundingClientRect();
      const g = reduce ? 1 : clamp((vh * .88 - rect.top) / (vh * .5));
      grow.style.setProperty('--gx', clamp(g / .8).toFixed(4));
      grow.style.setProperty('--gr', clamp((g - .8) / .2).toFixed(4));
    }
  }
  const request = () => { if (!queued) { queued = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', request, { passive: true });
  addEventListener('hashchange', request);
  addEventListener('resize', () => { measurePen(); request(); });
  addEventListener('load', () => { measurePen(); request(); });
  measurePen(); frame();

  // Examples: each one lights up the tracks its sechem reaches.
  const examples = [...document.querySelectorAll('.example[data-sechem]')];
  const semesters = [...document.querySelectorAll('[data-semester]')];
  const trackLists = [...document.querySelectorAll('.track-panel .tracks')];
  const status = document.querySelector('[data-tracks-status]');
  const nameCount = track => track.querySelector('.track-name').firstChild.textContent.split('·').length;
  function select(button, announce) {
    examples.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    const tracks = [...(trackLists.find(list => !list.hidden)?.querySelectorAll('.track') || [])];
    const total = tracks.reduce((sum, track) => sum + nameCount(track), 0);
    const sechem = Number(button.dataset.sechem);
    let order = 0; let opened = 0;
    tracks.forEach(track => {
      const open = sechem >= Number(track.dataset.min);
      if (open && !track.classList.contains('open')) track.style.setProperty('--k', order++);
      track.classList.toggle('open', open);
      if (open) opened += nameCount(track);
    });
    if (announce && status) status.textContent = `סכם ${sechem} מגיע ל־${opened} מתוך ${total} המסלולים`;
  }
  examples.forEach(button => button.addEventListener('click', () => { select(button, true); }));
  semesters.forEach(button => button.addEventListener('click', () => {
    semesters.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    trackLists.forEach(list => { list.hidden = list.id !== button.getAttribute('aria-controls'); });
    const selected = examples.find(example => example.getAttribute('aria-pressed') === 'true');
    if (selected) select(selected, true);
  }));
  if (examples.length) select(examples.find(button => button.getAttribute('aria-pressed') === 'true') || examples[0], false);
  // The video: YouTube's player loads only when it is played (no YouTube requests or cookies before that).
  document.querySelectorAll('.video[data-yt]').forEach(box => box.querySelector('a')?.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const frame = document.createElement('iframe');
    frame.src = `https://www.youtube-nocookie.com/embed/${box.dataset.yt}?autoplay=1&rel=0`;
    frame.title = box.querySelector('.sr-only')?.textContent || 'YouTube';
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    box.replaceChildren(frame);
    frame.focus();
  }));

  document.documentElement.classList.add('motion-ready');
})();
