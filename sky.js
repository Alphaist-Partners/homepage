/* Crossing the Milky Way: one star travels up through a band of stars and wakes the dust it passes. */
(() => {
  const canvas = document.querySelector('[data-field]');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const TAU = Math.PI * 2, WARM = '255,238,214', LILAC = '213,205,230';
  let w = 0, h = 0, dpr = 1, narrow = false, visible = false, raf = 0, last = 0, clock = 4000;
  let sky = [], dust = [], clouds = [], twinkles = [], motes = [];
  // The band runs from the lower left to the upper right; the star follows it.
  let cx = 0, cy = 0, ux = 1, uy = 0, span = 0, scale = 1, lane = 16, speed = 84, travel = 18, period = 21;
  function seeded(seed) {
    return () => { seed = (Math.imul(seed,1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  }
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const ease = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const at = (along, across) => [cx + ux * along + uy * across, cy + uy * along - ux * across];

  function build() {
    const random = seeded(14142);
    const bell = () => (random() + random() + random() + random() - 2) / .58;
    const rise = h * (narrow ? .5 : .72), reach = Math.hypot(w, rise);
    ux = w / reach; uy = -rise / reach; cx = w * .5; cy = h * (narrow ? .37 : .46);
    span = reach * 1.2; scale = narrow ? .7 : clamp(w / 1280, .8, 1.5); lane = 16 * scale;
    travel = narrow ? 15 : 18; speed = span * .96 / travel; period = travel + 3;
    sky = []; dust = []; clouds = []; twinkles = []; motes = [];
    for (let i = 0; i < w * h / 2200; i++) sky.push([random() * w, random() * h, random() > .96 ? 1.3 : .6, .1 + random() * .3]);
    const count = Math.round(clamp(w * h / 256, 1400, 4500));
    for (let i = 0; i < count; i++) {
      const along = (random() - .5) * span, spread = bell() * (62 + 26 * Math.sin(along / 190)) * scale;
      const across = spread + 14 * scale * Math.sin(along / 120), p = at(along, across);
      dust.push({ x: p[0], y: p[1], size: .5 + random() * 1.2, light: (.1 + random() * .5) * Math.exp(-Math.abs(spread) / (190 * scale)), along, off: across - lane });
    }
    for (let i = 0; i < 16; i++) { const p = at((random() - .5) * span * .9, bell() * 30 * scale); clouds.push([p[0], p[1], (90 + random() * 130) * scale, .04 + random() * .05]); }
    for (let i = 0; i < count / 21; i++) { const p = at((random() - .5) * span * .95, bell() * 110 * scale); twinkles.push([p[0], p[1], .9 + random() * 1.3, random() * TAU, .7 + random() * 2]); }
    // Fine stardust the star leaves behind: each mote drifts off the path, twinkles and fades.
    for (let along = -span / 2; along < span / 2; along += 11) motes.push({
      along: along + random() * 9, across: lane + bell() * 5, drift: bell() * 9, size: .45 + random() * .75,
      beat: 4 + random() * 7, phase: random() * TAU, life: 1.6 + random() * 2.6
    });
  }
  function glow(x, y, r, a, rgb) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')');
    g.addColorStop(.22, 'rgba(' + rgb + ',' + a * .45 + ')');
    g.addColorStop(1, 'rgba(' + rgb + ',0)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function mote(x, y, r, a, rgb) {
    if (a <= 0) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 1.9), top = Math.min(1, a).toFixed(3);
    g.addColorStop(0, 'rgba(255,250,244,' + top + ')'); g.addColorStop(.5, 'rgba(' + rgb + ',' + top + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 1.9, 0, TAU); ctx.fill();
  }
  function thread(x, y, length, width, a, rgb) {
    const g = ctx.createLinearGradient(x - ux * length, y - uy * length, x, y);
    g.addColorStop(0, 'rgba(' + rgb + ',0)'); g.addColorStop(1, 'rgba(' + rgb + ',' + a.toFixed(3) + ')');
    ctx.strokeStyle = g; ctx.lineWidth = width; ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.moveTo(x - ux * length, y - uy * length); ctx.lineTo(x, y); ctx.stroke();
  }
  function draw(time) {
    const t = time / 1000, tt = t % period, along = -span * .45 + speed * tt, star = at(along, lane);
    const life = ease(tt / 2.2) * (1 - ease((tt - (period - 3.6)) / 2.2)), grow = ease((tt - 1) / (travel * .6));
    const shimmer = .62 + .24 * Math.sin(t * 5.3) + .14 * Math.sin(t * 11.7 + 1), cool = .5 + .5 * Math.sin(t * 1.3);
    const hue = Math.round(255 - 20 * cool) + ',' + Math.round(240 - 10 * cool) + ',' + Math.round(220 + 32 * cool);
    ctx.clearRect(0, 0, w, h);
    for (const s of sky) { ctx.fillStyle = 'rgba(224,218,229,' + s[3] + ')'; ctx.fillRect(s[0], s[1], s[2], s[2]); }
    for (const c of clouds) glow(c[0], c[1], c[2], c[3], LILAC);
    // Dust wakes as the star passes, then settles slowly.
    const width = 5200 * scale * scale, linger = speed * 3.2;
    for (const d of dust) {
      const gap = along - d.along;
      const lit = (gap >= 0 ? Math.exp(-gap / linger) : Math.exp(gap / 38)) * Math.exp(-(d.off * d.off) / width) * life;
      const k = Math.min(1, lit * 1.4), size = d.size + lit * 1.1;
      ctx.fillStyle = 'rgba(' + Math.round(213 + 42 * k) + ',' + Math.round(205 + 33 * k) + ',' + Math.round(230 - 16 * k) + ',' + Math.min(1, d.light + lit * .75).toFixed(3) + ')';
      ctx.fillRect(d.x, d.y, size, size);
    }
    for (const s of twinkles) { ctx.fillStyle = 'rgba(236,230,244,' + (.35 + .35 * Math.sin(t * s[4] + s[3])).toFixed(3) + ')'; ctx.fillRect(s[0], s[1], s[2], s[2]); }
    for (const m of motes) {
      const age = (along - m.along) / speed; if (age < 0 || age > m.life) continue;
      const fade = 1 - age / m.life, p = at(m.along - age * 7, m.across + m.drift * Math.sqrt(age));
      mote(p[0], p[1], m.size, fade * fade * (.5 + .5 * Math.sin(t * m.beat + m.phase)) * life * .85, hue);
    }
    // A fine thread of light behind the star, over a softer, wider one.
    thread(star[0], star[1], (100 + 45 * grow) * scale, 4, .13 * life * shimmer, hue);
    thread(star[0], star[1], (170 + 80 * grow) * scale, 1.3, .5 * life * shimmer, hue);
    // The star: a bright core, with no glow around it.
    ctx.fillStyle = 'rgba(255,246,232,' + life.toFixed(3) + ')';
    ctx.beginPath(); ctx.arc(star[0], star[1], narrow ? 1.7 : 2, 0, TAU); ctx.fill();
  }
  // With motion reduced, show one composed moment: the star a little past half way.
  function still() { draw(travel * 550); }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    w = rect.width; h = rect.height; dpr = Math.min(window.devicePixelRatio || 1, 2); narrow = w < 700;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
    if (motion.matches) still(); else draw(clock);
  }
  function frame(now) {
    if (!last) last = now;
    clock += Math.min(now - last, 80); last = now;
    draw(clock);
    raf = requestAnimationFrame(frame);
  }
  function sync() {
    cancelAnimationFrame(raf); last = 0;
    if (visible && !document.hidden && !motion.matches) raf = requestAnimationFrame(frame);
    else if (motion.matches) still(); else draw(clock);
  }
  resize();
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }).observe(canvas);
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
})();
