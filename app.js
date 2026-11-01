(function () {
  'use strict';

  const $ = s => document.querySelector(s);
  const params = new URLSearchParams(location.search);
  const SPEED = Math.min(200, Math.max(1, Number(params.get('speed')) || 1)); // test hook
  const now = () => performance.now() * SPEED;

  // ------------------------------------------------------------------
  // Config
  // ------------------------------------------------------------------
  const CADENCE = { low: { work: 30, rest: 30 }, medium: { work: 40, rest: 20 }, high: { work: 50, rest: 10 } };
  const ICONS = {
    bw: '<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="4.5" r="2"/><path d="M12 7v7M7 9.5l5 1.5 5-1.5M9 21l3-7 3 7"/></svg>',
    db: '<svg class="ico" viewBox="0 0 24 24"><path d="M8 12h8"/><rect x="3" y="8" width="3" height="8" rx="1"/><rect x="18" y="8" width="3" height="8" rx="1"/><path d="M6 10v4M18 10v4"/></svg>',
    kb: '<svg class="ico" viewBox="0 0 24 24"><path d="M8.5 9.5V8a3.5 3.5 0 0 1 7 0v1.5"/><circle cx="12" cy="15" r="6"/></svg>'
  };
  const OPTIONS = {
    duration: [9, 12, 15, 18].map(v => ({ v, label: String(v), sub: 'min' })),
    intensity: [
      { v: 'low', label: 'Low', sub: '30s on · 30s off' },
      { v: 'medium', label: 'Medium', sub: '40s on · 20s off' },
      { v: 'high', label: 'High', sub: '50s on · 10s off' }
    ],
    group: [
      { v: 'lower', label: 'Lower Core', sub: 'lower abs' },
      { v: 'upper', label: 'Upper Core', sub: 'upper abs' },
      { v: 'obliques', label: 'Obliques', sub: 'side abs' },
      { v: 'full', label: 'Full Core + Glutes', sub: 'complete' }
    ],
    equip: [
      { v: 'bw', label: 'Bodyweight', icon: ICONS.bw },
      { v: 'db', label: 'Dumbbell', icon: ICONS.db },
      { v: 'kb', label: 'Kettlebell', icon: ICONS.kb }
    ],
    complexity: [
      { v: 'low', label: 'Simple', sub: 'basic moves' },
      { v: 'medium', label: 'Moderate', sub: 'some coordination' },
      { v: 'high', label: 'Complex', sub: 'advanced' }
    ]
  };
  const LABEL = {
    group: { lower: 'Lower Core', upper: 'Upper Core', obliques: 'Obliques', full: 'Full Core + Glutes' },
    equip: { bw: 'Bodyweight', db: 'Dumbbell', kb: 'Kettlebell' },
    intensity: { low: 'Low', medium: 'Medium', high: 'High' },
    complexity: { low: 'Simple', medium: 'Moderate', high: 'Complex' },
    c: ['', 'Simple', 'Moderate', 'Complex'],
    i: ['', 'Low intensity', 'Medium intensity', 'High intensity']
  };

  const STORE_KEY = 'coredaily.cfg.v1';
  const DEFAULT_CFG = { duration: 12, intensity: 'medium', group: 'full', equip: ['bw'], complexity: 'medium', sound: true, voice: true, vibrate: true };
  let cfg = loadCfg();

  function loadCfg() {
    try {
      const c = Object.assign({}, DEFAULT_CFG, JSON.parse(localStorage.getItem(STORE_KEY) || '{}'));
      if (!OPTIONS.duration.some(o => o.v === c.duration)) c.duration = DEFAULT_CFG.duration;
      ['intensity', 'group', 'complexity'].forEach(k => { if (!OPTIONS[k].some(o => o.v === c[k])) c[k] = DEFAULT_CFG[k]; });
      if (!Array.isArray(c.equip)) c.equip = ['bw'];
      c.equip = c.equip.filter(e => LABEL.equip[e]);
      if (!c.equip.length) c.equip = ['bw'];
      return c;
    } catch (e) { return Object.assign({}, DEFAULT_CFG); }
  }
  function saveCfg() { try { localStorage.setItem(STORE_KEY, JSON.stringify(cfg)); } catch (e) { /* private mode */ } }

  // ------------------------------------------------------------------
  // Workout generator
  // ------------------------------------------------------------------
  const W_COMPLEXITY = { low: [0, 1, 0.12, 0], medium: [0, 0.6, 1, 0.15], high: [0, 0.35, 0.85, 1.25] };
  const W_INTENSITY = { low: [0, 1, 0.6, 0.12], medium: [0, 0.55, 1, 0.6], high: [0, 0.2, 0.75, 1.25] };

  function weight(ex, c) {
    // Equipment
    let we;
    if (ex.equip === 'bw') we = c.equip.includes('bw') ? 1 : 0.3; // bodyweight fills gaps if not chosen
    else we = c.equip.includes(ex.equip) ? 1.35 : 0;
    if (!we) return 0;
    // Target area
    let wg;
    if (c.group === 'full') wg = (ex.groups[0] === 'full' ? 1.4 : ex.groups.includes('full') ? 1.1 : 0.6) + (ex.glutes ? 0.9 : 0);
    else {
      const idx = ex.groups.indexOf(c.group);
      wg = idx === 0 ? 3 : idx > 0 ? 1.6 : 0.015;
    }
    const wc = W_COMPLEXITY[c.complexity][ex.c];
    const wi = W_INTENSITY[c.intensity][ex.i];
    return we * wg * wc * wi * (ex.uni ? 0.7 : 1);
  }

  function pickWeighted(list) {
    const total = list.reduce((s, x) => s + x.w, 0);
    let r = Math.random() * total;
    for (const x of list) { r -= x.w; if (r <= 0) return x; }
    return list[list.length - 1];
  }

  function equipOk(ex, c) { return ex.equip === 'bw' || c.equip.includes(ex.equip); }

  /** Returns a list of {ex, side} with length duration-1 (one minute is warm-up). */
  function generate(c) {
    const slots = c.duration - 1;
    // Used exercises keep a reduced weight instead of being removed, so a small
    // on-target pool repeats a move rather than drifting to off-target exercises.
    const pool = EXERCISES.map(e => ({ e, w: weight(e, c) })).filter(x => x.w > 0);
    const fallback = EXERCISES.filter(e => equipOk(e, c) && !e.uni).map(e => ({ e, w: 1 }));
    const out = [];
    let guard = 0;
    while (out.length < slots && guard++ < 500) {
      const remaining = slots - out.length;
      const last = out.length ? out[out.length - 1].ex.id : null;
      const uniSlots = out.filter(x => x.side).length;
      const uniAllowed = remaining >= 2 && uniSlots + 2 <= Math.max(2, Math.floor(slots * 0.4));
      const ok = x => x.e.id !== last && (!x.e.uni || uniAllowed);
      let cands = pool.filter(ok);
      if (!cands.length) cands = fallback.filter(ok);
      const pick = pickWeighted(cands);
      pick.w *= 0.12;
      if (pick.e.uni) { out.push({ ex: pick.e, side: 'Left' }, { ex: pick.e, side: 'Right' }); }
      else out.push({ ex: pick.e, side: null });
    }
    return out;
  }

  /** Swap the block at index i (both sides for unilateral moves). Returns false if no alternative. */
  function swapAt(list, i, c) {
    const item = list[i];
    const start = item.side === 'Right' ? i - 1 : i;
    const span = item.ex.uni ? 2 : 1;
    const used = new Set(list.map(x => x.ex.id));
    const prev = list[start - 1], next = list[start + span];
    const cands = EXERCISES
      .filter(e => !!e.uni === !!item.ex.uni && !used.has(e.id) && (!prev || prev.ex.id !== e.id) && (!next || next.ex.id !== e.id))
      .map(e => ({ e, w: weight(e, c) })).filter(x => x.w > 0);
    if (!cands.length) return false;
    const e = pickWeighted(cands).e;
    const repl = e.uni ? [{ ex: e, side: 'Left' }, { ex: e, side: 'Right' }] : [{ ex: e, side: null }];
    list.splice(start, span, ...repl);
    return start;
  }

  /** Expand into timed phases. Total is exactly duration * 60 seconds. */
  function buildPhases(list, c) {
    const { work, rest } = CADENCE[c.intensity];
    const ph = [
      { type: 'warmup', ex: WARMUP[0], dur: 25 },
      { type: 'warmup', ex: WARMUP[1], dur: 25 },
      { type: 'ready', ex: list[0].ex, side: list[0].side, dur: 10 }
    ];
    list.forEach((it, i) => {
      ph.push({ type: 'work', ex: it.ex, side: it.side, dur: work, round: i + 1 });
      if (i < list.length - 1) ph.push({ type: 'rest', ex: list[i + 1].ex, side: list[i + 1].side, dur: rest, round: i + 1 });
      else ph.push({ type: 'cooldown', ex: COOLDOWN, dur: rest, round: i + 1 });
    });
    return ph;
  }

  // ------------------------------------------------------------------
  // Feedback: sound, voice, vibration, wake lock
  // ------------------------------------------------------------------
  let actx = null;
  function unlockAudio() {
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      // A silent blip primes output on some Android builds.
      const o = actx.createOscillator(), g = actx.createGain();
      g.gain.value = 0.0001; o.connect(g).connect(actx.destination); o.start(); o.stop(actx.currentTime + 0.02);
    } catch (e) { actx = null; }
    if ('speechSynthesis' in window) { try { speechSynthesis.getVoices(); } catch (e) { /* ignore */ } }
  }
  function beep(freq, len, vol) {
    if (!cfg.sound || !actx) return;
    try {
      if (actx.state === 'suspended') actx.resume();
      const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.35, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + len + 0.05);
    } catch (e) { /* ignore */ }
  }
  function vibrate(p) { if (cfg.vibrate && navigator.vibrate) { try { navigator.vibrate(p); } catch (e) { /* ignore */ } } }

  let voice = null;
  function pickVoice() {
    if (!('speechSynthesis' in window)) return null;
    const vs = speechSynthesis.getVoices();
    return vs.find(v => /en[-_]US/i.test(v.lang) && /google/i.test(v.name)) ||
      vs.find(v => /en[-_](US|GB)/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || null;
  }
  if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => { voice = pickVoice(); };
  function say(text) {
    if (!cfg.voice || !('speechSynthesis' in window) || SPEED > 1) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      voice = voice || pickVoice();
      if (voice) u.voice = voice;
      u.lang = voice ? voice.lang : 'en-US';
      u.rate = 1.03; u.volume = 1;
      speechSynthesis.speak(u);
    } catch (e) { /* ignore */ }
  }

  let wakeLock = null;
  async function lockScreen() {
    try { if ('wakeLock' in navigator && !wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); } }
    catch (e) { wakeLock = null; }
  }
  function unlockScreen() { if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; } }

  // ------------------------------------------------------------------
  // Navigation & UI helpers
  // ------------------------------------------------------------------
  let backArmed = false;
  function show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
    if (id !== 'screen-home' && !backArmed) { history.pushState({ app: true }, ''); backArmed = true; }
  }
  let toastT = 0;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200);
  }
  const fmt = s => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

  // ------------------------------------------------------------------
  // Home
  // ------------------------------------------------------------------
  function renderHome() {
    document.querySelectorAll('.cfg').forEach(box => {
      const key = box.dataset.key, wrap = box.querySelector('.chips');
      wrap.innerHTML = OPTIONS[key].map(o => {
        const on = key === 'equip' ? cfg.equip.includes(o.v) : cfg[key] === o.v;
        return `<button class="chip" data-v="${o.v}" aria-pressed="${on}">${o.icon || ''}<b>${esc(o.label)}</b>${o.sub ? `<small>${esc(o.sub)}</small>` : ''}</button>`;
      }).join('');
    });
    document.querySelectorAll('[data-toggle]').forEach(b => b.setAttribute('aria-pressed', String(!!cfg[b.dataset.toggle])));
    const cad = CADENCE[cfg.intensity];
    $('#home-summary').innerHTML = `<b>${cfg.duration} min</b> · 1 min warm-up + ${cfg.duration - 1} rounds · ${cad.work}s / ${cad.rest}s`;
    const h = new Date().getHours();
    $('#greeting').textContent = h < 11 ? 'Good morning' : h < 17 ? 'Daily core session' : 'Evening core session';
  }

  document.querySelectorAll('.cfg').forEach(box => {
    box.addEventListener('click', e => {
      const b = e.target.closest('.chip'); if (!b) return;
      const key = box.dataset.key; let v = b.dataset.v;
      if (key === 'duration') v = Number(v);
      if (key === 'equip') {
        const has = cfg.equip.includes(v);
        if (has && cfg.equip.length === 1) { toast('Select at least one option'); return; }
        cfg.equip = has ? cfg.equip.filter(x => x !== v) : cfg.equip.concat(v);
      } else cfg[key] = v;
      saveCfg(); renderHome();
    });
  });
  document.querySelectorAll('[data-toggle]').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.toggle; cfg[k] = !cfg[k]; saveCfg(); renderHome();
    toast(`${{ sound: 'Sound', voice: 'Voice coach', vibrate: 'Vibration' }[k]} ${cfg[k] ? 'on' : 'off'}`);
    if (cfg[k]) { unlockAudio(); if (k === 'vibrate') vibrate(60); if (k === 'sound') beep(880, 0.12); }
  }));

  // ------------------------------------------------------------------
  // Preview
  // ------------------------------------------------------------------
  let workout = [];
  let thumbs = [];

  function renderPreview() {
    thumbs.forEach(f => f.destroy()); thumbs = [];
    const cad = CADENCE[cfg.intensity];
    $('#preview-meta').innerHTML = [
      `<span class="pill accent">${cfg.duration} min</span>`,
      `<span class="pill">${LABEL.intensity[cfg.intensity]} · ${cad.work}/${cad.rest}s</span>`,
      `<span class="pill">${LABEL.group[cfg.group]}</span>`,
      `<span class="pill">${cfg.equip.map(e => LABEL.equip[e]).join(' + ')}</span>`,
      `<span class="pill">${LABEL.complexity[cfg.complexity]}</span>`
    ].join('');
    const chev = '<svg class="chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>';
    const rows = [];
    rows.push(`<li><button class="ex-item special" data-special="warmup"><span class="num">W</span><span class="thumb"></span><span class="txt"><b>Warm-up</b><small>${WARMUP.map(w => w.name).join(' + ')} · 1 min</small></span>${chev}</button></li>`);
    workout.forEach((it, i) => {
      rows.push(`<li><button class="ex-item" data-i="${i}"><span class="num">${i + 1}</span><span class="thumb"></span><span class="txt"><b>${esc(it.ex.name)}</b><small>${it.side ? it.side + ' side · ' : ''}${cad.work}s · ${LABEL.equip[it.ex.equip]}</small></span>${chev}</button></li>`);
    });
    rows.push(`<li><button class="ex-item special cool" data-special="cooldown"><span class="num">C</span><span class="thumb"></span><span class="txt"><b>Cool-down</b><small>${COOLDOWN.name} · ${cad.rest}s</small></span>${chev}</button></li>`);
    $('#preview-list').innerHTML = rows.join('');
    $('#preview-list').querySelectorAll('.ex-item').forEach(btn => {
      const ex = btn.dataset.special === 'warmup' ? WARMUP[0] : btn.dataset.special === 'cooldown' ? COOLDOWN : workout[Number(btn.dataset.i)].ex;
      thumbs.push(Figure.mount(btn.querySelector('.thumb'), ex, { animate: false, still: 0.65 }));
    });
  }

  $('#btn-build').addEventListener('click', () => {
    unlockAudio();
    workout = generate(cfg);
    renderPreview(); show('screen-preview');
    $('#screen-preview .scroll').scrollTop = 0;
  });
  $('#btn-preview-back').addEventListener('click', () => show('screen-home'));
  $('#btn-shuffle').addEventListener('click', () => {
    workout = generate(cfg); renderPreview(); toast('New workout generated');
  });
  $('#preview-list').addEventListener('click', e => {
    const b = e.target.closest('.ex-item'); if (!b) return;
    if (b.dataset.special === 'warmup') openSheet(WARMUP[0], null, WARMUP[1]);
    else if (b.dataset.special === 'cooldown') openSheet(COOLDOWN, null);
    else openSheet(workout[Number(b.dataset.i)].ex, Number(b.dataset.i));
  });

  // ------------------------------------------------------------------
  // Detail sheet
  // ------------------------------------------------------------------
  let sheetFig = null, sheetIndex = null;
  function openSheet(ex, index, alsoEx) {
    sheetIndex = index;
    $('#sheet-name').textContent = alsoEx ? `${ex.name} + ${alsoEx.name}` : ex.name;
    const tags = [];
    if (ex.groups.length) tags.push(...ex.groups.map(g => LABEL.group[g]));
    if (ex.glutes && !ex.groups.includes('full')) tags.push('Glutes');
    tags.push(LABEL.equip[ex.equip]);
    if (ex.groups.length) tags.push(LABEL.c[ex.c], LABEL.i[ex.i]);
    if (ex.uni) tags.push('Both sides');
    $('#sheet-tags').innerHTML = tags.map(t => `<span class="tag">${esc(t)}</span>`).join('');
    $('#sheet-desc').textContent = alsoEx ? `${ex.desc} Then: ${alsoEx.desc}` : ex.desc;
    $('#sheet-cues').innerHTML = ex.cues.map(c => `<li>${esc(c)}</li>`).join('');
    $('#btn-swap').hidden = index == null;
    $('#sheet-backdrop').hidden = false;
    if (sheetFig) sheetFig.destroy();
    sheetFig = Figure.mount($('#sheet-figure'), ex);
  }
  function closeSheet() {
    $('#sheet-backdrop').hidden = true;
    if (sheetFig) { sheetFig.destroy(); sheetFig = null; }
  }
  $('#btn-sheet-close').addEventListener('click', closeSheet);
  $('#sheet-backdrop').addEventListener('click', e => { if (e.target.id === 'sheet-backdrop') closeSheet(); });
  $('#btn-swap').addEventListener('click', () => {
    if (sheetIndex == null) return;
    const at = swapAt(workout, sheetIndex, cfg);
    if (at === false) { toast('No alternative exercise for these settings'); return; }
    renderPreview();
    openSheet(workout[at].ex, at);
    toast('Exercise swapped');
  });

  // ------------------------------------------------------------------
  // Player
  // ------------------------------------------------------------------
  const RING = 2 * Math.PI * 52;
  const P = { phases: [], idx: 0, start: 0, pausedAt: 0, paused: false, timer: 0, raf: 0, lastSec: -1, fig: null, total: 0, startedAt: 0 };

  function startWorkout() {
    unlockAudio();
    P.phases = buildPhases(workout, cfg);
    P.total = P.phases.reduce((s, p) => s + p.dur, 0);
    P.idx = 0; P.paused = false; P.startedAt = Date.now();
    $('#pl-segbar').innerHTML = workout.map(() => '<i></i>').join('');
    $('#screen-player').classList.remove('paused');
    show('screen-player');
    lockScreen();
    enterPhase(now(), false);
    clearInterval(P.timer);
    P.timer = setInterval(tick, 100);
    cancelAnimationFrame(P.raf);
    const frame = () => { renderTime(); P.raf = requestAnimationFrame(frame); };
    P.raf = requestAnimationFrame(frame);
  }

  function phaseLabel(ph) {
    return { warmup: 'WARM-UP', ready: 'GET READY', work: 'WORK', rest: 'REST', cooldown: 'COOL-DOWN' }[ph.type];
  }

  function enterPhase(startTime, silent) {
    const ph = P.phases[P.idx];
    P.start = startTime; P.lastSec = -1;
    const scr = $('#screen-player');
    scr.dataset.phase = ph.type;
    $('#pl-phase').textContent = phaseLabel(ph);
    const upnext = { rest: 'Up next', ready: 'First exercise', warmup: `Warm-up ${P.idx + 1} of 2`, cooldown: 'Stretch it out', work: '' }[ph.type];
    $('#pl-upnext').textContent = upnext;
    $('#pl-name').textContent = ph.ex.name;
    $('#pl-side').textContent = ph.side ? `${ph.side} side` : '';
    $('#pl-cues').innerHTML = ph.ex.cues.slice(0, 2).map(c => `<li>${esc(c)}</li>`).join('');
    if (P.fig) P.fig.destroy();
    P.fig = Figure.mount($('#pl-figure'), ph.ex);
    if (P.paused) P.fig.setPlaying(false);
    // round counter + segments
    const round = ph.round || 0, n = workout.length;
    $('#pl-round').textContent = ph.type === 'warmup' || ph.type === 'ready' ? 'Warm-up' : ph.type === 'cooldown' ? 'Cool-down' : `Round ${round} / ${n}`;
    const segs = $('#pl-segbar').children;
    for (let i = 0; i < segs.length; i++) {
      const doneIdx = ph.type === 'work' ? round - 1 : round;
      segs[i].className = i < doneIdx ? 'done' : (ph.type === 'work' && i === round - 1) ? 'cur' : '';
      segs[i].style.removeProperty('--p');
    }
    if (silent) return;
    // feedback
    const sideTxt = ph.side ? `, ${ph.side.toLowerCase()} side` : '';
    if (ph.type === 'work') { beep(1046, 0.35, 0.45); vibrate(350); say(`Go! ${ph.ex.name}${sideTxt}`); }
    else if (ph.type === 'rest') {
      beep(523, 0.35); vibrate([120, 80, 120]);
      const same = P.phases[P.idx - 1] && P.phases[P.idx - 1].ex.id === ph.ex.id;
      say(same ? `Rest. Switch sides. Next: ${ph.ex.name}${sideTxt}` : `Rest. Next up: ${ph.ex.name}${sideTxt}`);
    }
    else if (ph.type === 'warmup') { beep(784, 0.25); vibrate(150); say(P.idx === 0 ? `Let's warm up. ${ph.ex.name}` : ph.ex.name); }
    else if (ph.type === 'ready') { beep(784, 0.25); vibrate(150); say(`Get ready. First exercise: ${ph.ex.name}${sideTxt}`); }
    else if (ph.type === 'cooldown') { beep(523, 0.35); vibrate([120, 80, 120]); say(`Last round done. Great work! Cool down with a ${ph.ex.name}`); }
  }

  function elapsedInPhase(t) { return ((P.paused ? P.pausedAt : t) - P.start) / 1000; }

  function tick() {
    if (P.paused || !P.phases.length) return;
    const t = now();
    let el = elapsedInPhase(t);
    let ph = P.phases[P.idx];
    // Advance (catches up if the app was in the background).
    while (el >= ph.dur) {
      const overflow = el - ph.dur;
      P.idx++;
      if (P.idx >= P.phases.length) { finish(true); return; }
      enterPhase(t - overflow * 1000, overflow > 1.5);
      el = overflow; ph = P.phases[P.idx];
    }
    const left = Math.ceil(ph.dur - el);
    if (left !== P.lastSec) {
      P.lastSec = left;
      if (left <= 3 && left >= 1) { beep(left === 1 ? 880 : 660, 0.12, 0.3); vibrate(50); }
      if (ph.type === 'work' && ph.dur >= 40 && left === Math.round(ph.dur / 2)) say('Halfway');
    }
  }

  function renderTime() {
    if (!P.phases.length) return;
    const ph = P.phases[P.idx];
    const el = Math.min(ph.dur, Math.max(0, elapsedInPhase(now())));
    const left = ph.dur - el;
    $('#pl-secs').textContent = Math.ceil(left);
    $('#pl-of').textContent = `of ${ph.dur}s`;
    $('#pl-ring').style.strokeDashoffset = String(RING * (el / ph.dur));
    let done = 0; for (let i = 0; i < P.idx; i++) done += P.phases[i].dur;
    $('#pl-total').textContent = `${fmt(P.total - done - el)} left`;
    if (ph.type === 'work') {
      const cur = $('#pl-segbar').children[ph.round - 1];
      if (cur) cur.style.setProperty('--p', `${(el / ph.dur) * 100}%`);
    }
  }

  function setPaused(on) {
    if (on === P.paused) return;
    const t = now();
    if (on) { P.pausedAt = t; P.paused = true; if ('speechSynthesis' in window) speechSynthesis.cancel(); }
    else { P.start += t - P.pausedAt; P.paused = false; unlockAudio(); lockScreen(); }
    $('#screen-player').classList.toggle('paused', on);
    $('#btn-pause').setAttribute('aria-label', on ? 'Resume' : 'Pause');
    if (P.fig) P.fig.setPlaying(!on);
  }

  function jump(delta) {
    const t = now();
    if (delta < 0 && elapsedInPhase(t) > 3) { /* restart current phase */ }
    else P.idx = Math.min(P.phases.length - 1, Math.max(0, P.idx + delta));
    if (P.paused) P.pausedAt = t;
    enterPhase(t, false);
    renderTime();
  }

  function stopPlayer() {
    clearInterval(P.timer); cancelAnimationFrame(P.raf);
    if (P.fig) { P.fig.destroy(); P.fig = null; }
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    unlockScreen();
  }

  function finish(completed) {
    stopPlayer();
    const phases = P.phases;
    P.phases = [];
    if (!completed) { show('screen-preview'); return; }
    beep(784, 0.15); setTimeout(() => beep(1046, 0.15), 160); setTimeout(() => beep(1318, 0.4), 320);
    vibrate([100, 60, 100, 60, 300]);
    say('Workout complete. Awesome job!');
    const uniqueEx = new Set(phases.filter(p => p.type === 'work').map(p => p.ex.id)).size;
    const workSecs = phases.filter(p => p.type === 'work').reduce((s, p) => s + p.dur, 0);
    $('#done-stats').innerHTML = [
      [`${cfg.duration}`, 'minutes'], [`${uniqueEx}`, 'exercises'], [`${Math.round(workSecs / 60 * 10) / 10}`, 'min under tension']
    ].map(([v, l]) => `<div class="stat"><b>${v}</b><small>${l}</small></div>`).join('');
    $('#done-sub').textContent = `${LABEL.intensity[cfg.intensity]} intensity · ${LABEL.group[cfg.group]}. See you tomorrow!`;
    show('screen-done');
  }

  $('#btn-start').addEventListener('click', startWorkout);
  $('#btn-pause').addEventListener('click', () => setPaused(!P.paused));
  $('#btn-next').addEventListener('click', () => {
    if (P.idx >= P.phases.length - 1) { finish(true); return; }
    jump(1);
  });
  $('#btn-prev').addEventListener('click', () => jump(-1));
  $('#btn-quit').addEventListener('click', () => {
    const wasPaused = P.paused; setPaused(true);
    $('#confirm').hidden = false;
    $('#confirm').dataset.wasPaused = wasPaused ? '1' : '';
  });
  $('#btn-confirm-no').addEventListener('click', () => {
    $('#confirm').hidden = true;
    if (!$('#confirm').dataset.wasPaused) setPaused(false);
  });
  $('#btn-confirm-yes').addEventListener('click', () => { $('#confirm').hidden = true; finish(false); });
  $('#btn-done').addEventListener('click', () => { renderHome(); show('screen-home'); });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && P.phases.length) { lockScreen(); if (actx && actx.state === 'suspended') actx.resume(); tick(); }
  });

  // Android back button / gesture: step back through screens; on the home screen it leaves the app.
  window.addEventListener('popstate', () => {
    backArmed = false;
    if (!$('#sheet-backdrop').hidden) closeSheet();
    else if (!$('#confirm').hidden) $('#btn-confirm-no').click();
    else {
      const active = document.querySelector('.screen.active').id;
      if (active === 'screen-player') $('#btn-quit').click();
      else if (active === 'screen-preview') show('screen-home');
      else if (active === 'screen-done') $('#btn-done').click();
    }
    if (document.querySelector('.screen.active').id !== 'screen-home' && !backArmed) { history.pushState({ app: true }, ''); backArmed = true; }
  });

  // ------------------------------------------------------------------
  // Boot
  // ------------------------------------------------------------------
  renderHome();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }

  // Exposed for automated tests only.
  window.__core = { generate, buildPhases, weight, swapAt, CADENCE, get cfg() { return cfg; } };
})();
