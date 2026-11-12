import{$t as e,At as t,O as n,T as r,Vt as i,Wt as a,Y as o,b as s,bt as c,in as l,j as u,m as d,tn as f,w as p}from"./GravityIcons-BHz8i1Q4.js";import{C as m,S as ee,_ as te,b as ne}from"./index-GP9eFjQl.js";var h=l(f(),1);function g(e,t,n){return`<!DOCTYPE html>
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
</html>`}function _(e){let t=e;return t=t.replace(/export\s+interface\s+\w+[\s\S]*?\{[\s\S]*?\}/g,``),t=t.replace(/interface\s+\w+[\s\S]*?\{[\s\S]*?\}/g,``),t=t.replace(/export\s+type\s+\w+[\s\S]*?;/g,``),t=t.replace(/type\s+\w+[\s\S]*?;/g,``),t=t.replace(/\s+as\s+[A-Za-z0-9_<>[\]]+/g,``),t=t.replace(/:\s*([A-Za-z0-9_<>[\]]+|\{[^}]*\})\s*(=|;|,|\))/g,`$2`),t=t.replace(/\):\s*[A-Za-z0-9_<>[\]]+\s*\{/g,`) {`),t}async function re(e,t=!1){let n=[],r=()=>new Date().toLocaleTimeString([],{hour12:!1}),i={log:(...e)=>{n.push({type:`log`,args:e.map(e=>typeof e==`object`?JSON.stringify(e,null,2):String(e)),time:r()})},warn:(...e)=>{n.push({type:`warn`,args:e.map(e=>typeof e==`object`?JSON.stringify(e,null,2):String(e)),time:r()})},error:(...e)=>{n.push({type:`error`,args:e.map(e=>typeof e==`object`?JSON.stringify(e,null,2):String(e)),time:r()})},info:(...e)=>{n.push({type:`info`,args:e.map(e=>typeof e==`object`?JSON.stringify(e,null,2):String(e)),time:r()})}},a=t?_(e):e,o=performance.now(),s;try{let e=Function(`console`,`"use strict";\n${a}`)(i);e instanceof Promise&&await e}catch(e){s=e.message||String(e),i.error(`Runtime Error: ${s}`)}return{logs:n,durationMs:Math.round((performance.now()-o)*100)/100,error:s}}var v=null,y=null;async function b(){return v||(window.loadPyodide?(v=await window.loadPyodide(),v):(y||=new Promise((e,t)=>{let n=document.createElement(`script`);n.src=`https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js`,n.onload=async()=>{try{v=await window.loadPyodide(),e(v)}catch(e){t(e)}},n.onerror=()=>t(Error(`Network offline: Using fallback Python interpreter`)),document.head.appendChild(n)}),y))}async function ie(e){let t=[],n=()=>new Date().toLocaleTimeString([],{hour12:!1}),r=performance.now();try{let r=await b();r.setStdout({batched:e=>{t.push({type:`log`,args:[e],time:n()})}}),r.setStderr({batched:e=>{t.push({type:`error`,args:[e],time:n()})}});let i=await r.runPythonAsync(e);i!=null&&typeof i!=`function`&&t.push({type:`info`,args:[`=> ${String(i)}`],time:n()})}catch(i){try{x(e,t,n)}catch(e){return t.push({type:`error`,args:[`[Python Error] ${i.message||e.message||String(i)}`],time:n()}),{logs:t,durationMs:Math.round(performance.now()-r),error:String(i)}}}return{logs:t,durationMs:Math.round((performance.now()-r)*100)/100}}function x(e,t,n){let r=e.split(`
`),i={};for(let e of r){let r=e.trim();if(!r||r.startsWith(`#`))continue;let a=r.match(/^print\((.*)\)$/);if(a){let e=a[1],r=``;try{let t=e.replace(/True/g,`true`).replace(/False/g,`false`).replace(/None/g,`null`),n=Function(...Object.keys(i),`return (${t})`);r=String(n(...Object.values(i)))}catch{r=e.replace(/^['"]|['"]$/g,``)}t.push({type:`log`,args:[r],time:n()});continue}let o=r.match(/^([a-zA-Z_]\w*)\s*=\s*(.+)$/);if(o){let e=o[1],t=o[2];try{let n=t.replace(/True/g,`true`).replace(/False/g,`false`).replace(/None/g,`null`);i[e]=Function(...Object.keys(i),`return (${n})`)(...Object.values(i))}catch{i[e]=t}}}}function ae(e){let t=performance.now(),n=[],r=()=>new Date().toLocaleTimeString([],{hour12:!1}),i={},a=e.split(`;`).map(e=>e.trim()).filter(Boolean),o;try{for(let e of a)if(/^CREATE\s+TABLE/i.test(e)){let t=e.match(/CREATE\s+TABLE\s+([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\)/i);if(t){let e=t[1],a=t[2].split(`,`).map(e=>e.trim().split(/\s+/)[0]);i[e]={cols:a,rows:[]},n.push({type:`info`,args:[`✓ Created table "${e}" with columns [${a.join(`, `)}]`],time:r()})}}else if(/^INSERT\s+INTO/i.test(e)){let t=e.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)(?:\s*\(([\s\S]*?)\))?\s+VALUES\s*\(([\s\S]*?)\)/i);if(t){let e=t[1];if(!i[e])throw Error(`Table "${e}" does not exist`);let a=t[3].split(`,`).map(e=>e.trim().replace(/^['"`]|['"`]$/g,``)),o={};i[e].cols.forEach((e,t)=>{let n=a[t]??``;o[e]=!isNaN(Number(n))&&n!==``?Number(n):n}),i[e].rows.push(o),n.push({type:`log`,args:[`✓ Inserted 1 row into "${e}"`],time:r()})}}else if(/^SELECT/i.test(e)){let t=e.match(/SELECT\s+([\s\S]*?)\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+([\s\S]*?))?(?:\s+ORDER\s+BY\s+([a-zA-Z0-9_]+)(?:\s+(ASC|DESC))?)?(?:\s+LIMIT\s+(\d+))?$/i);if(t){let e=t[1].trim(),a=t[2].trim(),s=t[3]?.trim(),c=t[4]?.trim(),l=(t[5]||`ASC`).toUpperCase(),u=t[6]?parseInt(t[6],10):void 0;if(!i[a])throw Error(`Table "${a}" does not exist`);let d=[...i[a].rows];if(s){let e=s.match(/([a-zA-Z0-9_]+)\s*(=|!=|>|<|>=|<=)\s*(.+)/);if(e){let[,t,n,r]=e,i=r.trim().replace(/^['"`]|['"`]$/g,``),a=Number(i);d=d.filter(e=>{let r=e[t];if(!isNaN(a)&&typeof r==`number`){if(n===`=`)return r===a;if(n===`!=`)return r!==a;if(n===`>`)return r>a;if(n===`<`)return r<a;if(n===`>=`)return r>=a;if(n===`<=`)return r<=a}return n===`=`?String(r)===i:String(r)!==i})}}c&&d.sort((e,t)=>{let n=e[c],r=t[c];return n<r?l===`DESC`?1:-1:n>r?l===`DESC`?-1:1:0}),u&&(d=d.slice(0,u)),o={columns:e===`*`?i[a].cols:e.split(`,`).map(e=>e.trim()),rows:d,message:`Selected ${d.length} rows from "${a}"`,rowCount:d.length},n.push({type:`info`,args:[`✓ Query OK: ${d.length} rows returned`],time:r()})}}}catch(e){return n.push({type:`error`,args:[`[SQL Error] ${e.message||String(e)}`],time:r()}),{logs:n,durationMs:Math.round(performance.now()-t),error:e.message}}let s=Math.round((performance.now()-t)*100)/100;return{result:o,logs:n,durationMs:s}}function oe(e){let t=e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`);t=t.replace(/```([a-z0-9_-]*)\n([\s\S]*?)```/g,(e,t,n)=>`<div class="code-block my-3 rounded-lg overflow-hidden border border-white/10 bg-black/40"><div class="px-3 py-1 bg-white/5 border-b border-white/5 text-[10px] font-mono text-white/50">${t||`code`}</div><pre class="p-3 text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre"><code>${n}</code></pre></div>`),t=t.replace(/`([^`]+)`/g,`<code class="px-1.5 py-0.5 rounded bg-white/10 text-emerald-300 font-mono text-xs">$1</code>`),t=t.replace(/^#### (.*$)/gim,`<h4 class="text-xs font-semibold text-white/90 mt-3 mb-1.5">$1</h4>`),t=t.replace(/^### (.*$)/gim,`<h3 class="text-sm font-semibold text-white mt-4 mb-2">$1</h3>`),t=t.replace(/^## (.*$)/gim,`<h2 class="text-base font-bold text-white mt-4 mb-2 pb-1 border-b border-white/10">$1</h2>`),t=t.replace(/^# (.*$)/gim,`<h1 class="text-lg font-bold text-white mt-5 mb-2.5 pb-1.5 border-b border-white/15">$1</h1>`),t=t.replace(/^> (.*$)/gim,`<blockquote class="border-l-2 border-accent pl-3 my-2 text-white/70 italic text-xs">$1</blockquote>`),t=t.replace(/^---$/gim,`<hr class="border-white/10 my-3" />`),t=t.replace(/\*\*([^*]+)\*\*/g,`<strong class="font-bold text-white">$1</strong>`),t=t.replace(/\*([^*]+)\*/g,`<em class="italic text-white/80">$1</em>`),t=t.replace(/~~([^~]+)~~/g,`<del class="line-through text-white/40">$1</del>`),t=t.replace(/^\s*[-*]\s+(.*$)/gim,`<li class="ml-4 list-disc text-white/80 text-xs my-0.5">$1</li>`),t=t.replace(/^\s*\d+\.\s+(.*$)/gim,`<li class="ml-4 list-decimal text-white/80 text-xs my-0.5">$1</li>`);let n=t.split(`
`),r=[],i=!1,a=[],o=()=>{if(a.length>0){let e=`<div class="overflow-x-auto my-3"><table class="w-full text-xs text-left border-collapse border border-white/10 rounded-lg overflow-hidden">`;a.forEach((t,n)=>{if(/^\|?(\s*:?-+:?\s*\|)+\s*$/.test(t))return;let r=t.split(`|`).slice(1,-1).map(e=>e.trim());r.length!==0&&(n===0?e+=`<thead class="bg-white/5 border-b border-white/10 text-white/90"><tr>`+r.map(e=>`<th class="px-3 py-2 font-medium">${e}</th>`).join(``)+`</tr></thead><tbody>`:e+=`<tr class="border-b border-white/5 hover:bg-white/[0.02]">`+r.map(e=>`<td class="px-3 py-1.5 text-white/70">${e}</td>`).join(``)+`</tr>`)}),e+=`</tbody></table></div>`,r.push(e),a=[]}};for(let e of n)e.trim().startsWith(`|`)&&e.trim().endsWith(`|`)?(i=!0,a.push(e.trim())):(i&&=(o(),!1),e.trim().length>0&&!e.startsWith(`<h`)&&!e.startsWith(`<blockquote`)&&!e.startsWith(`<li`)&&!e.startsWith(`<div`)&&!e.startsWith(`<hr`)&&!e.startsWith(`<table`)?r.push(`<p class="my-1 text-xs text-white/80 leading-relaxed">${e}</p>`):r.push(e));return i&&o(),r.join(`
`)}var S=[{id:`web`,label:`HTML / CSS / JS`,badge:`Web Sandbox`,extension:`.html`},{id:`javascript`,label:`JavaScript`,badge:`ESNext`,extension:`.js`},{id:`typescript`,label:`TypeScript`,badge:`TS Engine`,extension:`.ts`},{id:`python`,label:`Python`,badge:`Python 3`,extension:`.py`},{id:`sql`,label:`SQL`,badge:`In-Memory DB`,extension:`.sql`},{id:`markdown`,label:`Markdown`,badge:`Live Preview`,extension:`.md`}],C=[{id:`web-glass-card`,language:`web`,title:`Interactive Glassmorphic Counter`,category:`Web Components`,description:`An animated frosted glass UI component with live state management and button handlers.`,html:`<div class="card">
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
`}],w=e(),se={web:`Web`,javascript:`JS`,typescript:`TS`,python:`Python`,sql:`SQL`,markdown:`MD`};function T(){let{systemSounds:e,notify:l}=ee(),f=ne(),[_,v]=(0,h.useState)(`web`),[y,b]=(0,h.useState)(`web-glass-card`),[x,T]=(0,h.useState)(C[0].html||``),[E,D]=(0,h.useState)(C[0].css||``),[O,ce]=(0,h.useState)(C[0].js||``),[k,A]=(0,h.useState)(`html`),[le,j]=(0,h.useState)(``),[M,ue]=(0,h.useState)(!0),[N,P]=(0,h.useState)({web:``,javascript:C.find(e=>e.language===`javascript`)?.code||``,typescript:C.find(e=>e.language===`typescript`)?.code||``,python:C.find(e=>e.language===`python`)?.code||``,sql:C.find(e=>e.language===`sql`)?.code||``,markdown:C.find(e=>e.language===`markdown`)?.code||``}),[F,I]=(0,h.useState)(()=>typeof window<`u`&&window.innerWidth<768?`editor`:`split`),[L,R]=(0,h.useState)(`editor`),[z,de]=(0,h.useState)(!0),[B,V]=(0,h.useState)(`desktop`),[H,U]=(0,h.useState)([]),[W,G]=(0,h.useState)(null),[K,q]=(0,h.useState)(!1),[fe,J]=(0,h.useState)(null),[pe,me]=(0,h.useState)(!1),Y=(0,h.useRef)(null),X=(0,h.useRef)(null),Z=(0,h.useRef)(null);(0,h.useEffect)(()=>{let e=g(x,E,O);j(e)},[]),(0,h.useEffect)(()=>{let e=e=>{if(e.data&&e.data.type===`CODEPLAY_CONSOLE`){let{logType:t,args:n}=e.data,r=()=>new Date().toLocaleTimeString([],{hour12:!1});U(e=>[...e,{type:t||`log`,args:Array.isArray(n)?n:[String(n)],time:r()}])}};return window.addEventListener(`message`,e),()=>window.removeEventListener(`message`,e)},[]);let Q=C.filter(e=>e.language===_),$=C.find(e=>e.id===y)||Q[0],he=(0,h.useCallback)((e,t,n)=>{M&&(Z.current&&clearTimeout(Z.current),Z.current=setTimeout(()=>{j(g(e,t,n))},400))},[M]),ge=t=>{e&&m.playClick(),v(t);let n=C.find(e=>e.language===t);n&&b(n.id),U([]),J(null),G(null),R(`editor`),f?I(`editor`):(t===`web`||t===`markdown`)&&I(`split`)},_e=t=>{if(e&&m.playClick(),b(t.id),R(`editor`),U([]),J(null),G(null),t.language===`web`){let e=t.html||``,n=t.css||``,r=t.js||``;T(e),D(n),ce(r),j(g(e,n,r))}else P(e=>({...e,[t.language]:t.code||``}))},ve=()=>{if(e&&m.playClose(),$){if(_===`web`){let e=$.html||``,t=$.css||``,n=$.js||``;T(e),D(t),ce(n),j(g(e,t,n))}else P(e=>({...e,[_]:$.code||``}));U([]),J(null),G(null)}},ye=()=>_===`web`?k===`html`?x:k===`css`?E:O:N[_]||``,be=e=>{_===`web`?k===`html`?(T(e),he(e,E,O)):k===`css`?(D(e),he(x,e,O)):(ce(e),he(x,E,e)):P(t=>({...t,[_]:e}))},xe=()=>{Y.current&&X.current&&(X.current.scrollTop=Y.current.scrollTop)},Se=e=>{if((e.ctrlKey||e.metaKey)&&e.key===`Enter`){e.preventDefault(),Ce();return}if(e.key===`Tab`){e.preventDefault();let t=e.currentTarget,n=t.selectionStart,r=t.selectionEnd,i=ye(),a=i.substring(0,n)+`  `+i.substring(r);be(a),setTimeout(()=>{t.selectionStart=t.selectionEnd=n+2},0)}},Ce=async()=>{if(e&&m.playPop(),q(!0),J(null),_===`web`||_===`markdown`?(R(`preview`),f&&I(`preview`)):(R(`console`),f&&I(`console`)),_===`web`){U([]);let e=g(x,E,O);j(e),q(!1),J(12);return}let t=N[_]||``;if(_===`javascript`||_===`typescript`){let{logs:e,durationMs:n}=await re(t,_===`typescript`);U(e),J(n),q(!1),fetch(`${te}/api/snippets/run`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({code:t,id:y})}).then(e=>e.ok?e.json():null).then(e=>{if(e?.metrics){let t=new Date().toLocaleTimeString([],{hour12:!1});U(n=>[...n,{type:`info`,args:[`Server Verified · Complexity: ${e.metrics.estimatedComplexity} · ${e.lines} lines`],time:t}])}}).catch(()=>{});return}if(_===`python`){let{logs:e,durationMs:n}=await ie(t);U(e),J(n),q(!1);return}if(_===`sql`){let{result:e,logs:n,durationMs:r}=ae(t);U(n),G(e||null),J(r),q(!1);return}_===`markdown`&&(q(!1),J(5))},we=()=>{e&&m.playPop();let t=``;t=_===`web`?`<!-- HTML -->\n${x}\n\n/* CSS */\n${E}\n\n// JavaScript\n${O}`:N[_]||``,navigator.clipboard?.writeText(t),me(!0),setTimeout(()=>me(!1),2e3)},Te=()=>{e&&m.playPop();let t=``,n=`${y||`snippet`}`,r=`text/plain`;if(_===`web`)t=g(x,E,O),n+=`.html`,r=`text/html`;else{t=N[_]||``;let e=S.find(e=>e.id===_)?.extension||`.txt`;n+=e,r=`text/plain`}let i=new Blob([t],{type:`${r};charset=utf-8`}),a=URL.createObjectURL(i),o=document.createElement(`a`);o.href=a,o.download=n,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(a),l(`Exported`,`Saved ${n} to downloads.`)},Ee=ye(),De=Ee.split(`
`);return(0,w.jsxs)(`div`,{className:`flex flex-col h-full bg-[#0a0a0f] text-white select-none w-full max-w-full overflow-hidden`,children:[(0,w.jsxs)(`div`,{className:`px-2.5 sm:px-3.5 py-2 border-b border-white/10 flex items-center justify-between gap-1.5 sm:gap-2 bg-[#0a0a0f]/95 backdrop-blur-md shrink-0 sticky top-0 z-20 shadow-sm w-full max-w-full overflow-hidden`,children:[(0,w.jsxs)(`div`,{className:`flex items-center gap-2 min-w-0 flex-1`,children:[(0,w.jsx)(`div`,{className:`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent shrink-0`,children:(0,w.jsx)(p,{size:15})}),(0,w.jsxs)(`div`,{className:`min-w-0 max-w-[120px] xs:max-w-[170px] sm:max-w-xs md:max-w-none`,children:[(0,w.jsxs)(`div`,{className:`flex items-center gap-1.5`,children:[(0,w.jsx)(`h2`,{className:`text-xs font-semibold text-white truncate`,children:$?.title||`Code Playground`}),(0,w.jsx)(`span`,{className:`hidden xs:inline-block text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-white/70 font-mono shrink-0`,children:S.find(e=>e.id===_)?.badge})]}),(0,w.jsx)(`p`,{className:`text-[10px] text-white/45 truncate hidden md:block`,children:$?.description})]})]}),(0,w.jsxs)(`div`,{className:`flex items-center gap-1 shrink-0`,children:[(0,w.jsxs)(`div`,{className:`hidden md:flex items-center bg-black/40 border border-white/10 rounded-lg p-0.5 mr-1`,children:[(0,w.jsxs)(`button`,{onClick:()=>I(`split`),className:`px-2 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1 ${F===`split`?`bg-white/15 text-white`:`text-white/50 hover:text-white`}`,title:`Split Editor & Output`,children:[(0,w.jsx)(o,{size:12}),(0,w.jsx)(`span`,{children:`Split`})]}),(_===`web`||_===`markdown`)&&(0,w.jsxs)(`button`,{onClick:()=>I(`preview`),className:`px-2 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1 ${F===`preview`?`bg-white/15 text-white`:`text-white/50 hover:text-white`}`,title:`Preview Only`,children:[(0,w.jsx)(u,{size:12}),(0,w.jsx)(`span`,{children:`Preview`})]}),(0,w.jsxs)(`button`,{onClick:()=>I(`console`),className:`px-2 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1 ${F===`console`?`bg-white/15 text-white`:`text-white/50 hover:text-white`}`,title:`Console Logs`,children:[(0,w.jsx)(i,{size:12}),(0,w.jsx)(`span`,{children:`Console`})]})]}),(0,w.jsx)(`button`,{onClick:ve,className:`p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition`,title:`Reset to Template`,children:(0,w.jsx)(t,{size:13})}),(0,w.jsxs)(`button`,{onClick:we,className:`flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/80 transition`,title:`Copy Code`,children:[pe?(0,w.jsx)(d,{size:13,className:`text-emerald-400`}):(0,w.jsx)(r,{size:13}),(0,w.jsx)(`span`,{className:`hidden sm:inline`,children:pe?`Copied`:`Copy`})]}),(0,w.jsx)(`button`,{onClick:Te,className:`p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition`,title:`Export / Download File`,children:(0,w.jsx)(n,{size:13})}),(0,w.jsxs)(`button`,{onClick:Ce,disabled:K,className:`flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-lg sm:rounded-xl bg-accent hover:brightness-110 active:scale-95 text-xs font-semibold text-white shadow-md shadow-accent/25 transition ml-0.5`,title:`Execute Code (⌘+Enter)`,children:[(0,w.jsx)(c,{size:13}),(0,w.jsx)(`span`,{className:`inline sm:hidden`,children:K?`...`:`Run`}),(0,w.jsx)(`span`,{className:`hidden sm:inline`,children:K?`Running...`:`Run (⌘Enter)`})]})]})]}),(0,w.jsxs)(`div`,{className:`px-2.5 sm:px-3 py-1.5 bg-black/50 border-b border-white/5 flex items-center justify-between gap-2 overflow-x-auto thin-scroll`,children:[(0,w.jsxs)(`div`,{className:`flex items-center gap-1 shrink-0`,children:[(0,w.jsx)(`span`,{className:`text-[10px] uppercase font-mono text-white/40 mr-1 hidden xs:inline`,children:`Lang:`}),S.map(e=>(0,w.jsxs)(`button`,{onClick:()=>ge(e.id),className:`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] font-medium transition shrink-0 ${_===e.id?`bg-accent text-white shadow-sm font-semibold`:`bg-white/5 text-white/60 hover:text-white hover:bg-white/10`}`,children:[(0,w.jsx)(`span`,{className:`sm:hidden`,children:se[e.id]}),(0,w.jsx)(`span`,{className:`hidden sm:inline`,children:e.label})]},e.id))]}),_===`web`&&(0,w.jsxs)(`label`,{className:`flex items-center gap-1.5 text-[10px] sm:text-[11px] text-white/50 cursor-pointer select-none shrink-0 hover:text-white/80 ml-auto`,children:[(0,w.jsx)(`input`,{type:`checkbox`,checked:M,onChange:e=>ue(e.target.checked),className:`accent-accent rounded w-3.5 h-3.5`}),(0,w.jsx)(`span`,{className:`hidden xs:inline`,children:`Live Auto-Update`}),(0,w.jsx)(`span`,{className:`xs:hidden`,children:`Live`})]})]}),Q.length>0&&(0,w.jsxs)(`div`,{className:`hidden md:flex px-3 py-1.5 bg-black/25 border-b border-white/5 items-center gap-1.5 overflow-x-auto thin-scroll`,children:[(0,w.jsxs)(`span`,{className:`text-[10px] uppercase font-mono text-white/40 mr-1 shrink-0 flex items-center gap-1`,children:[(0,w.jsx)(p,{size:11,className:`text-accent`}),`Templates:`]}),Q.map(e=>(0,w.jsx)(`button`,{onClick:()=>_e(e),className:`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition shrink-0 ${y===e.id?`bg-white/15 text-white border border-white/15`:`bg-white/5 text-white/50 hover:text-white hover:bg-white/10`}`,children:e.title},e.id))]}),(0,w.jsxs)(`div`,{className:`md:hidden px-2.5 py-1.5 bg-black/30 border-b border-white/10 flex items-center justify-between gap-2`,children:[Q.length>0&&(0,w.jsxs)(`div`,{className:`relative flex-1 min-w-0 max-w-[190px]`,children:[(0,w.jsx)(`select`,{value:y,onChange:e=>{let t=Q.find(t=>t.id===e.target.value);t&&_e(t)},className:`w-full bg-[#141622] text-white text-[11px] font-medium rounded-lg px-2.5 py-1 border border-white/10 truncate focus:outline-none focus:border-accent appearance-none pr-6 cursor-pointer`,children:Q.map(e=>(0,w.jsx)(`option`,{value:e.id,className:`bg-[#12131a] text-white`,children:e.title},e.id))}),(0,w.jsx)(`div`,{className:`pointer-events-none absolute inset-y-0 right-2 flex items-center text-white/40 text-[9px]`,children:`▼`})]}),(0,w.jsxs)(`div`,{className:`flex items-center bg-black/60 border border-white/10 rounded-lg p-0.5 shrink-0`,children:[(0,w.jsxs)(`button`,{type:`button`,onClick:()=>{R(`editor`),I(`editor`)},className:`px-2.5 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1 ${L===`editor`?`bg-accent text-white shadow-sm font-semibold`:`text-white/60 hover:text-white`}`,children:[(0,w.jsx)(p,{size:12}),(0,w.jsx)(`span`,{children:`Code`})]}),(_===`web`||_===`markdown`)&&(0,w.jsxs)(`button`,{type:`button`,onClick:()=>{R(`preview`),I(`preview`)},className:`px-2 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1 shrink-0 ${L===`preview`?`bg-accent text-white shadow-sm font-semibold`:`text-white/60 hover:text-white`}`,title:`Preview`,children:[(0,w.jsx)(u,{size:13}),(0,w.jsx)(`span`,{className:`hidden xs:inline`,children:`Preview`})]}),_!==`markdown`&&(0,w.jsxs)(`button`,{type:`button`,onClick:()=>{R(`console`),I(`console`)},className:`px-2 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1 shrink-0 ${L===`console`?`bg-accent text-white shadow-sm font-semibold`:`text-white/60 hover:text-white`}`,children:[(0,w.jsx)(i,{size:12}),(0,w.jsx)(`span`,{className:`hidden xs:inline`,children:_===`sql`?`Table`:`Console`}),(0,w.jsx)(`span`,{className:`xs:hidden`,children:_===`sql`?`SQL`:`Logs`})]})]})]}),_===`web`&&(L===`editor`||F!==`preview`)&&(0,w.jsxs)(`div`,{className:`px-2.5 sm:px-3 py-1 bg-[#0b0c12] border-b border-white/10 flex items-center justify-between text-xs font-mono w-full max-w-full overflow-hidden shrink-0 ${L===`editor`?`flex`:`hidden md:flex`}`,children:[(0,w.jsxs)(`div`,{className:`flex items-center gap-1 sm:gap-2 shrink-0`,children:[(0,w.jsxs)(`button`,{type:`button`,onClick:()=>A(`html`),className:`px-2 sm:px-3 py-1 rounded-t-lg transition flex items-center gap-1.5 ${k===`html`?`bg-[#0d0e15] text-amber-300 font-semibold border-b-2 border-amber-400`:`text-white/50 hover:text-white hover:bg-white/5`}`,children:[(0,w.jsx)(`span`,{className:`w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0`}),(0,w.jsx)(`span`,{className:`xs:hidden`,children:`html`}),(0,w.jsx)(`span`,{className:`hidden xs:inline`,children:`index.html`})]}),(0,w.jsxs)(`button`,{type:`button`,onClick:()=>A(`css`),className:`px-2 sm:px-3 py-1 rounded-t-lg transition flex items-center gap-1.5 ${k===`css`?`bg-[#0d0e15] text-sky-300 font-semibold border-b-2 border-sky-400`:`text-white/50 hover:text-white hover:bg-white/5`}`,children:[(0,w.jsx)(`span`,{className:`w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0`}),(0,w.jsx)(`span`,{className:`xs:hidden`,children:`css`}),(0,w.jsx)(`span`,{className:`hidden xs:inline`,children:`style.css`})]}),(0,w.jsxs)(`button`,{type:`button`,onClick:()=>A(`js`),className:`px-2 sm:px-3 py-1 rounded-t-lg transition flex items-center gap-1.5 ${k===`js`?`bg-[#0d0e15] text-yellow-300 font-semibold border-b-2 border-yellow-400`:`text-white/50 hover:text-white hover:bg-white/5`}`,children:[(0,w.jsx)(`span`,{className:`w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0`}),(0,w.jsx)(`span`,{className:`xs:hidden`,children:`js`}),(0,w.jsx)(`span`,{className:`hidden xs:inline`,children:`script.js`})]})]}),(0,w.jsx)(`button`,{type:`button`,onClick:()=>{R(`preview`),I(`preview`)},className:`md:hidden p-1.5 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent transition flex items-center justify-center shrink-0 cursor-pointer active:scale-95 shadow-sm border border-accent/30`,title:`Open Live Preview`,"aria-label":`Open Live Preview`,children:(0,w.jsx)(u,{size:14})})]}),(0,w.jsxs)(`div`,{className:`flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden w-full max-w-full`,children:[(0,w.jsxs)(`div`,{className:`flex-1 flex-col min-w-0 border-b md:border-b-0 md:border-r border-white/10 bg-[#0d0e15] w-full max-w-full overflow-hidden ${L===`editor`?`flex`:`hidden md:flex`} ${F===`preview`?`md:hidden`:``}`,children:[(0,w.jsxs)(`div`,{className:`flex-1 relative flex overflow-hidden min-h-0 w-full max-w-full`,children:[(0,w.jsx)(`div`,{ref:X,className:`w-8 sm:w-12 py-2.5 sm:py-3 bg-black/35 border-r border-white/5 text-right pr-1.5 sm:pr-2 text-white/25 font-mono text-[11px] sm:text-xs select-none overflow-hidden leading-relaxed shrink-0 ${z?`hidden sm:block`:`block`}`,children:De.map((e,t)=>(0,w.jsx)(`div`,{children:t+1},t))}),(0,w.jsx)(`textarea`,{ref:Y,value:Ee,onChange:e=>be(e.target.value),onScroll:xe,onKeyDown:Se,spellCheck:`false`,autoComplete:`off`,autoCapitalize:`off`,placeholder:_===`web`?`Enter ${k.toUpperCase()} code here...`:`Write your ${_} code here...`,className:`flex-1 h-full p-2.5 sm:p-3 bg-transparent text-emerald-300 font-mono text-xs leading-relaxed outline-none resize-none thin-scroll allow-select w-full max-w-full ${z?`whitespace-pre-wrap break-words overflow-x-hidden`:`whitespace-pre overflow-x-auto`}`})]}),(0,w.jsxs)(`div`,{className:`px-2.5 sm:px-3 py-1 bg-black/30 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40 font-mono shrink-0 w-full max-w-full overflow-hidden`,children:[(0,w.jsxs)(`div`,{className:`flex items-center gap-1.5 sm:gap-2 truncate min-w-0`,children:[(0,w.jsxs)(`span`,{className:`truncate`,children:[De.length,` lines · `,Ee.length,` chars`]}),(0,w.jsx)(`span`,{children:`·`}),(0,w.jsx)(`span`,{className:`text-white/60 truncate`,children:_===`web`?`web / ${k}`:S.find(e=>e.id===_)?.label})]}),(0,w.jsxs)(`div`,{className:`flex items-center gap-1.5 sm:gap-2 shrink-0`,children:[(0,w.jsxs)(`button`,{type:`button`,onClick:()=>de(!z),className:`px-1.5 py-0.5 rounded text-[10px] font-mono transition flex items-center gap-1 cursor-pointer ${z?`bg-accent/20 text-accent border border-accent/30 font-semibold`:`bg-white/5 text-white/40 hover:text-white`}`,title:`Toggle Word Wrap (Wrap lines without sliding)`,children:[(0,w.jsx)(`span`,{children:`Wrap`}),(0,w.jsx)(`span`,{className:`text-[9px]`,children:z?`ON`:`OFF`})]}),(0,w.jsx)(`span`,{className:`hidden sm:inline text-white/30`,children:`⌘ + Enter to execute`}),(0,w.jsxs)(`button`,{type:`button`,onClick:()=>{let e=_===`web`||_===`markdown`?`preview`:`console`;R(e),I(e)},className:`md:hidden text-accent text-[10px] font-sans hover:underline flex items-center gap-1 ml-0.5 cursor-pointer py-0.5 px-1.5 rounded bg-accent/10 shrink-0`,title:`View Output`,children:[(0,w.jsx)(u,{size:11}),(0,w.jsx)(`span`,{children:`Output`})]})]})]})]}),(0,w.jsxs)(`div`,{className:`flex-col bg-black/40 min-h-0 relative overflow-hidden ${L===`editor`?`hidden md:flex`:`flex flex-1 w-full`} ${F===`preview`?`md:flex-1 md:w-full`:`md:w-1/2 lg:w-7/12`}`,children:[(0,w.jsxs)(`div`,{className:`px-3 py-2 border-b border-white/10 flex items-center justify-between bg-black/30 shrink-0`,children:[(0,w.jsxs)(`div`,{className:`flex items-center gap-2 text-xs text-white/80`,children:[(0,w.jsxs)(`button`,{type:`button`,onClick:()=>{R(`editor`),I(`editor`)},className:`md:hidden flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-xs text-white font-medium mr-1 transition active:scale-95 cursor-pointer`,children:[(0,w.jsx)(`span`,{children:`‹`}),(0,w.jsx)(`span`,{children:`Code`})]}),_===`web`&&(L===`preview`||F!==`console`)?(0,w.jsxs)(w.Fragment,{children:[(0,w.jsx)(u,{size:14,className:`text-accent`}),(0,w.jsx)(`span`,{className:`font-semibold text-xs`,children:`Live Sandbox Preview`})]}):_===`markdown`?(0,w.jsxs)(w.Fragment,{children:[(0,w.jsx)(u,{size:14,className:`text-accent`}),(0,w.jsx)(`span`,{className:`font-semibold text-xs`,children:`Markdown Rendered View`})]}):_===`sql`?(0,w.jsxs)(w.Fragment,{children:[(0,w.jsx)(i,{size:14,className:`text-accent`}),(0,w.jsx)(`span`,{className:`font-semibold text-xs`,children:`SQL Result & Logs`})]}):(0,w.jsxs)(w.Fragment,{children:[(0,w.jsx)(i,{size:14,className:`text-accent`}),(0,w.jsx)(`span`,{className:`font-semibold text-xs`,children:`Output Terminal`})]}),fe!==null&&(0,w.jsxs)(`span`,{className:`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent font-mono`,children:[(0,w.jsx)(s,{size:10}),(0,w.jsxs)(`span`,{children:[fe,` ms`]})]})]}),(0,w.jsxs)(`div`,{className:`flex items-center gap-2`,children:[_===`web`&&(L===`preview`||F!==`console`)&&(0,w.jsxs)(`div`,{className:`hidden sm:flex items-center bg-black/50 border border-white/10 rounded-md p-0.5 text-[10px] font-mono`,children:[(0,w.jsx)(`button`,{type:`button`,onClick:()=>V(`desktop`),className:`px-1.5 py-0.5 rounded ${B===`desktop`?`bg-white/20 text-white`:`text-white/40 hover:text-white`}`,children:`100%`}),(0,w.jsx)(`button`,{type:`button`,onClick:()=>V(`tablet`),className:`px-1.5 py-0.5 rounded ${B===`tablet`?`bg-white/20 text-white`:`text-white/40 hover:text-white`}`,children:`768px`}),(0,w.jsx)(`button`,{type:`button`,onClick:()=>V(`mobile`),className:`px-1.5 py-0.5 rounded ${B===`mobile`?`bg-white/20 text-white`:`text-white/40 hover:text-white`}`,children:`375px`})]}),H.length>0&&(0,w.jsx)(`button`,{type:`button`,onClick:()=>U([]),className:`text-white/40 hover:text-rose-400 p-1 rounded transition cursor-pointer`,title:`Clear Console Output`,children:(0,w.jsx)(a,{size:12})})]})]}),(0,w.jsxs)(`div`,{className:`flex-1 flex flex-col min-h-0 overflow-hidden relative`,children:[_===`web`&&(L===`preview`||F!==`console`)&&(0,w.jsx)(`div`,{className:`flex-1 flex flex-col items-center justify-center bg-[#090a10] p-0 sm:p-2 overflow-hidden min-h-0 w-full h-full`,children:(0,w.jsxs)(`div`,{className:`h-full w-full transition-all duration-300 sm:rounded-lg overflow-hidden sm:border sm:border-white/10 sm:shadow-2xl bg-[#0f111a] flex flex-col min-h-0 ${B===`desktop`?`w-full`:B===`tablet`?`sm:max-w-[768px] w-full`:`sm:max-w-[375px] w-full`}`,children:[B!==`desktop`&&(0,w.jsxs)(`div`,{className:`hidden sm:flex px-3 py-1.5 bg-black/60 border-b border-white/10 items-center justify-between text-[10px] font-mono text-white/40 shrink-0`,children:[(0,w.jsxs)(`div`,{className:`flex items-center gap-1.5`,children:[(0,w.jsx)(`span`,{className:`w-2 h-2 rounded-full bg-rose-500/80`}),(0,w.jsx)(`span`,{className:`w-2 h-2 rounded-full bg-amber-500/80`}),(0,w.jsx)(`span`,{className:`w-2 h-2 rounded-full bg-emerald-500/80`})]}),(0,w.jsx)(`span`,{children:B===`tablet`?`Tablet View (768px)`:`Mobile View (375px)`}),(0,w.jsx)(`span`,{children:`100%`})]}),(0,w.jsx)(`iframe`,{title:`CodePlay Web Preview`,sandbox:`allow-scripts allow-modals`,srcDoc:le,className:`w-full h-full flex-1 border-none bg-[#0f111a] block min-h-0`})]})}),_===`markdown`&&(0,w.jsx)(`div`,{className:`flex-1 p-4 sm:p-6 overflow-y-auto thin-scroll text-white/90 font-sans leading-relaxed select-text`,dangerouslySetInnerHTML:{__html:oe(N.markdown||``)}}),_===`sql`&&(0,w.jsxs)(`div`,{className:`flex-1 flex flex-col min-h-0 overflow-y-auto thin-scroll p-3 space-y-3`,children:[W?(0,w.jsxs)(`div`,{className:`space-y-2`,children:[(0,w.jsxs)(`div`,{className:`flex items-center justify-between text-xs text-white/60`,children:[(0,w.jsx)(`span`,{className:`font-semibold text-emerald-400`,children:W.message}),(0,w.jsxs)(`span`,{className:`font-mono text-[10px]`,children:[W.rowCount,` `,W.rowCount===1?`row`:`rows`]})]}),(0,w.jsx)(`div`,{className:`overflow-x-auto rounded-lg border border-white/10 bg-black/40 shadow-inner`,children:(0,w.jsxs)(`table`,{className:`w-full text-xs text-left border-collapse`,children:[(0,w.jsx)(`thead`,{className:`bg-white/5 border-b border-white/10 text-white/80 font-mono`,children:(0,w.jsx)(`tr`,{children:W.columns.map((e,t)=>(0,w.jsx)(`th`,{className:`px-3 py-2 font-semibold`,children:e},t))})}),(0,w.jsx)(`tbody`,{className:`divide-y divide-white/5 font-mono text-[11px]`,children:W.rows.map((e,t)=>(0,w.jsx)(`tr`,{className:`hover:bg-white/[0.03] transition`,children:W.columns.map((t,n)=>(0,w.jsx)(`td`,{className:`px-3 py-1.5 text-white/70`,children:e[t]!==void 0&&e[t]!==null?String(e[t]):`NULL`},n))},t))})]})})]}):(0,w.jsx)(`div`,{className:`text-center py-6 text-white/30 text-xs`,children:`Run your SQL statements above to view the tabular result grid.`}),H.length>0&&(0,w.jsxs)(`div`,{className:`pt-2 border-t border-white/10 space-y-1 font-mono text-xs`,children:[(0,w.jsx)(`div`,{className:`text-[10px] text-white/40 uppercase font-mono mb-1`,children:`Execution Log:`}),H.map((e,t)=>(0,w.jsx)(`div`,{className:`text-xs ${e.type===`error`?`text-rose-400`:e.type===`warn`?`text-amber-300`:`text-emerald-300`}`,children:e.args.join(` `)},t))]})]}),(_===`javascript`||_===`typescript`||_===`python`||_===`web`&&(L===`console`||F===`console`))&&(0,w.jsx)(`div`,{className:`flex-1 p-3 overflow-y-auto thin-scroll space-y-1.5 font-mono text-xs select-text`,children:H.length===0?(0,w.jsxs)(`div`,{className:`text-center py-12 text-white/30 text-xs`,children:[`Press `,(0,w.jsx)(`span`,{className:`text-accent font-semibold`,children:`Run`}),` to execute code and inspect output.`]}):H.map((e,t)=>{let n=e.type===`error`?`text-rose-400`:e.type===`warn`?`text-amber-300`:e.type===`info`?`text-sky-300`:`text-white/85`;return(0,w.jsxs)(`div`,{className:`flex items-start gap-1.5 leading-relaxed`,children:[(0,w.jsx)(`span`,{className:`text-[9px] text-white/25 mt-0.5 shrink-0`,children:e.time}),(0,w.jsx)(`pre`,{className:`whitespace-pre-wrap break-all ${n}`,children:e.args.join(` `)})]},t)})})]})]})]})]})}export{T as default};