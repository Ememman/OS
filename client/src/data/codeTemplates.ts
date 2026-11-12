import type { SupportedLanguage } from "../lib/codeRunner";

export interface CodeTemplate {
  id: string;
  language: SupportedLanguage;
  title: string;
  category: string;
  description: string;
  html?: string;
  css?: string;
  js?: string;
  code?: string;
}

export const LANGUAGE_OPTIONS: { id: SupportedLanguage; label: string; badge: string; extension: string }[] = [
  { id: "web", label: "HTML / CSS / JS", badge: "Web Sandbox", extension: ".html" },
  { id: "javascript", label: "JavaScript", badge: "ESNext", extension: ".js" },
  { id: "typescript", label: "TypeScript", badge: "TS Engine", extension: ".ts" },
  { id: "python", label: "Python", badge: "Python 3", extension: ".py" },
  { id: "sql", label: "SQL", badge: "In-Memory DB", extension: ".sql" },
  { id: "markdown", label: "Markdown", badge: "Live Preview", extension: ".md" },
];

export const TEMPLATES: CodeTemplate[] = [
  // 1. WEB PLAYGROUND (HTML / CSS / JS)
  {
    id: "web-glass-card",
    language: "web",
    title: "Interactive Glassmorphic Counter",
    category: "Web Components",
    description: "An animated frosted glass UI component with live state management and button handlers.",
    html: `<div class="card">
  <div class="badge">Portfolio OS Widget</div>
  <h1>Interactive Counter</h1>
  <p>Live HTML, CSS & JavaScript Sandbox</p>
  <div class="counter-display" id="count">0</div>
  <div class="btn-group">
    <button id="decBtn">- Decrement</button>
    <button id="rstBtn">Reset</button>
    <button id="incBtn" class="primary">+ Increment</button>
  </div>
</div>`,
    css: `body {
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
}`,
    js: `let count = 0;
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

console.log("Interactive Glass Widget ready!");`
  },
  {
    id: "web-particles",
    language: "web",
    title: "Neon Canvas Particle Network",
    category: "Canvas & Graphics",
    description: "60 FPS HTML5 Canvas particle network connecting dynamic nodes with interactive mouse tracking.",
    html: `<div class="canvas-container">
  <div class="info-tag">Move cursor across the preview window</div>
  <canvas id="matrix"></canvas>
</div>`,
    css: `body {
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
}`,
    js: `const canvas = document.getElementById("matrix");
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
console.log("Canvas animation initialized: 45 interactive particles running at 60 FPS.");`
  },

  // 2. JAVASCRIPT (ESNEXT)
  {
    id: "js-pipeline",
    language: "javascript",
    title: "Data Pipeline & Aggregation",
    category: "Fullstack / MERN",
    description: "Transforms orders, aggregates category revenues, and identifies VIP customers.",
    code: `const orders = [
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
console.log("Total Pipeline Revenue: $" + completed.reduce((sum, o) => sum + o.amount, 0).toLocaleString());`
  },
  {
    id: "js-lru",
    language: "javascript",
    title: "LRU Cache Implementation",
    category: "Data Structures",
    description: "Least-Recently-Used (LRU) Cache operating with O(1) get and put operations via Map ordering.",
    code: `class LRUCache {
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

console.log("Cache after eviction:", lru.dump().map(([k, v]) => \`\${k} -> \${v.user}\`));`
  },

  // 3. TYPESCRIPT
  {
    id: "ts-repo",
    language: "typescript",
    title: "Generic Repository & Type Guards",
    category: "Typed Systems",
    description: "Generic in-memory entity repository with type guards, filtering, and immutable updates.",
    code: `interface BaseEntity {
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
console.log("Admin Users:", admins);`
  },

  // 4. PYTHON
  {
    id: "py-fib",
    language: "python",
    title: "Fibonacci & Memoization",
    category: "Algorithms",
    description: "Recursive vs Memoized dynamic programming comparison in Python.",
    code: `# Fibonacci with Dynamic Programming Memoization
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
print("Memoized cache size:", len(memo))`
  },
  {
    id: "py-words",
    language: "python",
    title: "Word Frequency Counter",
    category: "Data Processing",
    description: "Calculates token frequencies, clean word tokens, and top ranked keywords in Python.",
    code: `text = """
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
    print(f"  - '{word}': {count} occurrences")`
  },

  // 5. SQL PLAYGROUND
  {
    id: "sql-analytics",
    language: "sql",
    title: "E-Commerce Customer Analytics",
    category: "Database Queries",
    description: "Creates tables, inserts transactional data, and queries high-performing sales records.",
    code: `CREATE TABLE customers (id, name, city, spent);
INSERT INTO customers VALUES (1, 'Alice Rivera', 'San Francisco', 1450);
INSERT INTO customers VALUES (2, 'Bob Chen', 'Seattle', 620);
INSERT INTO customers VALUES (3, 'Charlie Ross', 'Austin', 2100);
INSERT INTO customers VALUES (4, 'Diana Prince', 'New York', 480);
INSERT INTO customers VALUES (5, 'Elena Rostov', 'Boston', 1890);

SELECT name, city, spent FROM customers WHERE spent >= 1000 ORDER BY spent DESC;`
  },

  // 6. MARKDOWN
  {
    id: "md-guide",
    language: "markdown",
    title: "Interactive System Specification",
    category: "Documentation",
    description: "Markdown documentation with headers, badges, tables, and task checklists.",
    code: `# Portfolio OS Architecture Specification

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
`
  }
];

