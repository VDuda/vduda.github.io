(() => {
  if (window.__beckerChartsLoaded) return;
  window.__beckerChartsLoaded = true;

  // ---------------------------------------------------------------- theme
  const FONT = '12px system-ui, -apple-system, "Segoe UI", sans-serif';
  const SMALL = '11px system-ui, -apple-system, "Segoe UI", sans-serif';
  const MUTED = '#647067';
  const INK = '#3c443c';
  const GRID = '#dfe4dc';
  const ZERO = '#8a918a';
  const PLOT_BORDER = '#d3d9d0';
  const BAR = '#527b5d';
  const BAR_HI = '#3f6549';
  const SERIES = ['#2f6b4f', '#c08b55', '#637b91', '#9b6557'];
  const TREE = ['#527b5d', '#c08b55', '#7488a0', '#9b6557', '#8c79a5', '#568f8c', '#b7a65b', '#bc7694', '#8a986d', '#7797b8', '#a6815d'];

  // --------------------------------------------------------------- format
  const moneyShort = n => n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B`
    : n >= 1e6 ? `$${(n / 1e6).toFixed(0)}M` : `$${(n / 1e3).toFixed(0)}K`;
  const moneyFull = n => '$' + Math.round(n).toLocaleString('en-US');
  const intFull = n => Math.round(n).toLocaleString('en-US');
  const pct = v => `${Math.round(v * 100) / 100}%`;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

  // ----------------------------------------------------------- nice ticks
  // Human-friendly axis ticks (1/2/5 x powers of ten), domain snapped out.
  function niceTicks(min, max, target) {
    target = target || 5;
    if (!isFinite(min) || !isFinite(max)) return [0];
    if (min === max) { min -= 1; max += 1; }
    const span = max - min;
    const step0 = span / target;
    const mag = Math.pow(10, Math.floor(Math.log10(step0)));
    const norm = step0 / mag;
    let step;
    if (norm >= 5) step = 10;
    else if (norm >= 2) step = 5;
    else if (norm >= 1) step = 2;
    else step = 1;
    step *= mag;
    const ticks = [];
    for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-9; v += step) {
      ticks.push(+v.toFixed(10));
    }
    if (!ticks.length) ticks.push(Math.ceil(min / step) * step);
    while (ticks[ticks.length - 1] < max) ticks.push(+(ticks[ticks.length - 1] + step).toFixed(10));
    if (ticks[0] > min) ticks.unshift(+(ticks[0] - step).toFixed(10));
    return ticks;
  }

  // ---------------------------------------------------------------- canvas
  function setupCanvas(canvas, height) {
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(300, canvas.clientWidth);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.height = height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.font = FONT;
    return { ctx, width, height };
  }

  function framePlot(ctx, left, top, plotW, plotH) {
    ctx.strokeStyle = PLOT_BORDER;
    ctx.lineWidth = 1;
    ctx.strokeRect(left + 0.5, top + 0.5, plotW - 1, plotH - 1);
  }

  function drawLegend(ctx, names, left, y) {
    ctx.font = FONT;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    let x = left;
    names.forEach((name, i) => {
      ctx.fillStyle = SERIES[i % SERIES.length];
      ctx.fillRect(x, y - 9, 10, 10);
      ctx.fillStyle = '#526057';
      ctx.fillText(name, x + 14, y);
      x += 14 + ctx.measureText(name).width + 22;
    });
  }

  // ------------------------------------------------------------------ bars
  // kind: "volume" (log $) | "sample" (linear counts) | "category-gap" (pp)
  function paintBars(ctx, W, H, S) {
    const kind = S.kind;
    const rows = kind === 'category-gap' ? S.view : S.data.data;
    const left = 64, right = 12, top = 18;
    const bottom = kind === 'category-gap' ? 112 : 64;
    const plotW = W - left - right, plotH = H - top - bottom;
    const val = (d) => kind === 'volume' ? d.volume : kind === 'sample' ? d.trades : d.Gap;
    const max = Math.max(...rows.map(val));
    const log = kind === 'volume';
    const min = log ? Math.min(...rows.map(val)) : 0;

    const ticks = log
      ? [1e7, 1e8, 1e9, 1e10].filter(t => t >= min && t <= max * 1.02)
      : niceTicks(0, max, 5);
    const yOf = log
      ? v => top + plotH - (Math.log10(v / min) / Math.log10(max / min)) * plotH
      : (() => {
        const hi = Math.max(ticks[ticks.length - 1], max);
        return v => top + plotH - (v / hi) * plotH;
      })();

    ctx.font = FONT; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ticks.forEach(t => {
      const y = yOf(t);
      ctx.strokeStyle = GRID;
      ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(W - right, y); ctx.stroke();
      ctx.fillStyle = MUTED;
      ctx.fillText(log ? moneyShort(t) : (t >= 1e6 ? `${+(t / 1e6).toFixed(1)}M` : `${t}`), left - 8, y);
    });
    framePlot(ctx, left, top, plotW, plotH);

    const n = rows.length;
    const slot = plotW / n;
    const barW = Math.min(kind === 'category-gap' ? 36 : 44, slot * 0.62);
    const shapes = [];
    rows.forEach((d, i) => {
      const ratio = log ? Math.log10(val(d) / min) / Math.log10(max / min) : val(d) / Math.max(ticks[ticks.length - 1], max);
      const bh = Math.max(2, ratio * plotH);
      const x = left + i * slot + (slot - barW) / 2;
      const y = top + plotH - bh;
      const hot = S.hover != null && S.hover.index === i;
      ctx.fillStyle = hot ? BAR_HI : BAR;
      ctx.fillRect(x, y, barW, bh);
      if (hot) { ctx.strokeStyle = '#2c4635'; ctx.lineWidth = 1.5; ctx.strokeRect(x + 0.5, y + 0.5, barW - 1, bh - 1); }
      shapes.push({ index: i, x, y, w: barW, h: bh });
    });

    // x labels
    ctx.fillStyle = '#59645d';
    if (kind === 'category-gap') {
      ctx.font = SMALL; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      rows.forEach((d, i) => {
        const x = left + i * slot + slot / 2;
        ctx.save(); ctx.translate(x, top + plotH + 14); ctx.rotate(-Math.PI / 4);
        ctx.fillText(d.category, 0, 0); ctx.restore();
      });
      ctx.font = SMALL; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#526057';
      ctx.fillText('Maker–taker gap (percentage points)', left, 12);
    } else {
      const every = kind === 'volume' ? 4 : 1;
      ctx.font = SMALL; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      rows.forEach((d, i) => {
        if (i % every !== 0 && i !== rows.length - 1) return;
        const x = left + (i + 0.5) * (plotW / n);
        ctx.save(); ctx.translate(x, top + plotH + 14); ctx.rotate(-Math.PI / 4);
        ctx.fillText(kind === 'volume' ? d.quarter : d.price, 0, 0); ctx.restore();
      });
      ctx.font = FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#526057';
      ctx.fillText(kind === 'volume' ? 'Quarter · log scale' : 'Contract price bucket', left + plotW / 2, H - 6);
    }
    return { shapes, plot: { left, top, plotW, plotH } };
  }

  function hitBars(S, geom, x, y) {
    const kind = S.kind;
    const rows = kind === 'category-gap' ? S.view : S.data.data;
    const s = geom.shapes.find(s => x >= s.x - 3 && x <= s.x + s.w + 3 && y >= geom.plot.top && y <= geom.plot.top + geom.plot.plotH);
    if (!s) return null;
    const d = rows[s.index];
    if (kind === 'volume') return tip(s.index, `Quarter ${esc(d.quarter)}`, [['Volume', moneyFull(d.volume)]]);
    if (kind === 'sample') return tip(s.index, `Contracts priced ${esc(d.price)}`, [['Trades', intFull(d.trades)]]);
    return tip(s.index, esc(d.category), [
      ['Maker–taker gap', pct(d.Gap) + ' pts'],
      ['Taker return', pct(d['Taker Return'])],
      ['Maker return', pct(d['Maker Return'])],
      ['Trades', intFull(d['N trades'])],
    ]);
  }

  // ------------------------------------------------------------------ lines
  const LINE_CFG = {
    'maker-price': { fields: ['Taker', 'Maker (counterparty)'], names: ['Taker', 'Maker'], xLabel: 'Contract price (cents)', dash: [[], []], xOf: r => `${r.price}¢` },
    'yes-no': { fields: ['yes_return', 'no_return'], names: ['YES', 'NO'], xLabel: 'Equal purchase cost (cents)', dash: [[], []], xOf: r => `${r.price}¢` },
    'gap-over-time': { fields: ['Taker Return', 'Maker Return'], names: ['Taker', 'Maker'], xLabel: 'Quarter', dash: [[], []], xOf: r => r.quarter, quarters: true },
    'calibration': { fields: ['actual', 'implied'], names: ['Actual win rate', 'Implied (price)'], xLabel: 'Contract price (cents)', dash: [[], [5, 5]], xOf: r => `${r.price}¢`, ticks: [0, 20, 40, 60, 80, 100], domain: [-4, 104] },
  };

  function paintLines(ctx, W, H, S) {
    const kind = S.kind, cfg = LINE_CFG[kind];
    const rows = S.data.data;
    const left = 64, right = 14, top = 26, bottom = cfg.quarters ? 84 : 40;
    const plotW = W - left - right, plotH = H - top - bottom;
    const values = rows.flatMap(r => cfg.fields.map(k => r[k]));
    let lo = Math.min(0, ...values), hi = Math.max(0, ...values);
    const pad = (hi - lo) * 0.08 || 1; lo -= pad; hi += pad;
    const ticks = cfg.ticks || niceTicks(lo, hi, 5);
    const dMin = cfg.domain ? cfg.domain[0] : Math.min(ticks[0], lo);
    const dMax = cfg.domain ? cfg.domain[1] : Math.max(ticks[ticks.length - 1], hi);
    const yOf = v => top + (dMax - v) / (dMax - dMin) * plotH;
    const xOf = i => left + i * plotW / (rows.length - 1);

    ctx.font = FONT; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ticks.forEach(t => {
      const y = yOf(t);
      ctx.strokeStyle = GRID;
      ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(W - right, y); ctx.stroke();
      ctx.fillStyle = MUTED;
      ctx.fillText(`${+t.toFixed(1)}%`, left - 8, y);
    });
    const zy = yOf(0);
    ctx.strokeStyle = ZERO; ctx.lineWidth = 1.25;
    ctx.beginPath(); ctx.moveTo(left, zy); ctx.lineTo(W - right, zy); ctx.stroke();
    framePlot(ctx, left, top, plotW, plotH);

    cfg.fields.forEach((field, s) => {
      ctx.strokeStyle = SERIES[s % SERIES.length];
      ctx.lineWidth = S.hover != null ? 2 : 2.25;
      ctx.setLineDash(cfg.dash[s]);
      ctx.beginPath();
      rows.forEach((r, i) => { const xx = xOf(i), yy = yOf(r[field]); i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); });
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // hover marker: guide + dots
    if (S.hover != null) {
      const i = S.hover.index, xx = xOf(i);
      ctx.strokeStyle = '#9aa39a'; ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(xx, top); ctx.lineTo(xx, top + plotH); ctx.stroke();
      ctx.setLineDash([]);
      cfg.fields.forEach((field, s) => {
        ctx.fillStyle = SERIES[s % SERIES.length];
        ctx.beginPath(); ctx.arc(xx, yOf(rows[i][field]), 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(xx, yOf(rows[i][field]), 1.8, 0, Math.PI * 2); ctx.fill();
      });
    }

    drawLegend(ctx, cfg.names, left, 14);

    if (cfg.quarters) {
      ctx.font = SMALL; ctx.fillStyle = '#59645d'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      rows.forEach((r, i) => {
        if (i % 2 !== 0 && i !== rows.length - 1) return;
        ctx.save(); ctx.translate(xOf(i), top + plotH + 12); ctx.rotate(-Math.PI / 4);
        ctx.fillText(r.quarter, 0, 0); ctx.restore();
      });
    } else {
      ctx.font = SMALL; ctx.fillStyle = MUTED; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      const at = [0, 24, 49, 74, 98];
      at.forEach(i => { if (i < rows.length) ctx.fillText(`${rows[i].price}¢`, xOf(i), top + plotH + 8); });
    }
    ctx.font = FONT; ctx.fillStyle = '#526057'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(cfg.xLabel, left + plotW / 2, H - 6);
    return { plot: { left, top, plotW, plotH }, count: rows.length };
  }

  function hitLines(S, geom, x, y) {
    const cfg = LINE_CFG[S.kind];
    const rows = S.data.data;
    const { left, top, plotW, plotH } = geom.plot;
    if (x < left - 8 || x > left + plotW + 8 || y < top - 8 || y > top + plotH + 8) return null;
    const i = Math.max(0, Math.min(rows.length - 1, Math.round((x - left) / plotW * (rows.length - 1))));
    const r = rows[i];
    const fmtVal = S.kind === 'calibration'
      ? v => `${Math.round(v * 100) / 100}%`
      : v => pct(v);
    return tip(i, S.kind === 'calibration' ? `Price ${esc(cfg.xOf(r))}` : S.kind === 'gap-over-time' ? esc(r.quarter) : `Cost ${esc(cfg.xOf(r))}`,
      cfg.fields.map((f, s) => [cfg.names[s], fmtVal(r[f]), SERIES[s % SERIES.length]]));
  }

  // ---------------------------------------------------------------- treemap
  // Squarified treemap (Bruls et al.): strips along the long side, worst-aspect first.
  function rowWorst(row, sum, side) {
    let hi = -Infinity, lo = Infinity;
    for (const it of row) { if (it.area > hi) hi = it.area; if (it.area < lo) lo = it.area; }
    if (!(lo > 0)) return Infinity;
    const s2 = side * side, t = sum * sum;
    return Math.max(s2 * hi / t, t / (s2 * lo));
  }

  function squarify(nodes, x, y, w, h) {
    const total = nodes.reduce((s, n) => s + (+n.value || 0), 0) || 1;
    const items = nodes
      .map(n => ({ node: n, area: (+n.value || 0) / total * w * h }))
      .filter(it => it.area > 0)
      .sort((a, b) => b.area - a.area);
    const out = [];
    let cx = x, cy = y, cw = w, ch = h, row = [], sum = 0;
    const flush = () => {
      if (!row.length) return;
      // Lay each strip along the SHORT side of the remaining rect. This keeps
      // rectangles squarish even when one item dominates (e.g. Sports = 73%):
      // the giant goes in a full-height column, the rest subdivide beside it.
      if (cw >= ch) { // short side is height: vertical strip, full height
        const ww = sum / ch;
        let off = 0;
        row.forEach(it => { const hh = it.area / sum * ch; out.push({ node: it.node, x: cx, y: cy + off, w: ww, h: hh }); off += hh; });
        cx += ww; cw -= ww;
      } else { // short side is width: horizontal strip, full width
        const hh = sum / cw;
        let off = 0;
        row.forEach(it => { const ww = it.area / sum * cw; out.push({ node: it.node, x: cx + off, y: cy, w: ww, h: hh }); off += ww; });
        cy += hh; ch -= hh;
      }
      row = []; sum = 0;
    };
    items.forEach(it => {
      const side = Math.min(cw, ch);
      if (row.length && rowWorst(row.concat([it]), sum + it.area, side) > rowWorst(row, sum, side)) flush();
      row.push(it); sum += it.area;
    });
    flush();
    return out;
  }

  function paintTreemap(ctx, W, H, S) {
    const all = S.data.data;
    const path = S.drill;
    const level = path.length ? path[path.length - 1].children : all;
    const total = level.reduce((s, n) => s + (+n.value || 0), 0) || 1;
    const padTop = 0;
    const rects = squarify(level, 0, padTop, W, H - padTop);
    const shapes = rects.map((r, i) => {
      const hot = S.hover != null && S.hover.index === i;
      ctx.fillStyle = TREE[(path.length ? i + path.length * 3 : i) % TREE.length];
      const g = 2;
      ctx.fillRect(r.x + g / 2, r.y + g / 2, Math.max(0, r.w - g), Math.max(0, r.h - g));
      if (hot) {
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5;
        ctx.strokeRect(r.x + 1.5, r.y + 1.5, r.w - 3, r.h - 3);
        ctx.strokeStyle = 'rgba(36,41,35,.55)'; ctx.lineWidth = 1;
        ctx.strokeRect(r.x + 3, r.y + 3, r.w - 6, r.h - 6);
      }
      const labelable = r.w > 64 && r.h > 34;
      if (labelable) {
        ctx.fillStyle = 'rgba(255,255,255,.95)';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = '600 13px system-ui, sans-serif';
        const name = r.node.name;
        ctx.fillText(name.length > 18 ? name.slice(0, 17) + '…' : name, r.x + r.w / 2, r.y + r.h / 2 - 9, r.w - 10);
        ctx.font = SMALL;
        ctx.fillText(moneyShort(r.node.value), r.x + r.w / 2, r.y + r.h / 2 + 10, r.w - 10);
      }
      const share = r.node.value / total;
      return {
        index: i, x: r.x, y: r.y, w: r.w, h: r.h, node: r.node,
        tip: tip(i, esc(r.node.name), [
          ['Notional volume', moneyFull(r.node.value)],
          ['Share of view', `${(share * 100).toFixed(1)}%`],
          ...(r.node.children ? [['', 'Click to zoom in']] : []),
        ]),
      };
    });
    return { shapes, levelName: path.length ? path[path.length - 1].name : null };
  }

  function hitTreemap(S, geom, x, y) {
    const s = geom.shapes.find(s => x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h);
    return s ? s.tip : null;
  }

  // ---------------------------------------------------------------- tooltip
  function tip(index, title, rows) {
    return { index, title, rows };
  }

  function tipHTML(t) {
    const rows = t.rows
      .filter(([, v]) => v !== '')
      .map(([k, v, c]) => `<div class="tt-row"><span>${c ? `<span class="swatch" style="background:${c}"></span>` : ''}${k}</span><b>${v}</b></div>`)
      .join('');
    const hint = t.rows.some(([, v]) => v === '') ? '<div class="tt-hint">Click to zoom in</div>' : '';
    return `<div class="tt-title">${t.title}</div>${rows}${hint}`;
  }

  function placeTip(el, tipEl, x, y) {
    const figW = el.clientWidth;
    tipEl.style.visibility = 'hidden';
    tipEl.classList.add('show');
    const tw = tipEl.offsetWidth, th = tipEl.offsetHeight;
    tipEl.style.visibility = '';
    let lx = x - tw / 2;
    lx = Math.max(4, Math.min(lx, figW - tw - 4));
    let ly = y - th - 16;
    if (ly < 2) ly = y + 20;
    tipEl.style.left = `${lx}px`;
    tipEl.style.top = `${ly}px`;
  }

  // ---------------------------------------------------------------- figures
  const HEIGHTS = { category: 340, 'category-gap': 360, 'gap-over-time': 320 };
  const HIT = { volume: hitBars, sample: hitBars, 'category-gap': hitBars, 'maker-price': hitLines, 'yes-no': hitLines, 'gap-over-time': hitLines, calibration: hitLines, category: hitTreemap };
  const PAINT = { volume: paintBars, sample: paintBars, 'category-gap': paintBars, 'maker-price': paintLines, 'yes-no': paintLines, 'gap-over-time': paintLines, calibration: paintLines, category: paintTreemap };

  function render(el) {
    const S = el._becker;
    const H = HEIGHTS[S.kind] || 300;
    const canvas = el.querySelector('canvas');
    const { ctx, width: W, height: Ht } = setupCanvas(canvas, H);
    S.geom = PAINT[S.kind](ctx, W, Ht, S);
    S.geom.plot && framePlot(ctx, S.geom.plot.left, S.geom.plot.top, S.geom.plot.plotW, S.geom.plot.plotH);
    S.px = { W, H: Ht, offX: canvas.offsetLeft, offY: canvas.offsetTop };
  }

  function setHover(el, t, cx, cy) {
    const S = el._becker;
    const tipEl = el.querySelector('.becker-tip');
    const idx = t ? t.index : null;
    if (idx !== S.hoverIndex) {
      S.hoverIndex = idx;
      S.hover = idx == null ? null : { index: idx };
      render(el);
    }
    if (t && cx != null) {
      tipEl.innerHTML = tipHTML(t);
      placeTip(el, tipEl, S.px.offX + cx, S.px.offY + cy);
    } else {
      tipEl.classList.remove('show');
    }
    const canvas = el.querySelector('canvas');
    canvas.style.cursor = S.kind === 'category' && t && hasKids(S, t.index) ? 'pointer' : 'default';
  }

  function hasKids(S, i) {
    const g = S.geom;
    return !!(g && g.shapes[i] && g.shapes[i].node && g.shapes[i].node.children);
  }

  function toLocal(el, e) {
    const r = el.querySelector('canvas').getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function handleMove(el, e) {
    const S = el._becker;
    if (!S.geom) return;
    const { x, y } = toLocal(el, e);
    const t = HIT[S.kind](S, S.geom, x, y);
    setHover(el, t, x, y);
  }

  function updateCrumb(el) {
    const S = el._becker;
    const b = el.querySelector('.becker-crumb');
    if (!b) return;
    if (!S.drill.length) { b.hidden = true; return; }
    b.hidden = false;
    b.textContent = `← ${S.drill.length > 1 ? S.drill[S.drill.length - 2].name : 'All categories'}`;
  }

  function addTable(el, data, kind) {
    const keys = kind === 'volume' ? ['quarter', 'volume']
      : kind === 'sample' ? ['price', 'trades']
      : kind === 'category' ? ['name', 'value']
      : kind === 'category-gap' ? ['category', 'Taker Return', 'Maker Return', 'Gap', 'N trades']
      : kind === 'gap-over-time' ? ['quarter', 'Taker Return', 'Maker Return']
      : kind === 'calibration' ? ['price', 'actual', 'implied']
      : kind === 'maker-price' ? ['price', 'Taker', 'Maker (counterparty)']
      : ['price', 'yes_return', 'no_return'];
    const table = document.createElement('table');
    const head = table.createTHead().insertRow();
    keys.forEach(k => {
      const th = document.createElement('th');
      th.textContent = k === 'price' ? (kind === 'sample' ? 'Price bucket' : 'Price (¢)')
        : k === 'value' ? 'Notional volume' : k === 'trades' ? 'Trades' : k;
      head.append(th);
    });
    const body = table.createTBody();
    const fmtCell = (k, row) => {
      if (k === 'volume' || k === 'value') return moneyFull(row[k]);
      if (k === 'trades' || k === 'N trades') return intFull(row[k]);
      if (typeof row[k] === 'number') return pct(row[k]);
      return row[k];
    };
    (kind === 'category' ? data.data : data.data).forEach(row => {
      const tr = body.insertRow();
      keys.forEach(k => { const td = tr.insertCell(); td.textContent = fmtCell(k, row); });
    });
    el.querySelector('.becker-chart-table').append(table);
  }

  function init(el) {
    const kind = el.dataset.beckerChart;
    const S = el._becker = {
      kind, data: null, geom: null, hover: null, hoverIndex: undefined,
      drill: [], view: null, px: { W: 0, H: 0, offX: 0, offY: 0 }, lastHit: null,
    };
    if (kind === 'category') {
      const crumb = document.createElement('button');
      crumb.type = 'button';
      crumb.className = 'becker-crumb';
      crumb.hidden = true;
      crumb.addEventListener('click', () => { S.drill.pop(); S.hover = null; S.hoverIndex = undefined; updateCrumb(el); render(el); });
      el.insertBefore(crumb, el.querySelector('canvas'));
    }
    const tipEl = document.createElement('div');
    tipEl.className = 'becker-tip';
    tipEl.setAttribute('aria-hidden', 'true');
    el.append(tipEl);

    fetch(el.dataset.chartData).then(r => r.json()).then(data => {
      S.data = data;
      if (kind === 'category-gap') S.view = data.data;
      render(el);
      addTable(el, data, kind);
    }).catch(() => {
      el.querySelector('canvas').insertAdjacentText('afterend', 'Chart data could not be loaded.');
    });

    let raf = 0, lastEvt = null;
    el.querySelector('canvas').addEventListener('pointermove', e => {
      lastEvt = e;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (!S.data || !S.geom) return;
        const { x, y } = toLocal(el, lastEvt);
        const t = HIT[kind](S, S.geom, x, y);
        S.lastHit = t ? { kind, title: t.title.replace(/<[^>]*>/g, ''), rows: t.rows } : null;
        setHover(el, t, x, y);
      });
    });
    el.querySelector('canvas').addEventListener('pointerleave', () => {
      S.hover = null; S.hoverIndex = undefined; S.lastHit = null;
      if (S.data && S.geom) render(el);
      el.querySelector('.becker-tip').classList.remove('show');
    });
    if (kind === 'category') {
      el.querySelector('canvas').addEventListener('click', e => {
        if (!S.data || !S.geom) return;
        const { x, y } = toLocal(el, e);
        const t = hitTreemap(S, S.geom, x, y);
        if (t && hasKids(S, t.index)) {
          S.drill.push(S.geom.shapes[t.index].node);
          S.hover = null; S.hoverIndex = undefined;
          updateCrumb(el); render(el);
        }
      });
    }
    let rzT = 0;
    new ResizeObserver(() => {
      clearTimeout(rzT);
      rzT = setTimeout(() => { if (S.data) render(el); }, 120);
    }).observe(el);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => document.querySelectorAll('[data-becker-chart]').forEach(init));
  } else {
    document.querySelectorAll('[data-becker-chart]').forEach(init);
  }
})();
