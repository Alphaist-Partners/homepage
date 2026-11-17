(() => {
  const opener = document.querySelector('.ph-opening');
  const links = [...document.querySelectorAll('.ph-formula a')];
  const terms = links.map(link => document.getElementById(link.hash.slice(1)));
  const nav = document.querySelector('[data-nav]');
  let readingLine = 0;
  let current = -1;
  let frame = 0;

  function draw() {
    frame = 0;
    const positions = terms.map(term => term.getBoundingClientRect().top);
    // The same baseline governs the active term and where a native anchor lands.
    let active = 0;
    for (let i = 1; i < positions.length; i++) {
      if (positions[i] <= readingLine + 2) active = i;
    }
    if (current === active) return;
    if (current >= 0) {
      links[current].removeAttribute('aria-current');
      terms[current].classList.remove('is-reading');
    }
    links[active].setAttribute('aria-current', 'location');
    terms[active].classList.add('is-reading');
    current = active;
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(draw);
  }
  function measure() {
    const inset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const margin = parseFloat(getComputedStyle(terms[0]).scrollMarginTop) || 0;
    readingLine = inset + margin;
    document.body.style.setProperty('--reader-nav-height', nav.offsetHeight + 'px');
    schedule();
  }

  const resize = new ResizeObserver(measure);
  resize.observe(nav);
  resize.observe(opener);
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', measure);
  window.addEventListener('pageshow', measure);
  document.fonts.ready.then(measure);
  measure();
})();
