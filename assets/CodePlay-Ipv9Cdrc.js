import{A as e,Bt as t,C as n,D as r,J as i,Qt as a,Ut as o,en as s,kt as c,p as l,rn as u,w as d,y as ee,yt as te}from"./GravityIcons-DfoK1mUV.js";import{C as f,S as ne,_ as re,b as ie}from"./index-o7TGO-aX.js";var p=u(s(),1);function m(e,t,n){return`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 12px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      background: #0f111a;
      min-height: 100%;
      overflow-x: hidden;
    }
    @media (max-width: 480px) {
      body { padding: 8px; }
      .card { max-width: 100% !important; padding: 20px 14px !important; }
      .btn-group { flex-wrap: wrap !important; gap: 6px !important; }
      button { padding: 8px 12px !important; font-size: 11px !important; }
    }
    ${t}
  </style>
</head>
<body>
  ${e}
  <script>
    (function() {
      const send = (type, args) => {
        try {
          window.parent.postMessage({
            type: 'CODEPLAY_CONSOLE',
            logType: type,
            args: args.map(a => {
              if (typeof a === 'object') {
                try { return JSON.stringify(a, null, 2); } catch { return String(a); }
              }
              return String(a);
            })
          }, '*');
        } catch (_) {}
      };

      const _log = console.log;
      const _warn = console.warn;
      const _error = console.error;

      console.log = function(...args) { _log.apply(console, args); send('log', args); };
      console.warn = function(...args) { _warn.apply(console, args); send('warn', args); };
      console.error = function(...args) { _error.apply(console, args); send('error', args); };

      window.onerror = function(msg, url, line) {
        send('error', ['[Runtime Error] ' + msg + ' (Line ' + line + ')']);
      };
    })();

    try {
      ${n}
    } catch (err) {
      console.error(err.message || String(err));
    }
  <\/script>
</body>
</html>`}function h(e){let t=e;return t=t.replace(/export\s+interface\s+\w+[\s\S]*?\{[\s\S]*?\}/g,``),t=t.replace(/interface\s+\w+[\s\S]*?\{[\s\S]*?\}/g,``),t=t.replace(/export\s+type\s+\w+[\s\S]*?;/g,``),t=t.replace(/type\s+\w+[\s\S]*?;/g,``),t=t.replace(/\s+as\s+[A-Za-z0-9_<>[\]]+/g,``),t=t.replace(/:\s*([A-Za-z0-9_<>[\]]+|\{[^}]*\})\s*(=|;|,|\))/g,`$2`),t=t.replace(/\):\s*[A-Za-z0-9_<>[\]]+\s*\{/g,`) {`),t}async function ae(e,t=!1){let n=[],r=()=>new Date().toLocaleTimeString([],{hour12:!1}),i={log:(...e)=>{n.push({type:`log`,args:e.map(e=>typeof e==`object`?JSON.stringify(e,null,2):String(e)),time:r()})},warn:(...e)=>{n.push({type:`warn`,args:e.map(e=>typeof e==`object`?JSON.stringify(e,null,2):String(e)),time:r()})},error:(...e)=>{n.push({type:`error`,args:e.map(e=>typeof e==`object`?JSON.stringify(e,null,2):String(e)),time:r()})},info:(...e)=>{n.push({type:`info`,args:e.map(e=>typeof e==`object`?JSON.stringify(e,null,2):String(e)),time:r()})}},a=t?h(e):e,o=performance.now(),s;try{let e=Function(`console`,`"use strict";\n${a}`)(i);e instanceof Promise&&await e}catch(e){s=e.message||String(e),i.error(`Runtime Error: ${s}`)}return{logs:n,durationMs:Math.round((performance.now()-o)*100)/100,error:s}}var g=null,_=null;async function v(){return g||(window.loadPyodide?(g=await window.loadPyodide(),g):(_||=new Promise((e,t)=>{let n=document.createElement(`script`);n.src=`https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js`,n.onload=async()=>{try{g=await window.loadPyodide(),e(g)}catch(e){t(e)}},n.onerror=()=>t(Error(`Network offline: Using fallback Python interpreter`)),document.head.appendChild(n)}),_))}async function oe(e){let t=[],n=()=>new Date().toLocaleTimeString([],{hour12:!1}),r=performance.now();try{let r=await v();r.setStdout({batched:e=>{t.push({type:`log`,args:[e],time:n()})}}),r.setStderr({batched:e=>{t.push({type:`error`,args:[e],time:n()})}});let i=await r.runPythonAsync(e);i!=null&&typeof i!=`function`&&t.push({type:`info`,args:[`=> ${String(i)}`],time:n()})}catch(i){try{y(e,t,n)}catch(e){return t.push({type:`error`,args:[`[Python Error] ${i.message||e.message||String(i)}`],time:n()}),{logs:t,durationMs:Math.round(performance.now()-r),error:String(i)}}}return{logs:t,durationMs:Math.round((performance.now()-r)*100)/100}}function y(e,t,n){let r=e.split(`
`),i={};for(let e of r){let r=e.trim();if(!r||r.startsWith(`#`))continue;let a=r.match(/^print\((.*)\)$/);if(a){let e=a[1],r=``;try{let t=e.replace(/True/g,`true`).replace(/False/g,`false`).replace(/None/g,`null`),n=Function(...Object.keys(i),`return (${t})`);r=String(n(...Object.values(i)))}catch{r=e.replace(/^['"]|['"]$/g,``)}t.push({type:`log`,args:[r],time:n()});continue}let o=r.match(/^([a-zA-Z_]\w*)\s*=\s*(.+)$/);if(o){let e=o[1],t=o[2];try{let n=t.replace(/True/g,`true`).replace(/False/g,`false`).replace(/None/g,`null`);i[e]=Function(...Object.keys(i),`return (${n})`)(...Object.values(i))}catch{i[e]=t}}}}function se(e){let t=performance.now(),n=[],r=()=>new Date().toLocaleTimeString([],{hour12:!1}),i={},a=e.split(`;`).map(e=>e.trim()).filter(Boolean),o;try{for(let e of a)if(/^CREATE\s+TABLE/i.test(e)){let t=e.match(/CREATE\s+TABLE\s+([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\)/i);if(t){let e=t[1],a=t[2].split(`,`).map(e=>e.trim().split(/\s+/)[0]);i[e]={cols:a,rows:[]},n.push({type:`info`,args:[`✓ Created table "${e}" with columns [${a.join(`, `)}]`],time:r()})}}else if(/^INSERT\s+INTO/i.test(e)){let t=e.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)(?:\s*\(([\s\S]*?)\))?\s+VALUES\s*\(([\s\S]*?)\)/i);if(t){let e=t[1];if(!i[e])throw Error(`Table "${e}" does not exist`);let a=t[3].split(`,`).map(e=>e.trim().replace(/^['"`]|['"`]$/g,``)),o={};i[e].cols.forEach((e,t)=>{let n=a[t]??``;o[e]=!isNaN(Number(n))&&n!==``?Number(n):n}),i[e].rows.push(o),n.push({type:`log`,args:[`✓ Inserted 1 row into "${e}"`],time:r()})}}else if(/^SELECT/i.test(e)){let t=e.match(/SELECT\s+([\s\S]*?)\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+([\s\S]*?))?(?:\s+ORDER\s+BY\s+([a-zA-Z0-9_]+)(?:\s+(ASC|DESC))?)?(?:\s+LIMIT\s+(\d+))?$/i);if(t){let e=t[1].trim(),a=t[2].trim(),s=t[3]?.trim(),c=t[4]?.trim(),l=(t[5]||`ASC`).toUpperCase(),u=t[6]?parseInt(t[6],10):void 0;if(!i[a])throw Error(`Table "${a}" does not exist`);let d=[...i[a].rows];if(s){let e=s.match(/([a-zA-Z0-9_]+)\s*(=|!=|>|<|>=|<=)\s*(.+)/);if(e){let[,t,n,r]=e,i=r.trim().replace(/^['"`]|['"`]$/g,``),a=Number(i);d=d.filter(e=>{let r=e[t];if(!isNaN(a)&&typeof r==`number`){if(n===`=`)return r===a;if(n===`!=`)return r!==a;if(n===`>`)return r>a;if(n===`<`)return r<a;if(n===`>=`)return r>=a;if(n===`<=`)return r<=a}return n===`=`?String(r)===i:String(r)!==i})}}c&&d.sort((e,t)=>{let n=e[c],r=t[c];return n<r?l===`DESC`?1:-1:n>r?l===`DESC`?-1:1:0}),u&&(d=d.slice(0,u)),o={columns:e===`*`?i[a].cols:e.split(`,`).map(e=>e.trim()),rows:d,message:`Selected ${d.length} rows from "${a}"`,rowCount:d.length},n.push({type:`info`,args:[`✓ Query OK: ${d.length} rows returned`],time:r()})}}}catch(e){return n.push({type:`error`,args:[`[SQL Error] ${e.message||String(e)}`],time:r()}),{logs:n,durationMs:Math.round(performance.now()-t),error:e.message}}let s=Math.round((performance.now()-t)*100)/100;return{result:o,logs:n,durationMs:s}}function ce(e){let t=e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`);t=t.replace(/```([a-z0-9_-]*)\n([\s\S]*?)```/g,(e,t,n)=>`<div class="code-block my-3 rounded-lg overflow-hidden border border-white/10 bg-black/40"><div class="px-3 py-1 bg-white/5 border-b border-white/5 text-[10px] font-mono text-white/50">${t||`code`}</div><pre class="p-3 text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre"><code>${n}</code></pre></div>`),t=t.replace(/`([^`]+)`/g,`<code class="px-1.5 py-0.5 rounded bg-white/10 text-emerald-300 font-mono text-xs">$1</code>`),t=t.replace(/^#### (.*$)/gim,`<h4 class="text-xs font-semibold text-white/90 mt-3 mb-1.5">$1</h4>`),t=t.replace(/^### (.*$)/gim,`<h3 class="text-sm font-semibold text-white mt-4 mb-2">$1</h3>`),t=t.replace(/^## (.*$)/gim,`<h2 class="text-base font-bold text-white mt-4 mb-2 pb-1 border-b border-white/10">$1</h2>`),t=t.replace(/^# (.*$)/gim,`<h1 class="text-lg font-bold text-white mt-5 mb-2.5 pb-1.5 border-b border-white/15">$1</h1>`),t=t.replace(/^> (.*$)/gim,`<blockquote class="border-l-2 border-accent pl-3 my-2 text-white/70 italic text-xs">$1</blockquote>`),t=t.replace(/^---$/gim,`<hr class="border-white/10 my-3" />`),t=t.replace(/\*\*([^*]+)\*\*/g,`<strong class="font-bold text-white">$1</strong>`),t=t.replace(/\*([^*]+)\*/g,`<em class="italic text-white/80">$1</em>`),t=t.replace(/~~([^~]+)~~/g,`<del class="line-through text-white/40">$1</del>`),t=t.replace(/^\s*[-*]\s+(.*$)/gim,`<li class="ml-4 list-disc text-white/80 text-xs my-0.5">$1</li>`),t=t.replace(/^\s*\d+\.\s+(.*$)/gim,`<li class="ml-4 list-decimal text-white/80 text-xs my-0.5">$1</li>`);let n=t.split(`
`),r=[],i=!1,a=[],o=()=>{if(a.length>0){let e=`<div class="overflow-x-auto my-3"><table class="w-full text-xs text-left border-collapse border border-white/10 rounded-lg overflow-hidden">`;a.forEach((t,n)=>{if(/^\|?(\s*:?-+:?\s*\|)+\s*$/.test(t))return;let r=t.split(`|`).slice(1,-1).map(e=>e.trim());r.length!==0&&(n===0?e+=`<thead class="bg-white/5 border-b border-white/10 text-white/90"><tr>`+r.map(e=>`<th class="px-3 py-2 font-medium">${e}</th>`).join(``)+`</tr></thead><tbody>`:e+=`<tr class="border-b border-white/5 hover:bg-white/[0.02]">`+r.map(e=>`<td class="px-3 py-1.5 text-white/70">${e}</td>`).join(``)+`</tr>`)}),e+=`</tbody></table></div>`,r.push(e),a=[]}};for(let e of n)e.trim().startsWith(`|`)&&e.trim().endsWith(`|`)?(i=!0,a.push(e.trim())):(i&&=(o(),!1),e.trim().length>0&&!e.startsWith(`<h`)&&!e.startsWith(`<blockquote`)&&!e.startsWith(`<li`)&&!e.startsWith(`<div`)&&!e.startsWith(`<hr`)&&!e.startsWith(`<table`)?r.push(`<p class="my-1 text-xs text-white/80 leading-relaxed">${e}</p>`):r.push(e));return i&&o(),r.join(`
`)}var b=[{id:`web`,label:`HTML / CSS / JS`,badge:`Web Sandbox`,extension:`.html`},{id:`javascript`,label:`JavaScript`,badge:`ESNext`,extension:`.js`},{id:`typescript`,label:`TypeScript`,badge:`TS Engine`,extension:`.ts`},{id:`python`,label:`Python`,badge:`Python 3`,extension:`.py`},{id:`sql`,label:`SQL`,badge:`In-Memory DB`,extension:`.sql`},{id:`markdown`,label:`Markdown`,badge:`Live Preview`,extension:`.md`}],x=[{id:`web-glass-card`,language:`web`,title:`Interactive Glassmorphic Counter`,category:`Web Components`,description:`An animated frosted glass UI component with live state management and button handlers.`,html:`<div class="card">
  <div class="badge">Portfolio OS Widget</div>
  <h1>Interactive Counter</h1>
  <p>Live HTML, CSS & JavaScript Sandbox</p>
  <div class="counter-display" id="count">0</div>
  <div class="btn-group">
    <button id="decBtn">- Decrement</button>
    <button id="rstBtn">Reset</button>
    <button id="incBtn" class="primary">+ Increment</button>
  </div>
</div>`,css:`body {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: radial-gradient(circle at 50% 20%, #1e2235, #0c0e14);
}
.card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(16px);
  padding: 24px 16px;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  max-width: 340px;
  width: 100%;
}
.badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 4px 10px;
  border-radius: 20px;
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.3);
  margin-bottom: 12px;
}
h1 {
  font-size: 20px;
  margin: 0 0 6px 0;
  color: #fff;
}
p {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 20px 0;
}
.counter-display {
  font-size: 48px;
  font-weight: 700;
  font-family: monospace;
  color: #38bdf8;
  margin: 16px 0;
  transition: transform 0.15s ease;
}
.btn-group {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}
button {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #fff;
  padding: 8px 14px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}
button:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-1px);
}
button.primary {
  background: #38bdf8;
  color: #0c0e14;
  font-weight: 600;
  border-color: #38bdf8;
}
button.primary:hover {
  background: #7dd3fc;
}`,js:`let count = 0;
const display = document.getElementById("count");

function update(diff) {
  count += diff;
  display.innerText = count;
  display.style.transform = "scale(1.15)";
  setTimeout(() => (display.style.transform = "scale(1)"), 150);
  console.log("Counter updated: " + count);
}

document.getElementById("incBtn").onclick = () => update(1);
document.getElementById("decBtn").onclick = () => update(-1);
document.getElementById("rstBtn").onclick = () => {
  count = 0;
  display.innerText = "0";
  console.log("Counter reset to 0");
};

console.log("Interactive Glass Widget ready!");`},{id:`web-particles`,language:`web`,title:`Neon Canvas Particle Network`,category:`Canvas & Graphics`,description:`60 FPS HTML5 Canvas particle network connecting dynamic nodes with interactive mouse tracking.`,html:`<div class="canvas-container">
  <div class="info-tag">Move cursor across the preview window</div>
  <canvas id="matrix"></canvas>
</div>`,css:`body {
  margin: 0;
  overflow: hidden;
  background: #090a0f;
}
.canvas-container {
  position: relative;
  width: 100vw;
  height: 100vh;
}
.info-tag {
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 6px 12px;
  border-radius: 10px;
  font-size: 11px;
  color: #38bdf8;
  font-family: monospace;
  pointer-events: none;
}
canvas {
  display: block;
}`,js:`const canvas = document.getElementById("matrix");
const ctx = canvas.getContext("2d");
let w = (canvas.width = window.innerWidth);
let h = (canvas.height = window.innerHeight);

const particles = Array.from({ length: 45 }, () => ({
  x: Math.random() * w,
  y: Math.random() * h,
  vx: (Math.random() - 0.5) * 1.5,
  vy: (Math.random() - 0.5) * 1.5,
  radius: Math.random() * 2 + 1.5,
}));

let mouse = { x: null, y: null };
window.onmousemove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
window.onresize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };

function animate() {
  ctx.clearRect(0, 0, w, h);

  particles.forEach((p, i) => {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0 || p.x > w) p.vx *= -1;
    if (p.y < 0 || p.y > h) p.vy *= -1;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#38bdf8";
    ctx.fill();

    for (let j = i + 1; j < particles.length; j++) {
      const p2 = particles[j];
      const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
      if (dist < 100) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = "rgba(56, 189, 248, " + (1 - dist / 100) + ")";
        ctx.stroke();
      }
    }

    if (mouse.x) {
      const mDist = Math.hypot(p.x - mouse.x, p.y - mouse.y);
      if (mDist < 120) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = "rgba(168, 85, 247, " + (1 - mDist / 120) + ")";
        ctx.stroke();
      }
    }
  });

  requestAnimationFrame(animate);
}

animate();
console.log("Canvas animation initialized: 45 interactive particles running at 60 FPS.");`},{id:`js-pipeline`,language:`javascript`,title:`Data Pipeline & Aggregation`,category:`Fullstack / MERN`,description:`Transforms orders, aggregates category revenues, and identifies VIP customers.`,code:`const orders = [
  { id: 101, customer: "Alice", category: "Electronics", amount: 450, status: "completed" },
  { id: 102, customer: "Bob", category: "Apparel", amount: 85, status: "completed" },
  { id: 103, customer: "Charlie", category: "Electronics", amount: 1200, status: "completed" },
  { id: 104, customer: "Alice", category: "Books", amount: 45, status: "completed" },
  { id: 105, customer: "Diana", category: "Apparel", amount: 320, status: "pending" },
  { id: 106, customer: "Bob", category: "Electronics", amount: 950, status: "completed" },
];

console.log("Starting Data Pipeline processing...");

const completed = orders.filter(o => o.status === "completed");

const categoryRevenue = completed.reduce((acc, order) => {
  acc[order.category] = (acc[order.category] || 0) + order.amount;
  return acc;
}, {});

const customerTotals = completed.reduce((acc, order) => {
  acc[order.customer] = (acc[order.customer] || 0) + order.amount;
  return acc;
}, {});

const vipCustomers = Object.entries(customerTotals)
  .filter(([_, total]) => total >= 500)
  .sort((a, b) => b[1] - a[1])
  .map(([name, total]) => ({ customer: name, totalSpent: \`$\${total.toLocaleString()}\` }));

console.log("Category Revenue:", categoryRevenue);
console.log("Top VIP Customers:", vipCustomers);
console.log("Total Pipeline Revenue: $" + completed.reduce((sum, o) => sum + o.amount, 0).toLocaleString());`},{id:`js-lru`,language:`javascript`,title:`LRU Cache Implementation`,category:`Data Structures`,description:`Least-Recently-Used (LRU) Cache operating with O(1) get and put operations via Map ordering.`,code:`class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return -1;
    const val = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      console.log("Evicted oldest key: " + oldestKey);
    }
    this.cache.set(key, value);
  }

  dump() {
    return Array.from(this.cache.entries());
  }
}

console.log("Initializing LRU Cache (Capacity = 3)...");
const lru = new LRUCache(3);
lru.put("auth:token_1", { user: "Emman", role: "admin" });
lru.put("auth:token_2", { user: "Sarah", role: "editor" });
lru.put("auth:token_3", { user: "Alex", role: "viewer" });

console.log("Cache entries:", lru.dump().map(([k, v]) => \`\${k} -> \${v.user}\`));
console.log("Accessing auth:token_1:", lru.get("auth:token_1"));
lru.put("auth:token_4", { user: "David", role: "guest" });

console.log("Cache after eviction:", lru.dump().map(([k, v]) => \`\${k} -> \${v.user}\`));`},{id:`ts-repo`,language:`typescript`,title:`Generic Repository & Type Guards`,category:`Typed Systems`,description:`Generic in-memory entity repository with type guards, filtering, and immutable updates.`,code:`interface BaseEntity {
  id: string;
  createdAt: number;
}

interface User extends BaseEntity {
  username: string;
  email: string;
  role: "admin" | "developer" | "viewer";
}

class InMemoryRepository<T extends BaseEntity> {
  private items: Map<string, T> = new Map();

  create(entity: T): T {
    this.items.set(entity.id, entity);
    console.log(\`Created item [\${entity.id}]\`);
    return entity;
  }

  findById(id: string): T | undefined {
    return this.items.get(id);
  }

  filter(predicate: (item: T) => boolean): T[] {
    return Array.from(this.items.values()).filter(predicate);
  }
}

console.log("Testing Typed In-Memory Repository...");
const userRepo = new InMemoryRepository<User>();

userRepo.create({
  id: "u-1",
  username: "emmanmendoza",
  email: "emman@portfolio.os",
  role: "admin",
  createdAt: Date.now()
});

userRepo.create({
  id: "u-2",
  username: "alexriver",
  email: "alex@tech.io",
  role: "developer",
  createdAt: Date.now()
});

const admins = userRepo.filter(u => u.role === "admin");
console.log("Admin Users:", admins);`},{id:`py-fib`,language:`python`,title:`Fibonacci & Memoization`,category:`Algorithms`,description:`Recursive vs Memoized dynamic programming comparison in Python.`,code:`# Fibonacci with Dynamic Programming Memoization
memo = {}

def fib(n):
    if n in memo:
        return memo[n]
    if n <= 1:
        return n
    memo[n] = fib(n - 1) + fib(n - 2)
    return memo[n]

print("Calculating Fibonacci sequence up to n = 15:")
sequence = [fib(i) for i in range(16)]
print(sequence)

print("Fibonacci(40):", fib(40))
print("Memoized cache size:", len(memo))`},{id:`py-words`,language:`python`,title:`Word Frequency Counter`,category:`Data Processing`,description:`Calculates token frequencies, clean word tokens, and top ranked keywords in Python.`,code:`text = """
Antigravity Portfolio OS is a next-generation desktop portfolio system.
It features real-time synchronization, glassmorphism, dynamic widgets,
and interactive developer sandboxes. Build, preview, and code effortlessly.
"""

# Tokenize and clean words
words = [w.strip(".,!?:;").lower() for w in text.split() if w.strip()]
frequency = {}

for w in words:
    frequency[w] = frequency.get(w, 0) + 1

# Sort by occurrence
sorted_words = sorted(frequency.items(), key=lambda item: item[1], reverse=True)

print("Total Word Count:", len(words))
print("Unique Word Count:", len(frequency))
print("Top 5 Keywords:")
for word, count in sorted_words[:5]:
    print(f"  - '{word}': {count} occurrences")`},{id:`sql-analytics`,language:`sql`,title:`E-Commerce Customer Analytics`,category:`Database Queries`,description:`Creates tables, inserts transactional data, and queries high-performing sales records.`,code:`CREATE TABLE customers (id, name, city, spent);
INSERT INTO customers VALUES (1, 'Alice Rivera', 'San Francisco', 1450);
INSERT INTO customers VALUES (2, 'Bob Chen', 'Seattle', 620);
INSERT INTO customers VALUES (3, 'Charlie Ross', 'Austin', 2100);
INSERT INTO customers VALUES (4, 'Diana Prince', 'New York', 480);
INSERT INTO customers VALUES (5, 'Elena Rostov', 'Boston', 1890);

SELECT name, city, spent FROM customers WHERE spent >= 1000 ORDER BY spent DESC;`},{id:`md-guide`,language:`markdown`,title:`Interactive System Specification`,category:`Documentation`,description:`Markdown documentation with headers, badges, tables, and task checklists.`,code:`# Portfolio OS Architecture Specification

Welcome to the **Interactive Code Playground**. This engine renders dynamic documentation, code blocks, and real-time previews.

### System Capabilities
- **Web Sandbox**: Live editing of HTML, CSS, and JS with hot iframe re-rendering.
- **Multi-Language Runtime**: Client-side execution for JavaScript, TypeScript, Python, and SQL.
- **Real-Time Logs**: Console interception capturing standard outputs, warnings, and error stacks.

### Benchmark Overview
| Language | Execution Target | Features |
| :--- | :--- | :--- |
| **HTML/CSS/JS** | Sandboxed DOM Iframe | Live Canvas, Flexbox, Animations |
| **JavaScript** | V8 / JS Engine | ESNext, Async/Await, O(N) Analysis |
| **Python** | WebAssembly Pyodide | NumPy, Data Science, Logic |
| **SQL** | In-Memory Engine | DDL, DML, Table Results |

### Next Steps
- [x] Integrate HTML/CSS/JS live preview
- [x] Multi-language syntax selection
- [x] Real-time tabular SQL viewer
`}],S=a(),le={web:`Web`,javascript:`JS`,typescript:`TS`,python:`Python`,sql:`SQL`,markdown:`MD`};function C(){let{systemSounds:a,notify:s}=ne(),u=ie(),[h,g]=(0,p.useState)(`web`),[_,v]=(0,p.useState)(`web-glass-card`),[y,C]=(0,p.useState)(x[0].html||``),[w,T]=(0,p.useState)(x[0].css||``),[E,D]=(0,p.useState)(x[0].js||``),[O,k]=(0,p.useState)(`html`),[ue,A]=(0,p.useState)(``),[j,de]=(0,p.useState)(!0),[M,N]=(0,p.useState)({web:``,javascript:x.find(e=>e.language===`javascript`)?.code||``,typescript:x.find(e=>e.language===`typescript`)?.code||``,python:x.find(e=>e.language===`python`)?.code||``,sql:x.find(e=>e.language===`sql`)?.code||``,markdown:x.find(e=>e.language===`markdown`)?.code||``}),[P,F]=(0,p.useState)(()=>typeof window<`u`&&window.innerWidth<768?`editor`:`split`),[I,L]=(0,p.useState)(`editor`),[R,fe]=(0,p.useState)(!0),[z,B]=(0,p.useState)(`desktop`),[V,H]=(0,p.useState)([]),[U,W]=(0,p.useState)(null),[G,K]=(0,p.useState)(!1),[pe,q]=(0,p.useState)(null),[me,he]=(0,p.useState)(!1),J=(0,p.useRef)(null),Y=(0,p.useRef)(null),X=(0,p.useRef)(null);(0,p.useEffect)(()=>{let e=m(y,w,E);A(e)},[]),(0,p.useEffect)(()=>{let e=e=>{if(e.data&&e.data.type===`CODEPLAY_CONSOLE`){let{logType:t,args:n}=e.data,r=()=>new Date().toLocaleTimeString([],{hour12:!1});H(e=>[...e,{type:t||`log`,args:Array.isArray(n)?n:[String(n)],time:r()}])}};return window.addEventListener(`message`,e),()=>window.removeEventListener(`message`,e)},[]);let Z=x.filter(e=>e.language===h),Q=x.find(e=>e.id===_)||Z[0],$=(0,p.useCallback)((e,t,n)=>{j&&(X.current&&clearTimeout(X.current),X.current=setTimeout(()=>{A(m(e,t,n))},400))},[j]),ge=e=>{a&&f.playClick(),g(e);let t=x.find(t=>t.language===e);t&&v(t.id),H([]),q(null),W(null),L(`editor`),u?F(`editor`):(e===`web`||e===`markdown`)&&F(`split`)},_e=e=>{if(a&&f.playClick(),v(e.id),L(`editor`),H([]),q(null),W(null),e.language===`web`){let t=e.html||``,n=e.css||``,r=e.js||``;C(t),T(n),D(r),A(m(t,n,r))}else N(t=>({...t,[e.language]:e.code||``}))},ve=()=>{if(a&&f.playClose(),Q){if(h===`web`){let e=Q.html||``,t=Q.css||``,n=Q.js||``;C(e),T(t),D(n),A(m(e,t,n))}else N(e=>({...e,[h]:Q.code||``}));H([]),q(null),W(null)}},ye=()=>h===`web`?O===`html`?y:O===`css`?w:E:M[h]||``,be=e=>{h===`web`?O===`html`?(C(e),$(e,w,E)):O===`css`?(T(e),$(y,e,E)):(D(e),$(y,w,e)):N(t=>({...t,[h]:e}))},xe=()=>{J.current&&Y.current&&(Y.current.scrollTop=J.current.scrollTop)},Se=e=>{if((e.ctrlKey||e.metaKey)&&e.key===`Enter`){e.preventDefault(),Ce();return}if(e.key===`Tab`){e.preventDefault();let t=e.currentTarget,n=t.selectionStart,r=t.selectionEnd,i=ye(),a=i.substring(0,n)+`  `+i.substring(r);be(a),setTimeout(()=>{t.selectionStart=t.selectionEnd=n+2},0)}},Ce=async()=>{if(a&&f.playPop(),K(!0),q(null),h===`web`||h===`markdown`?(L(`preview`),u&&F(`preview`)):(L(`console`),u&&F(`console`)),h===`web`){H([]);let e=m(y,w,E);A(e),K(!1),q(12);return}let e=M[h]||``;if(h===`javascript`||h===`typescript`){let{logs:t,durationMs:n}=await ae(e,h===`typescript`);H(t),q(n),K(!1),fetch(`${re}/api/snippets/run`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({code:e,id:_})}).then(e=>e.ok?e.json():null).then(e=>{if(e?.metrics){let t=new Date().toLocaleTimeString([],{hour12:!1});H(n=>[...n,{type:`info`,args:[`Server Verified · Complexity: ${e.metrics.estimatedComplexity} · ${e.lines} lines`],time:t}])}}).catch(()=>{});return}if(h===`python`){let{logs:t,durationMs:n}=await oe(e);H(t),q(n),K(!1);return}if(h===`sql`){let{result:t,logs:n,durationMs:r}=se(e);H(n),W(t||null),q(r),K(!1);return}h===`markdown`&&(K(!1),q(5))},we=()=>{a&&f.playPop();let e=``;e=h===`web`?`<!-- HTML -->\n${y}\n\n/* CSS */\n${w}\n\n// JavaScript\n${E}`:M[h]||``,navigator.clipboard?.writeText(e),he(!0),setTimeout(()=>he(!1),2e3)},Te=()=>{a&&f.playPop();let e=``,t=`${_||`snippet`}`,n=`text/plain`;if(h===`web`)e=m(y,w,E),t+=`.html`,n=`text/html`;else{e=M[h]||``;let r=b.find(e=>e.id===h)?.extension||`.txt`;t+=r,n=`text/plain`}let r=new Blob([e],{type:`${n};charset=utf-8`}),i=URL.createObjectURL(r),o=document.createElement(`a`);o.href=i,o.download=t,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(i),s(`Exported`,`Saved ${t} to downloads.`)},Ee=ye(),De=Ee.split(`
`);return(0,S.jsxs)(`div`,{className:`flex flex-col h-full bg-[#0a0a0f] text-white select-none w-full max-w-full overflow-hidden`,children:[(0,S.jsxs)(`div`,{className:`px-2.5 sm:px-3.5 py-2 border-b border-white/10 flex items-center justify-between gap-1.5 sm:gap-2 bg-[#0a0a0f]/95 backdrop-blur-md shrink-0 sticky top-0 z-20 shadow-sm w-full max-w-full overflow-hidden`,children:[(0,S.jsxs)(`div`,{className:`flex items-center gap-2 min-w-0 flex-1`,children:[(0,S.jsx)(`div`,{className:`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent shrink-0`,children:(0,S.jsx)(n,{size:15})}),(0,S.jsxs)(`div`,{className:`min-w-0 max-w-[120px] xs:max-w-[170px] sm:max-w-xs md:max-w-none`,children:[(0,S.jsxs)(`div`,{className:`flex items-center gap-1.5`,children:[(0,S.jsx)(`h2`,{className:`text-xs font-semibold text-white truncate`,children:Q?.title||`Code Playground`}),(0,S.jsx)(`span`,{className:`hidden xs:inline-block text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-white/70 font-mono shrink-0`,children:b.find(e=>e.id===h)?.badge})]}),(0,S.jsx)(`p`,{className:`text-[10px] text-white/45 truncate hidden md:block`,children:Q?.description})]})]}),(0,S.jsxs)(`div`,{className:`flex items-center gap-1 shrink-0`,children:[(0,S.jsxs)(`div`,{className:`hidden md:flex items-center bg-black/40 border border-white/10 rounded-lg p-0.5 mr-1`,children:[(0,S.jsxs)(`button`,{onClick:()=>F(`split`),className:`px-2 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1 ${P===`split`?`bg-white/15 text-white`:`text-white/50 hover:text-white`}`,title:`Split Editor & Output`,children:[(0,S.jsx)(i,{size:12}),(0,S.jsx)(`span`,{children:`Split`})]}),(h===`web`||h===`markdown`)&&(0,S.jsxs)(`button`,{onClick:()=>F(`preview`),className:`px-2 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1 ${P===`preview`?`bg-white/15 text-white`:`text-white/50 hover:text-white`}`,title:`Preview Only`,children:[(0,S.jsx)(e,{size:12}),(0,S.jsx)(`span`,{children:`Preview`})]}),(0,S.jsxs)(`button`,{onClick:()=>F(`console`),className:`px-2 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1 ${P===`console`?`bg-white/15 text-white`:`text-white/50 hover:text-white`}`,title:`Console Logs`,children:[(0,S.jsx)(t,{size:12}),(0,S.jsx)(`span`,{children:`Console`})]})]}),(0,S.jsx)(`button`,{onClick:ve,className:`p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition`,title:`Reset to Template`,children:(0,S.jsx)(c,{size:13})}),(0,S.jsxs)(`button`,{onClick:we,className:`flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/80 transition`,title:`Copy Code`,children:[me?(0,S.jsx)(l,{size:13,className:`text-emerald-400`}):(0,S.jsx)(d,{size:13}),(0,S.jsx)(`span`,{className:`hidden sm:inline`,children:me?`Copied`:`Copy`})]}),(0,S.jsx)(`button`,{onClick:Te,className:`p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition`,title:`Export / Download File`,children:(0,S.jsx)(r,{size:13})}),(0,S.jsxs)(`button`,{onClick:Ce,disabled:G,className:`flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-lg sm:rounded-xl bg-accent hover:brightness-110 active:scale-95 text-xs font-semibold text-white shadow-md shadow-accent/25 transition ml-0.5`,title:`Execute Code (⌘+Enter)`,children:[(0,S.jsx)(te,{size:13}),(0,S.jsx)(`span`,{className:`inline sm:hidden`,children:G?`...`:`Run`}),(0,S.jsx)(`span`,{className:`hidden sm:inline`,children:G?`Running...`:`Run (⌘Enter)`})]})]})]}),(0,S.jsxs)(`div`,{className:`px-2.5 sm:px-3 py-1.5 bg-black/50 border-b border-white/5 flex items-center justify-between gap-2 overflow-x-auto thin-scroll`,children:[(0,S.jsxs)(`div`,{className:`flex items-center gap-1 shrink-0`,children:[(0,S.jsx)(`span`,{className:`text-[10px] uppercase font-mono text-white/40 mr-1 hidden xs:inline`,children:`Lang:`}),b.map(e=>(0,S.jsxs)(`button`,{onClick:()=>ge(e.id),className:`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] font-medium transition shrink-0 ${h===e.id?`bg-accent text-white shadow-sm font-semibold`:`bg-white/5 text-white/60 hover:text-white hover:bg-white/10`}`,children:[(0,S.jsx)(`span`,{className:`sm:hidden`,children:le[e.id]}),(0,S.jsx)(`span`,{className:`hidden sm:inline`,children:e.label})]},e.id))]}),h===`web`&&(0,S.jsxs)(`label`,{className:`flex items-center gap-1.5 text-[10px] sm:text-[11px] text-white/50 cursor-pointer select-none shrink-0 hover:text-white/80 ml-auto`,children:[(0,S.jsx)(`input`,{type:`checkbox`,checked:j,onChange:e=>de(e.target.checked),className:`accent-accent rounded w-3.5 h-3.5`}),(0,S.jsx)(`span`,{className:`hidden xs:inline`,children:`Live Auto-Update`}),(0,S.jsx)(`span`,{className:`xs:hidden`,children:`Live`})]})]}),Z.length>0&&(0,S.jsxs)(`div`,{className:`hidden md:flex px-3 py-1.5 bg-black/25 border-b border-white/5 items-center gap-1.5 overflow-x-auto thin-scroll`,children:[(0,S.jsxs)(`span`,{className:`text-[10px] uppercase font-mono text-white/40 mr-1 shrink-0 flex items-center gap-1`,children:[(0,S.jsx)(n,{size:11,className:`text-accent`}),`Templates:`]}),Z.map(e=>(0,S.jsx)(`button`,{onClick:()=>_e(e),className:`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition shrink-0 ${_===e.id?`bg-white/15 text-white border border-white/15`:`bg-white/5 text-white/50 hover:text-white hover:bg-white/10`}`,children:e.title},e.id))]}),(0,S.jsxs)(`div`,{className:`md:hidden px-2.5 py-1.5 bg-black/30 border-b border-white/10 flex items-center justify-between gap-2`,children:[Z.length>0&&(0,S.jsxs)(`div`,{className:`relative flex-1 min-w-0 max-w-[190px]`,children:[(0,S.jsx)(`select`,{value:_,onChange:e=>{let t=Z.find(t=>t.id===e.target.value);t&&_e(t)},className:`w-full bg-[#141622] text-white text-[11px] font-medium rounded-lg px-2.5 py-1 border border-white/10 truncate focus:outline-none focus:border-accent appearance-none pr-6 cursor-pointer`,children:Z.map(e=>(0,S.jsx)(`option`,{value:e.id,className:`bg-[#12131a] text-white`,children:e.title},e.id))}),(0,S.jsx)(`div`,{className:`pointer-events-none absolute inset-y-0 right-2 flex items-center text-white/40 text-[9px]`,children:`▼`})]}),(0,S.jsxs)(`div`,{className:`flex items-center bg-black/60 border border-white/10 rounded-lg p-0.5 shrink-0`,children:[(0,S.jsxs)(`button`,{type:`button`,onClick:()=>{L(`editor`),F(`editor`)},className:`px-2.5 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1 ${I===`editor`?`bg-accent text-white shadow-sm font-semibold`:`text-white/60 hover:text-white`}`,children:[(0,S.jsx)(n,{size:12}),(0,S.jsx)(`span`,{children:`Code`})]}),(h===`web`||h===`markdown`)&&(0,S.jsxs)(`button`,{type:`button`,onClick:()=>{L(`preview`),F(`preview`)},className:`px-2 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1 shrink-0 ${I===`preview`?`bg-accent text-white shadow-sm font-semibold`:`text-white/60 hover:text-white`}`,title:`Preview`,children:[(0,S.jsx)(e,{size:13}),(0,S.jsx)(`span`,{className:`hidden xs:inline`,children:`Preview`})]}),h!==`markdown`&&(0,S.jsxs)(`button`,{type:`button`,onClick:()=>{L(`console`),F(`console`)},className:`px-2 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1 shrink-0 ${I===`console`?`bg-accent text-white shadow-sm font-semibold`:`text-white/60 hover:text-white`}`,children:[(0,S.jsx)(t,{size:12}),(0,S.jsx)(`span`,{className:`hidden xs:inline`,children:h===`sql`?`Table`:`Console`}),(0,S.jsx)(`span`,{className:`xs:hidden`,children:h===`sql`?`SQL`:`Logs`})]})]})]}),h===`web`&&(I===`editor`||P!==`preview`)&&(0,S.jsxs)(`div`,{className:`px-2.5 sm:px-3 py-1 bg-[#0b0c12] border-b border-white/10 flex items-center justify-between text-xs font-mono w-full max-w-full overflow-hidden shrink-0 ${I===`editor`?`flex`:`hidden md:flex`}`,children:[(0,S.jsxs)(`div`,{className:`flex items-center gap-1 sm:gap-2 shrink-0`,children:[(0,S.jsxs)(`button`,{type:`button`,onClick:()=>k(`html`),className:`px-2 sm:px-3 py-1 rounded-t-lg transition flex items-center gap-1.5 ${O===`html`?`bg-[#0d0e15] text-amber-300 font-semibold border-b-2 border-amber-400`:`text-white/50 hover:text-white hover:bg-white/5`}`,children:[(0,S.jsx)(`span`,{className:`w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0`}),(0,S.jsx)(`span`,{className:`xs:hidden`,children:`html`}),(0,S.jsx)(`span`,{className:`hidden xs:inline`,children:`index.html`})]}),(0,S.jsxs)(`button`,{type:`button`,onClick:()=>k(`css`),className:`px-2 sm:px-3 py-1 rounded-t-lg transition flex items-center gap-1.5 ${O===`css`?`bg-[#0d0e15] text-sky-300 font-semibold border-b-2 border-sky-400`:`text-white/50 hover:text-white hover:bg-white/5`}`,children:[(0,S.jsx)(`span`,{className:`w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0`}),(0,S.jsx)(`span`,{className:`xs:hidden`,children:`css`}),(0,S.jsx)(`span`,{className:`hidden xs:inline`,children:`style.css`})]}),(0,S.jsxs)(`button`,{type:`button`,onClick:()=>k(`js`),className:`px-2 sm:px-3 py-1 rounded-t-lg transition flex items-center gap-1.5 ${O===`js`?`bg-[#0d0e15] text-yellow-300 font-semibold border-b-2 border-yellow-400`:`text-white/50 hover:text-white hover:bg-white/5`}`,children:[(0,S.jsx)(`span`,{className:`w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0`}),(0,S.jsx)(`span`,{className:`xs:hidden`,children:`js`}),(0,S.jsx)(`span`,{className:`hidden xs:inline`,children:`script.js`})]})]}),(0,S.jsx)(`button`,{type:`button`,onClick:()=>{L(`preview`),F(`preview`)},className:`md:hidden p-1.5 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent transition flex items-center justify-center shrink-0 cursor-pointer active:scale-95 shadow-sm border border-accent/30`,title:`Open Live Preview`,"aria-label":`Open Live Preview`,children:(0,S.jsx)(e,{size:14})})]}),(0,S.jsxs)(`div`,{className:`flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden w-full max-w-full`,children:[(0,S.jsxs)(`div`,{className:`flex-1 flex-col min-w-0 border-b md:border-b-0 md:border-r border-white/10 bg-[#0d0e15] w-full max-w-full overflow-hidden ${I===`editor`?`flex`:`hidden md:flex`} ${P===`preview`?`md:hidden`:``}`,children:[(0,S.jsxs)(`div`,{className:`flex-1 relative flex overflow-hidden min-h-0 w-full max-w-full`,children:[(0,S.jsx)(`div`,{ref:Y,className:`w-8 sm:w-12 py-2.5 sm:py-3 bg-black/35 border-r border-white/5 text-right pr-1.5 sm:pr-2 text-white/25 font-mono text-[11px] sm:text-xs select-none overflow-hidden leading-relaxed shrink-0 ${R?`hidden sm:block`:`block`}`,children:De.map((e,t)=>(0,S.jsx)(`div`,{children:t+1},t))}),(0,S.jsx)(`textarea`,{ref:J,value:Ee,onChange:e=>be(e.target.value),onScroll:xe,onKeyDown:Se,spellCheck:`false`,autoComplete:`off`,autoCapitalize:`off`,placeholder:h===`web`?`Enter ${O.toUpperCase()} code here...`:`Write your ${h} code here...`,className:`flex-1 h-full p-2.5 sm:p-3 bg-transparent text-emerald-300 font-mono text-xs leading-relaxed outline-none resize-none thin-scroll allow-select w-full max-w-full ${R?`whitespace-pre-wrap break-words overflow-x-hidden`:`whitespace-pre overflow-x-auto`}`})]}),(0,S.jsxs)(`div`,{className:`px-2.5 sm:px-3 py-1 bg-black/30 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40 font-mono shrink-0 w-full max-w-full overflow-hidden`,children:[(0,S.jsxs)(`div`,{className:`flex items-center gap-1.5 sm:gap-2 truncate min-w-0`,children:[(0,S.jsxs)(`span`,{className:`truncate`,children:[De.length,` lines · `,Ee.length,` chars`]}),(0,S.jsx)(`span`,{children:`·`}),(0,S.jsx)(`span`,{className:`text-white/60 truncate`,children:h===`web`?`web / ${O}`:b.find(e=>e.id===h)?.label})]}),(0,S.jsxs)(`div`,{className:`flex items-center gap-1.5 sm:gap-2 shrink-0`,children:[(0,S.jsxs)(`button`,{type:`button`,onClick:()=>fe(!R),className:`px-1.5 py-0.5 rounded text-[10px] font-mono transition flex items-center gap-1 cursor-pointer ${R?`bg-accent/20 text-accent border border-accent/30 font-semibold`:`bg-white/5 text-white/40 hover:text-white`}`,title:`Toggle Word Wrap (Wrap lines without sliding)`,children:[(0,S.jsx)(`span`,{children:`Wrap`}),(0,S.jsx)(`span`,{className:`text-[9px]`,children:R?`ON`:`OFF`})]}),(0,S.jsx)(`span`,{className:`hidden sm:inline text-white/30`,children:`⌘ + Enter to execute`}),(0,S.jsxs)(`button`,{type:`button`,onClick:()=>{let e=h===`web`||h===`markdown`?`preview`:`console`;L(e),F(e)},className:`md:hidden text-accent text-[10px] font-sans hover:underline flex items-center gap-1 ml-0.5 cursor-pointer py-0.5 px-1.5 rounded bg-accent/10 shrink-0`,title:`View Output`,children:[(0,S.jsx)(e,{size:11}),(0,S.jsx)(`span`,{children:`Output`})]})]})]})]}),(0,S.jsxs)(`div`,{className:`flex-col bg-black/40 min-h-0 relative overflow-hidden ${I===`editor`?`hidden md:flex`:`flex flex-1 w-full`} ${P===`preview`?`md:flex-1 md:w-full`:`md:w-1/2 lg:w-7/12`}`,children:[(0,S.jsxs)(`div`,{className:`px-3 py-2 border-b border-white/10 flex items-center justify-between bg-black/30 shrink-0`,children:[(0,S.jsxs)(`div`,{className:`flex items-center gap-2 text-xs text-white/80`,children:[(0,S.jsxs)(`button`,{type:`button`,onClick:()=>{L(`editor`),F(`editor`)},className:`md:hidden flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-xs text-white font-medium mr-1 transition active:scale-95 cursor-pointer`,children:[(0,S.jsx)(`span`,{children:`‹`}),(0,S.jsx)(`span`,{children:`Code`})]}),h===`web`&&(I===`preview`||P!==`console`)?(0,S.jsxs)(S.Fragment,{children:[(0,S.jsx)(e,{size:14,className:`text-accent`}),(0,S.jsx)(`span`,{className:`font-semibold text-xs`,children:`Live Sandbox Preview`})]}):h===`markdown`?(0,S.jsxs)(S.Fragment,{children:[(0,S.jsx)(e,{size:14,className:`text-accent`}),(0,S.jsx)(`span`,{className:`font-semibold text-xs`,children:`Markdown Rendered View`})]}):h===`sql`?(0,S.jsxs)(S.Fragment,{children:[(0,S.jsx)(t,{size:14,className:`text-accent`}),(0,S.jsx)(`span`,{className:`font-semibold text-xs`,children:`SQL Result & Logs`})]}):(0,S.jsxs)(S.Fragment,{children:[(0,S.jsx)(t,{size:14,className:`text-accent`}),(0,S.jsx)(`span`,{className:`font-semibold text-xs`,children:`Output Terminal`})]}),pe!==null&&(0,S.jsxs)(`span`,{className:`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent font-mono`,children:[(0,S.jsx)(ee,{size:10}),(0,S.jsxs)(`span`,{children:[pe,` ms`]})]})]}),(0,S.jsxs)(`div`,{className:`flex items-center gap-2`,children:[h===`web`&&(I===`preview`||P!==`console`)&&(0,S.jsxs)(`div`,{className:`hidden sm:flex items-center bg-black/50 border border-white/10 rounded-md p-0.5 text-[10px] font-mono`,children:[(0,S.jsx)(`button`,{type:`button`,onClick:()=>B(`desktop`),className:`px-1.5 py-0.5 rounded ${z===`desktop`?`bg-white/20 text-white`:`text-white/40 hover:text-white`}`,children:`100%`}),(0,S.jsx)(`button`,{type:`button`,onClick:()=>B(`tablet`),className:`px-1.5 py-0.5 rounded ${z===`tablet`?`bg-white/20 text-white`:`text-white/40 hover:text-white`}`,children:`768px`}),(0,S.jsx)(`button`,{type:`button`,onClick:()=>B(`mobile`),className:`px-1.5 py-0.5 rounded ${z===`mobile`?`bg-white/20 text-white`:`text-white/40 hover:text-white`}`,children:`375px`})]}),V.length>0&&(0,S.jsx)(`button`,{type:`button`,onClick:()=>H([]),className:`text-white/40 hover:text-rose-400 p-1 rounded transition cursor-pointer`,title:`Clear Console Output`,children:(0,S.jsx)(o,{size:12})})]})]}),(0,S.jsxs)(`div`,{className:`flex-1 flex flex-col min-h-0 overflow-hidden relative`,children:[h===`web`&&(I===`preview`||P!==`console`)&&(0,S.jsx)(`div`,{className:`flex-1 flex flex-col items-center justify-center bg-[#090a10] p-0 sm:p-2 overflow-hidden min-h-0 w-full h-full`,children:(0,S.jsxs)(`div`,{className:`h-full w-full transition-all duration-300 sm:rounded-lg overflow-hidden sm:border sm:border-white/10 sm:shadow-2xl bg-[#0f111a] flex flex-col min-h-0 ${z===`desktop`?`w-full`:z===`tablet`?`sm:max-w-[768px] w-full`:`sm:max-w-[375px] w-full`}`,children:[z!==`desktop`&&(0,S.jsxs)(`div`,{className:`hidden sm:flex px-3 py-1.5 bg-black/60 border-b border-white/10 items-center justify-between text-[10px] font-mono text-white/40 shrink-0`,children:[(0,S.jsxs)(`div`,{className:`flex items-center gap-1.5`,children:[(0,S.jsx)(`span`,{className:`w-2 h-2 rounded-full bg-rose-500/80`}),(0,S.jsx)(`span`,{className:`w-2 h-2 rounded-full bg-amber-500/80`}),(0,S.jsx)(`span`,{className:`w-2 h-2 rounded-full bg-emerald-500/80`})]}),(0,S.jsx)(`span`,{children:z===`tablet`?`Tablet View (768px)`:`Mobile View (375px)`}),(0,S.jsx)(`span`,{children:`100%`})]}),(0,S.jsx)(`iframe`,{title:`CodePlay Web Preview`,sandbox:`allow-scripts allow-modals`,srcDoc:ue,className:`w-full h-full flex-1 border-none bg-[#0f111a] block min-h-0`})]})}),h===`markdown`&&(0,S.jsx)(`div`,{className:`flex-1 p-4 sm:p-6 overflow-y-auto thin-scroll text-white/90 font-sans leading-relaxed select-text`,dangerouslySetInnerHTML:{__html:ce(M.markdown||``)}}),h===`sql`&&(0,S.jsxs)(`div`,{className:`flex-1 flex flex-col min-h-0 overflow-y-auto thin-scroll p-3 space-y-3`,children:[U?(0,S.jsxs)(`div`,{className:`space-y-2`,children:[(0,S.jsxs)(`div`,{className:`flex items-center justify-between text-xs text-white/60`,children:[(0,S.jsx)(`span`,{className:`font-semibold text-emerald-400`,children:U.message}),(0,S.jsxs)(`span`,{className:`font-mono text-[10px]`,children:[U.rowCount,` `,U.rowCount===1?`row`:`rows`]})]}),(0,S.jsx)(`div`,{className:`overflow-x-auto rounded-lg border border-white/10 bg-black/40 shadow-inner`,children:(0,S.jsxs)(`table`,{className:`w-full text-xs text-left border-collapse`,children:[(0,S.jsx)(`thead`,{className:`bg-white/5 border-b border-white/10 text-white/80 font-mono`,children:(0,S.jsx)(`tr`,{children:U.columns.map((e,t)=>(0,S.jsx)(`th`,{className:`px-3 py-2 font-semibold`,children:e},t))})}),(0,S.jsx)(`tbody`,{className:`divide-y divide-white/5 font-mono text-[11px]`,children:U.rows.map((e,t)=>(0,S.jsx)(`tr`,{className:`hover:bg-white/[0.03] transition`,children:U.columns.map((t,n)=>(0,S.jsx)(`td`,{className:`px-3 py-1.5 text-white/70`,children:e[t]!==void 0&&e[t]!==null?String(e[t]):`NULL`},n))},t))})]})})]}):(0,S.jsx)(`div`,{className:`text-center py-6 text-white/30 text-xs`,children:`Run your SQL statements above to view the tabular result grid.`}),V.length>0&&(0,S.jsxs)(`div`,{className:`pt-2 border-t border-white/10 space-y-1 font-mono text-xs`,children:[(0,S.jsx)(`div`,{className:`text-[10px] text-white/40 uppercase font-mono mb-1`,children:`Execution Log:`}),V.map((e,t)=>(0,S.jsx)(`div`,{className:`text-xs ${e.type===`error`?`text-rose-400`:e.type===`warn`?`text-amber-300`:`text-emerald-300`}`,children:e.args.join(` `)},t))]})]}),(h===`javascript`||h===`typescript`||h===`python`||h===`web`&&(I===`console`||P===`console`))&&(0,S.jsx)(`div`,{className:`flex-1 p-3 overflow-y-auto thin-scroll space-y-1.5 font-mono text-xs select-text`,children:V.length===0?(0,S.jsxs)(`div`,{className:`text-center py-12 text-white/30 text-xs`,children:[`Press `,(0,S.jsx)(`span`,{className:`text-accent font-semibold`,children:`Run`}),` to execute code and inspect output.`]}):V.map((e,t)=>{let n=e.type===`error`?`text-rose-400`:e.type===`warn`?`text-amber-300`:e.type===`info`?`text-sky-300`:`text-white/85`;return(0,S.jsxs)(`div`,{className:`flex items-start gap-1.5 leading-relaxed`,children:[(0,S.jsx)(`span`,{className:`text-[9px] text-white/25 mt-0.5 shrink-0`,children:e.time}),(0,S.jsx)(`pre`,{className:`whitespace-pre-wrap break-all ${n}`,children:e.args.join(` `)})]},t)})})]})]})]})]})}export{C as default};