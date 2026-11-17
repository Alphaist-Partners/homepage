(() => {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  function renderHero() {
    frame = 0;
    if (preference.matches) return;
    const box = hero.getBoundingClientRect();
    const travel = Math.min(box.height, Math.max(0, -box.top));
    const progress = travel / box.height;
    const typeFade = Math.min(1, Math.max(0, (progress - .04) / .41));

    hero.style.setProperty('--sky-travel', (travel * .7).toFixed(1) + 'px');
    hero.style.setProperty('--sky-light', (1 - progress * .62).toFixed(3));
    hero.style.setProperty('--type-travel', (travel * .24).toFixed(1) + 'px');
    hero.style.setProperty('--type-light', (1 - typeFade).toFixed(3));
  }
  function scheduleHero() {
    if (!preference.matches && !frame) frame = requestAnimationFrame(renderHero);
  }
  window.addEventListener('scroll', scheduleHero, {passive:true});
  window.addEventListener('resize', scheduleHero);
  window.addEventListener('pageshow', scheduleHero);
  preference.addEventListener('change', scheduleHero);
  new ResizeObserver(scheduleHero).observe(hero);
  renderHero();

  const elements = document.querySelectorAll('.mission__title, .home-thesis .sechead, .home-thesis .pillar');
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      // A deep link or a large scroll jump can land right on text. Keep it readable.
      if (preference.matches || entry.boundingClientRect.top < innerHeight * .6) continue;
      entry.target.classList.add('is-entering');
    }
  });
  for (const el of elements) {
    observer.observe(el);
    el.addEventListener('animationend', () => el.classList.remove('is-entering'), {once:true});
  }
  preference.addEventListener('change', () => {
    if (preference.matches) elements.forEach(el => el.classList.remove('is-entering'));
  });
})();
