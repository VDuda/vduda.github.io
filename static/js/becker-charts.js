(() => {
  if (window.__beckerChartsLoaded) return;
  window.__beckerChartsLoaded = true;
  const colors = ["#315c45", "#c08b55", "#637b91", "#9b6557"];
  const money = n => n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(0)}M` : `$${(n / 1e3).toFixed(0)}K`;
  const count = n => `${(n / 1e6).toFixed(1)}M`;

  function draw(canvas, kind, data) {
    const width = Math.max(300, canvas.clientWidth);
    const height = kind === "category" ? 320 : kind === "category-gap" ? 350 : 300;
    const scale = window.devicePixelRatio || 1;
    canvas.width = width * scale; canvas.height = height * scale;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d"); ctx.scale(scale, scale);
    ctx.clearRect(0, 0, width, height);
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillStyle = "#647067";
    if (["volume", "sample"].includes(kind)) drawBars(ctx, width, height, data, kind);
    if (kind === "category") drawTreemap(ctx, width, height, data.data);
    if (["maker-price", "yes-no", "gap-over-time", "calibration"].includes(kind)) drawLines(ctx, width, height, data, kind);
    if (kind === "category-gap") drawCategoryGaps(ctx, width, height, data.data);
  }

  const lineCfg={
    "maker-price": { fields:["Taker","Maker (counterparty)"], names:["Taker","Maker"], xLabel:"Contract price (cents)", dash:[[],[]] },
    "yes-no": { fields:["yes_return","no_return"], names:["YES","NO"], xLabel:"Equal purchase cost (cents)", dash:[[],[]] },
    "gap-over-time": { fields:["Taker Return","Maker Return"], names:["Taker","Maker"], xLabel:"Quarter", dash:[[],[]] },
    "calibration": { fields:["actual","implied"], names:["Actual win rate","Implied (price)"], xLabel:"Contract price (cents)", dash:[[],[5,5]] },
  };

  function drawLines(ctx, width, height, data, kind) {
    const cfg=lineCfg[kind];
    const rows=data.data, left=56, right=16, top=20, bottom=kind==="gap-over-time"?78:35, plotW=width-left-right, plotH=height-top-bottom;
    const fields=cfg.fields, names=cfg.names;
    const values=rows.flatMap(r=>fields.map(k=>r[k]));
    const lo=Math.min(0,...values), hi=Math.max(0,...values), pad=(hi-lo)*.08 || 1, min=lo-pad,max=hi+pad;
    const y=v=>top+(max-v)/(max-min)*plotH;
    const x=i=>left+i*plotW/(rows.length-1);
    for(let i=0;i<=4;i++) { const v=min+(max-min)*i/4, yy=y(v); ctx.strokeStyle="#d9ddd7";ctx.beginPath();ctx.moveTo(left,yy);ctx.lineTo(width-right,yy);ctx.stroke();ctx.fillStyle="#647067";ctx.textAlign="right";ctx.fillText(`${v.toFixed(0)}%`,left-7,yy+4); }
    const zero=y(0);ctx.strokeStyle="#6c766e";ctx.beginPath();ctx.moveTo(left,zero);ctx.lineTo(width-right,zero);ctx.stroke();
    fields.forEach((field,series)=>{ctx.strokeStyle=colors[series];ctx.lineWidth=2;ctx.setLineDash(cfg.dash[series]);ctx.beginPath();rows.forEach((r,i)=>{const xx=x(i), yy=y(r[field]);i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)});ctx.stroke();ctx.setLineDash([]);});
    ctx.font="12px system-ui,sans-serif";ctx.textAlign="left";names.forEach((name,i)=>{ctx.fillStyle=colors[i];ctx.fillRect(left+i*150,4,10,10);ctx.fillStyle="#526057";ctx.fillText(name,left+14+i*150,13)});
    if(kind==="gap-over-time") { ctx.fillStyle="#59645d";ctx.font="11px system-ui,sans-serif";ctx.textAlign="right";rows.forEach((r,i)=>{ if(i%2===0||i===rows.length-1){ ctx.save();ctx.translate(x(i),top+plotH+10);ctx.rotate(-Math.PI/4);ctx.fillText(r.quarter,0,0);ctx.restore(); } }); }
    ctx.fillStyle="#526057";ctx.textAlign="center";ctx.font="12px system-ui,sans-serif";ctx.fillText(cfg.xLabel,left+plotW/2,height-5);
  }

  function drawCategoryGaps(ctx,width,height,rows) {
    const left=56,right=8,top=16,bottom=110,plotW=width-left-right,plotH=height-top-bottom,max=Math.max(...rows.map(r=>r.Gap));
    const slot=plotW/rows.length,barW=Math.min(34,slot*.62);
    [0,.25,.5,.75,1].forEach(f=>{const y=top+plotH*(1-f);ctx.strokeStyle="#d9ddd7";ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(width-right,y);ctx.stroke();ctx.fillStyle="#647067";ctx.textAlign="right";ctx.fillText((max*f).toFixed(0),left-6,y+4)});
    rows.forEach((r,i)=>{const h=r.Gap/max*plotH,x=left+i*slot+(slot-barW)/2,y=top+plotH-h;ctx.fillStyle="#527b5d";ctx.fillRect(x,y,barW,h);ctx.fillStyle="#59645d";ctx.font="11px system-ui,sans-serif";ctx.textAlign="right";ctx.save();ctx.translate(x+barW/2,top+plotH+12);ctx.rotate(-Math.PI/4);ctx.fillText(r.category,0,0);ctx.restore();});
    ctx.font="11px system-ui,sans-serif";ctx.fillStyle="#526057";ctx.textAlign="left";ctx.fillText("Maker–taker gap (percentage points)",left,12);
  }

  function drawBars(ctx, width, height, data, kind) {
    const rows = data.data, left = 58, right = 12, top = 18, bottom = 55;
    const plotW = width - left - right, plotH = height - top - bottom;
    const max = Math.max(...rows.map(d => kind === "volume" ? d.volume : d.trades));
    const min = kind === "volume" ? Math.min(...rows.map(d => d.volume)) : 0;
    const ticks = kind === "volume" ? [1e7, 1e8, 1e9, 1e10] : [0, 2.5e6, 5e6, 7.5e6, 1e7];
    ticks.forEach(t => {
      if (t > max || (kind === "volume" && t < min)) return;
      const y = top + plotH - (kind === "volume" ? Math.log10(t / min) / Math.log10(max / min) : t / max) * plotH;
      ctx.strokeStyle = "#d9ddd7"; ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(width - right, y); ctx.stroke();
      ctx.textAlign = "right"; ctx.fillStyle = "#647067"; ctx.fillText(kind === "volume" ? money(t) : count(t), left - 7, y + 4);
    });
    const gap = 3, barW = Math.max(3, (plotW - gap * rows.length) / rows.length);
    rows.forEach((d, i) => {
      const value = kind === "volume" ? d.volume : d.trades;
      const ratio = kind === "volume" ? Math.log10(value / min) / Math.log10(max / min) : value / max;
      const bh = ratio * plotH, x = left + i * (barW + gap), y = top + plotH - bh;
      ctx.fillStyle = "#527b5d"; ctx.fillRect(x, y, barW, bh);
      const every = kind === "volume" ? 4 : 1;
      if (i % every === 0 || i === rows.length - 1) {
        ctx.save(); ctx.translate(x + barW / 2, top + plotH + 13); ctx.rotate(-Math.PI / 4);
        ctx.textAlign = "right"; ctx.fillStyle = "#59645d";
        ctx.fillText(kind === "volume" ? d.quarter : d.price, 0, 0); ctx.restore();
      }
    });
    ctx.textAlign = "center"; ctx.fillStyle = "#526057";
    ctx.fillText(kind === "volume" ? "Quarter · log scale" : "Contract price bucket", left + plotW / 2, height - 3);
  }

  function drawTreemap(ctx, width, height, rows) {
    const gap = 3, total = rows.reduce((s, d) => s + d.value, 0);
    const palette = ["#527b5d", "#c08b55", "#7488a0", "#9b6557", "#8c79a5", "#568f8c", "#b7a65b", "#bc7694", "#8a986d", "#7797b8", "#a6815d"];
    // Alternating horizontal and vertical slices keep each rectangle proportional to its share.
    let x = 0;
    rows.forEach((item, i) => {
      const share = item.value / total;
      const box = { x, y: 0, w: width * share, h: height };
      x += box.w;
      ctx.fillStyle = palette[i % palette.length]; ctx.fillRect(box.x + gap / 2, box.y + gap / 2, Math.max(0, box.w - gap), Math.max(0, box.h - gap));
      if (box.w > 48 && box.h > 30) {
        ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = "600 13px system-ui, sans-serif";
        ctx.fillText(item.name, box.x + box.w / 2, box.y + box.h / 2 - 4, box.w - 8);
        ctx.font = "11px system-ui, sans-serif"; ctx.fillText(money(item.value), box.x + box.w / 2, box.y + box.h / 2 + 13, box.w - 8);
      }
    });
  }

  function addTable(el, data, kind) {
    const rows = kind === "category" ? data.data : data.data;
    const keys = kind === "volume" ? ["quarter", "volume"] : kind === "sample" ? ["price", "trades"] : kind === "category" ? ["name", "value"] : kind === "category-gap" ? ["category", "Gap"] : kind === "gap-over-time" ? ["quarter", "Taker Return", "Maker Return"] : kind === "calibration" ? ["price", "actual", "implied"] : kind === "maker-price" ? ["price", "Taker", "Maker (counterparty)"] : ["price", "yes_return", "no_return"];
    const table = document.createElement("table");
    const head = table.createTHead().insertRow(); keys.forEach(k => { const th = document.createElement("th"); th.textContent = k === "price" ? (kind === "sample" ? "Price bucket" : "Price (¢)") : k === "value" ? "Notional volume" : k; head.append(th); });
    const body = table.createTBody(); rows.forEach(row => { const tr = body.insertRow(); keys.forEach(k => { const td = tr.insertCell(); td.textContent = ["volume","value"].includes(k) ? money(row[k]) : k === "trades" ? row[k].toLocaleString("en-US") : typeof row[k] === "number" ? `${row[k]}%` : row[k]; }); });
    el.querySelector(".becker-chart-table").append(table);
  }

  async function init(el) {
    const kind = el.dataset.beckerChart;
    const data = await fetch(el.dataset.chartData).then(r => r.json());
    const canvas = el.querySelector("canvas");
    const render = () => draw(canvas, kind, data);
    render(); new ResizeObserver(render).observe(canvas.parentElement);
    addTable(el, data, kind);
  }
  document.querySelectorAll("[data-becker-chart]").forEach(el => init(el).catch(() => { el.querySelector("canvas").insertAdjacentText("afterend", "Chart data could not be loaded."); }));
})();
