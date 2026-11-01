/* Stick-figure renderer.
 * A pose is a set of absolute segment angles (degrees, 0 = right, 90 = down).
 *   t: torso (hip -> shoulder), h: head direction (defaults to t)
 *   a / b: near / far arm  [upper arm, forearm]
 *   l / m: near / far leg  [thigh, shin]
 * Figures are grounded automatically (lowest joint touches the floor) and
 * animate A -> B -> A with an ease-in-out curve.
 */
(function (global) {
  'use strict';

  const SEG = { T: 38, N: 5, R: 7.5, UA: 17, FA: 16, TH: 22, SH: 22 };
  const VB_W = 200, VB_H = 150, FLOOR = 136, MAX_W = 176, MAX_H = 124;
  const NS = 'http://www.w3.org/2000/svg';

  const rad = d => (d * Math.PI) / 180;
  const pt = (o, ang, len) => [o[0] + Math.cos(rad(ang)) * len, o[1] + Math.sin(rad(ang)) * len];
  const angLerp = (a, b, k) => a + ((((b - a) % 360) + 540) % 360 - 180) * k;

  function fk(p) {
    const hip = [0, 0];
    const sh = pt(hip, p.t, SEG.T);
    const head = pt(sh, p.h == null ? p.t : p.h, SEG.N + SEG.R);
    const ea = pt(sh, p.a[0], SEG.UA), wa = pt(ea, p.a[1], SEG.FA);
    const eb = pt(sh, p.b[0], SEG.UA), wb = pt(eb, p.b[1], SEG.FA);
    const ka = pt(hip, p.l[0], SEG.TH), fa = pt(ka, p.l[1], SEG.SH);
    const kb = pt(hip, p.m[0], SEG.TH), fb = pt(kb, p.m[1], SEG.SH);
    return { hip, sh, head, ea, wa, eb, wb, ka, fa, kb, fb };
  }

  function lerpPose(A, B, k) {
    const pair = (x, y) => [angLerp(x[0], y[0], k), angLerp(x[1], y[1], k)];
    return {
      t: angLerp(A.t, B.t, k),
      h: angLerp(A.h == null ? A.t : A.h, B.h == null ? B.t : B.h, k),
      a: pair(A.a, B.a), b: pair(A.b, B.b), l: pair(A.l, B.l), m: pair(A.m, B.m)
    };
  }

  const LIMB_KEYS = ['hip', 'sh', 'ea', 'wa', 'eb', 'wb', 'ka', 'fa', 'kb', 'fb'];

  function bbox(j) {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const k of LIMB_KEYS.concat('head')) {
      const r = k === 'head' ? SEG.R : 0;
      x0 = Math.min(x0, j[k][0] - r); x1 = Math.max(x1, j[k][0] + r);
      y0 = Math.min(y0, j[k][1] - r); y1 = Math.max(y1, j[k][1] + r);
    }
    return { x0, x1, y0, y1 };
  }
  const groundY = j => Math.max(...LIMB_KEYS.map(k => j[k][1]));

  function el(name, attrs, parent) {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function propShape(kind, parent) {
    const g = el('g', { class: 'fig-prop' }, parent);
    if (kind === 'db') {
      el('rect', { x: -7, y: -1.6, width: 14, height: 3.2, rx: 1.4 }, g);
      el('rect', { x: -9, y: -5, width: 4.5, height: 10, rx: 1.6 }, g);
      el('rect', { x: 4.5, y: -5, width: 4.5, height: 10, rx: 1.6 }, g);
    } else {
      el('path', { d: 'M -4.5 -3 Q -4.5 -10 0 -10 Q 4.5 -10 4.5 -3', fill: 'none', 'stroke-width': 2.4 }, g);
      el('circle', { cx: 0, cy: 3, r: 6.5 }, g);
    }
    return g;
  }

  const active = new Set();
  let raf = 0;
  function loop(ts) {
    active.forEach(f => f.frame(ts));
    raf = active.size ? requestAnimationFrame(loop) : 0;
  }

  function mount(container, ex, opts) {
    opts = opts || {};
    container.innerHTML = '';
    const svg = el('svg', { viewBox: `0 0 ${VB_W} ${VB_H}`, class: 'fig', 'aria-hidden': 'true' });
    container.appendChild(svg);
    el('line', { x1: 8, x2: VB_W - 8, y1: FLOOR + 4.5, y2: FLOOR + 4.5, class: 'fig-floor' }, svg);
    const shadow = el('ellipse', { cy: FLOOR + 4.5, rx: 40, ry: 3, class: 'fig-shadow' }, svg);
    const world = el('g', {}, svg);
    const far = el('g', { class: 'fig-far' }, world);
    const armB = el('polyline', { class: 'fig-limb' }, far);
    const legB = el('polyline', { class: 'fig-limb' }, far);
    const near = el('g', { class: 'fig-near' }, world);
    const legA = el('polyline', { class: 'fig-limb' }, near);
    const torso = el('line', { class: 'fig-torso' }, near);
    const head = el('circle', { r: SEG.R, class: 'fig-head' }, near);
    const armA = el('polyline', { class: 'fig-limb' }, near);
    const props = (ex.prop ? ex.prop.on : []).map(on => ({ on, g: propShape(ex.prop.k, world) }));

    // Fixed scale + horizontal centre for the whole motion (no jitter).
    const samples = [0, 0.25, 0.5, 0.75, 1].map(k => fk(lerpPose(ex.A, ex.B, k)));
    let x0 = Infinity, x1 = -Infinity, hMax = 0;
    samples.forEach(j => {
      const b = bbox(j);
      x0 = Math.min(x0, b.x0); x1 = Math.max(x1, b.x1);
      hMax = Math.max(hMax, groundY(j) - b.y0);
    });
    const s = Math.min(1.25, MAX_W / (x1 - x0), MAX_H / hMax);
    const cx = (x0 + x1) / 2;

    const P = (j, k, oy) => `${(j[k][0] - cx) * s + VB_W / 2},${(j[k][1] + oy) * s + FLOOR}`;
    const tempo = (ex.tempo || 2.6) * 1000;
    const t0 = performance.now();

    function draw(k) {
      const j = fk(lerpPose(ex.A, ex.B, k));
      const oy = -groundY(j);
      armA.setAttribute('points', [P(j, 'sh', oy), P(j, 'ea', oy), P(j, 'wa', oy)].join(' '));
      armB.setAttribute('points', [P(j, 'sh', oy), P(j, 'eb', oy), P(j, 'wb', oy)].join(' '));
      legA.setAttribute('points', [P(j, 'hip', oy), P(j, 'ka', oy), P(j, 'fa', oy)].join(' '));
      legB.setAttribute('points', [P(j, 'hip', oy), P(j, 'kb', oy), P(j, 'fb', oy)].join(' '));
      const [hx, hy] = P(j, 'hip', oy).split(',');
      const [sx, sy] = P(j, 'sh', oy).split(',');
      torso.setAttribute('x1', hx); torso.setAttribute('y1', hy);
      torso.setAttribute('x2', sx); torso.setAttribute('y2', sy);
      const [qx, qy] = P(j, 'head', oy).split(',');
      head.setAttribute('cx', qx); head.setAttribute('cy', qy);
      head.setAttribute('r', SEG.R * s);
      props.forEach(p => {
        const [px, py] = P(j, p.on, oy).split(',');
        p.g.setAttribute('transform', `translate(${px} ${py}) scale(${s})`);
      });
      const b = bbox(j);
      shadow.setAttribute('cx', ((b.x0 + b.x1) / 2 - cx) * s + VB_W / 2);
      shadow.setAttribute('rx', Math.max(18, ((b.x1 - b.x0) / 2) * s));
    }

    const fig = {
      playing: opts.animate !== false,
      frame(ts) {
        if (!fig.playing) return;
        const ph = (((ts - t0) % tempo) / tempo) * 2 * Math.PI;
        draw((1 - Math.cos(ph)) / 2);
      },
      setPlaying(on) {
        fig.playing = on;
        if (on && opts.animate !== false) { active.add(fig); if (!raf) raf = requestAnimationFrame(loop); }
        else active.delete(fig);
      },
      destroy() { active.delete(fig); container.innerHTML = ''; }
    };
    draw(opts.still == null ? 0 : opts.still);
    if (opts.animate !== false) fig.setPlaying(true);
    return fig;
  }

  global.Figure = { mount, fk, lerpPose };
})(window);
