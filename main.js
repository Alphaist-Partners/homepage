(() => {
  'use strict';
  // Existing shared links to sections on the former landing page open the matching page.
  if (document.body.classList.contains('home')) {
    const destinations = new Map([
      ['founders', 'founders.html'], ['companies', 'founders.html'], ['all-companies', 'founders.html#all-companies'],
      ['stories', 'stories.html'], ['film', 'stories.html#film'], ['podcasts', 'stories.html#podcasts'],
      ['team', 'team.html'], ['founding-letter', 'team.html#founding-letter'],
      ['who-we-back', 'philosophy.html#who-we-back'], ['firm', 'philosophy.html#firm'],
      ['judgment', 'philosophy.html#judgment'], ['second','philosophy.html#firm'],
      ['mission', 'philosophy.html#firm'], ['mission-title', 'philosophy.html#judgment'],
      ['founder-criteria','philosophy.html#founder-criteria'], ['traits-title','philosophy.html#who-we-back'],
      ['stories-title','stories.html'], ['podcast-heading','stories.html#podcasts'], ['team-title','team.html'],
      ['selected-heading','founders.html'], ['founders-title','founders.html'], ['companies-heading','founders.html#all-companies'],
      ['opening','#top'], ['statement-title','#top']
    ]);
    function followOldLink() {
      const target = destinations.get(location.hash.slice(1));
      if (target) location.replace(target);
    }
    followOldLink();
    window.addEventListener('hashchange',followOldLink);
  }

  const nav = document.querySelector('[data-nav]');
  if (nav) {
    const compact = matchMedia("(max-width:760px), (max-width:960px) and (max-height:500px) and (orientation:landscape)");
    const toggle = nav.querySelector('.nav__menu');
    const label = toggle.querySelector('.nav__menu-label');
    const panel = nav.querySelector('#primary-links');
    function setMenu(open) {
      toggle.setAttribute('aria-expanded', String(open));
      label.textContent = open ? 'Close' : 'Menu';
      nav.classList.toggle('menu-open', open);
    }
    toggle.hidden = false;
    nav.classList.add('has-menu');
    toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('pointerdown', event => {
      if (nav.classList.contains('menu-open') && !nav.contains(event.target)) setMenu(false);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && nav.classList.contains('menu-open')) {
        setMenu(false);
        toggle.focus({preventScroll:true});
      }
    });
    document.addEventListener('focusin', event => {
      if (nav.classList.contains('menu-open') && !nav.contains(event.target)) setMenu(false);
    });
    nav.addEventListener('click', event => {
      if (nav.classList.contains('menu-open') && (event.target === nav || event.target.closest('a'))) {
        setMenu(false);
      }
    });
    window.addEventListener('pagehide', () => setMenu(false));
    compact.addEventListener('change', () => {
      if (compact.matches && panel.contains(document.activeElement)) toggle.focus({preventScroll:true});
      if (!compact.matches && document.activeElement === toggle) {
        const destination = panel.querySelector('li:not(.nav__home) a[aria-current]') || nav.querySelector('.nav__brand');
        destination.focus({preventScroll:true});
      }
      setMenu(false);
      updateNavigation();
    });

    let pivot = Math.max(0, window.scrollY);
    let hidden = false;
    function updateNavigation() {
      const limit = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const y = Math.min(limit, Math.max(0, window.scrollY));
      nav.classList.toggle('is-scrolled', y > 20);
      if (compact.matches || y < 20 || (hidden && y < pivot - 8)) hidden = false;
      else if (!hidden && y > nav.offsetHeight && y > pivot + 12) hidden = true;
      nav.classList.toggle('is-hidden', hidden);
      pivot = hidden ? Math.max(y, pivot) : Math.min(y, pivot);
    }
    window.addEventListener('scroll', updateNavigation, {passive:true});
    window.addEventListener('pageshow', updateNavigation);
    nav.addEventListener('focusin', () => {
      hidden = false;
      pivot = Math.max(0, window.scrollY);
      nav.classList.remove('is-hidden');
    });
    updateNavigation();
  }

  const track = document.querySelector('[data-reel-track]');
  if (track) {
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    document.querySelector('.reel__ctrl').hidden = false;
    const canDrift = matchMedia('(hover:hover) and (pointer:fine)');
    const cards = [...track.children];
    function copies() {
      return cards.map(card => {
        const copy = card.cloneNode(true);
        copy.setAttribute('aria-hidden','true');
        copy.querySelector('a').tabIndex = -1;
        return copy;
      });
    }
    track.prepend(...copies()); track.append(...copies());
    let base = 0, period = 0, step = 0, heldUntil = 0, timer = 0, inView = false;
    function measure() {
      const fraction = period ? (track.scrollLeft-base)/period : 0;
      base = cards[0].offsetLeft - parseFloat(getComputedStyle(track).paddingLeft);
      period = cards[0].offsetLeft - track.firstElementChild.offsetLeft;
      step = cards[1].offsetLeft - cards[0].offsetLeft;
      track.scrollLeft = base + fraction * period;
    }
    measure();
    new ResizeObserver(measure).observe(track);
    function wrap() {
      if (!period || cards.some(el => el.contains(document.activeElement))) return;
      if (track.scrollLeft < base - period/2) track.scrollLeft += period;
      else if (track.scrollLeft > base + period/2) track.scrollLeft -= period;
    }
    track.addEventListener('scroll',wrap,{passive:true});
    function hold() { heldUntil = performance.now() + 4500; }
    function go(dir) {
      hold();
      track.scrollBy({left:dir*step,behavior:motion.matches ? 'instant' : 'smooth'});
    }
    document.querySelector('[data-reel-prev]').addEventListener('click',()=>go(-1));
    document.querySelector('[data-reel-next]').addEventListener('click',()=>go(1));
    track.addEventListener('keydown', e => {
      if (e.key==='ArrowRight' || e.key==='ArrowLeft') { e.preventDefault(); go(e.key==='ArrowRight'?1:-1); }
    });
    let lastX=null, dragStart=0, dragged=false;
    track.addEventListener('pointerdown',e=>{
      hold(); dragged=false;
      if (e.pointerType==='mouse' && e.button===0) lastX=dragStart=e.clientX;
    });
    window.addEventListener('pointermove', e=>{
      if (lastX===null) return;
      if (Math.abs(e.clientX-dragStart)>5) { dragged=true; track.classList.add('is-dragging'); }
      if (dragged) { track.scrollLeft+=lastX-e.clientX; lastX=e.clientX; }
    });
    function release() { lastX=null; track.classList.remove('is-dragging'); }
    window.addEventListener('pointerup',release);
    window.addEventListener('pointercancel',release);
    window.addEventListener('blur',release);
    track.addEventListener('click',e=>{if (dragged && e.detail) { e.preventDefault(); dragged=false; }},true);
    track.addEventListener('wheel',hold,{passive:true});
    function drift() {
      clearInterval(timer);
      if (inView && canDrift.matches && !motion.matches && !document.hidden) timer=setInterval(()=>{
        if (lastX===null && !track.matches(':hover,:focus-within') && performance.now()>heldUntil) track.scrollLeft+=1;
      },42);
    }
    new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;drift();}).observe(track);
    motion.addEventListener('change',drift);
    canDrift.addEventListener('change',drift);
    document.addEventListener('visibilitychange',drift);
  }

  const directory = document.querySelector('[data-all]');
  if (directory) setupDirectory(directory);

  function setupDirectory(list) {
    const filters = document.querySelector('[data-chips]');
    const buttons = [...filters.querySelectorAll('[data-filter]')];
    const rows = [...list.children];
    const status = document.querySelector('[data-filter-status]');
    const preview = document.querySelector('.project-preview');
    const image = preview.querySelector('img');
    const finePointer = matchMedia('(any-hover:hover) and (any-pointer:fine)');
    let activeLink = null, dismissedLink = null;
    let pointer = null, scrollFrame = 0;

    function hide() {
      activeLink = null;
      preview.hidden = true;
    }
    function position(x,y) {
      const gap = 18;
      const width = preview.offsetWidth, height = preview.offsetHeight;
      const newX = x + gap + width < innerWidth ? x + gap : x - gap - width;
      const newY = y > height + gap ? y - height - 9 : y + gap;
      const left = Math.max(8, Math.min(newX,innerWidth-width-8));
      const top = Math.max(8,Math.min(newY,innerHeight-height-8));
      preview.style.transform = 'translate(' + left + 'px,' + top + 'px)';
    }
    function show(link,x,y) {
      if (!link || dismissedLink === link) return;
      if (link !== activeLink) {
        activeLink = link;
        image.src = link.dataset.preview;
      }
      preview.hidden = false;
      position(x,y);
    }
    function hover(event) {
      if ((event.pointerType !== 'mouse' && event.pointerType !== 'pen') || !finePointer.matches) return;
      const link = event.target.closest('a[data-preview]');
      if (!link) { hide(); return; }
      if (dismissedLink && dismissedLink !== link) dismissedLink = null;
      show(link,event.clientX,event.clientY);
    }
    document.addEventListener('pointermove',event => {
      pointer = event.pointerType === 'mouse' || event.pointerType === 'pen'
        ? {x:event.clientX, y:event.clientY} : null;
    },{passive:true});
    document.addEventListener('pointerout',event => { if (!event.relatedTarget) pointer = null; });
    document.addEventListener('pointerdown',event => { if (event.pointerType === 'touch') pointer = null; });
    document.addEventListener('keydown',() => { pointer = null; });
    list.addEventListener('pointerover',hover);
    list.addEventListener('pointermove',hover);
    list.addEventListener('pointerleave',() => { dismissedLink = null; hide(); });
    list.addEventListener('pointerdown',e => { if (e.pointerType === 'touch') hide(); });
    list.addEventListener('focusin',e => {
      const link = e.target.closest('a[data-preview]');
      if (!link || !link.matches(':focus-visible')) return;
      dismissedLink = null;
      const rect = link.getBoundingClientRect();
      show(link, rect.left + rect.width*.55, rect.top + rect.height*.5);
    });
    list.addEventListener('focusout',hide);
    document.addEventListener('keydown',e => {
      if (e.key === 'Escape' && activeLink) { dismissedLink = activeLink; hide(); }
    });
    window.addEventListener('scroll',() => {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        const focused = list.querySelector('a:focus-visible');
        if (!pointer && focused) {
          const rect = focused.getBoundingClientRect();
          if (rect.bottom > 0 && rect.top < innerHeight) { show(focused, rect.left + rect.width*.55, rect.top + rect.height*.5); return; }
        }
        const link = pointer && finePointer.matches && document.elementFromPoint(pointer.x,pointer.y)?.closest('a[data-preview]');
        if (link && list.contains(link)) show(link,pointer.x,pointer.y);
        else hide();
      });
    },{passive:true});
    window.addEventListener('resize',hide);
    window.addEventListener('pagehide',hide);
    image.addEventListener('error',hide);
    function filter(field) {
      hide();
      let count = 0;
      for (const b of buttons) b.setAttribute('aria-pressed',String(b.dataset.filter === field));
      for (const row of rows) {
        row.hidden = field !== 'all' && row.dataset.field !== field;
        if (!row.hidden) count++;
      }
      status.textContent = count + ' companies shown';
    }
    filters.hidden = false;
    filters.addEventListener('click',e => {
      const b = e.target.closest('[data-filter]');
      if (b) filter(b.dataset.filter);
    });
    function revealBookmark() {
      const target = document.getElementById(location.hash.slice(1));
      if (target?.matches('[data-field][hidden]')) {
        filter('all');
        target.scrollIntoView();
      }
    }
    window.addEventListener('hashchange',revealBookmark);
    window.addEventListener('pageshow',revealBookmark);
  }

  const film = document.querySelector('.film');
  if (film) {
    const player = film.querySelector('.film__video');
    const play = film.querySelector('.film__play');
    film.classList.add('is-ready');
    player.controls = false;
    play.hidden = false;
    const stage = film.querySelector('.film__stage');
    const preview = film.querySelector('.film__preview');
    const allowPreview = matchMedia('(any-hover: hover) and (prefers-reduced-motion: no-preference)');
    let previewRequest = 0;
    function stopPreview() {
      previewRequest++;
      film.classList.remove('is-previewing');
      preview.pause();
      if (preview.readyState && preview.currentTime !== 0) preview.currentTime = 0;
    }
    stage.addEventListener('pointerenter', async event => {
      if (event.pointerType === 'touch' || !allowPreview.matches || document.hidden || film.classList.contains('is-playing')) return;
      const request = ++previewRequest;
      try {
        await preview.play();
        if (request === previewRequest) film.classList.add('is-previewing');
      } catch {
        if (request === previewRequest) stopPreview();
      }
    });
    stage.addEventListener('pointerleave', stopPreview);
    preview.addEventListener('ended', stopPreview);
    preview.addEventListener('error', stopPreview);
    allowPreview.addEventListener('change', stopPreview);
    window.addEventListener('pagehide', stopPreview);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stopPreview(); });
    new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) stopPreview(); }).observe(stage);
    function showCover(returnFocus) {
      film.classList.remove('is-playing');
      player.controls = false;
      if (returnFocus) play.focus({preventScroll:true});
    }
    play.addEventListener('click', async () => {
      stopPreview();
      player.controls = true;
      film.classList.add('is-playing');
      try {
        await player.play();
        player.focus({preventScroll:true});
      } catch {
        showCover(true);
      }
    });
    player.addEventListener('ended', () => {
      player.load();
      showCover(document.activeElement === player);
    });
    player.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !document.fullscreenElement) {
        player.pause();
        player.load();
        showCover(true);
      }
    });
  }

  document.querySelectorAll('video:not(.film__preview)').forEach(video => {
    new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) video.pause();
    }).observe(video);
    document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); });
  });
})();
