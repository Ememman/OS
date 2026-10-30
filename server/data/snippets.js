export const snippets = [
  {
    id: "array-pipeline",
    title: "Data Pipeline & Aggregation",
    category: "Fullstack / MERN",
    language: "javascript",
    description: "Transforms e-commerce orders, computes total revenue, groups by category, and filters high-value customers.",
    code: `// Sample Order Dataset
const orders = [
  { id: 101, customer: "Alice", category: "Electronics", amount: 450, status: "completed" },
  { id: 102, customer: "Bob", category: "Apparel", amount: 85, status: "completed" },
  { id: 103, customer: "Charlie", category: "Electronics", amount: 1200, status: "completed" },
  { id: 104, customer: "Alice", category: "Books", amount: 45, status: "completed" },
  { id: 105, customer: "Diana", category: "Apparel", amount: 320, status: "pending" },
  { id: 106, customer: "Bob", category: "Electronics", amount: 950, status: "completed" },
];

console.log("🚀 Starting Data Pipeline processing...");

// 1. Filter completed transactions
const completed = orders.filter(o => o.status === "completed");

// 2. Aggregate revenue by category
const categoryRevenue = completed.reduce((acc, order) => {
  acc[order.category] = (acc[order.category] || 0) + order.amount;
  return acc;
}, {});

// 3. Find top spending VIP customers ($500+)
const customerTotals = completed.reduce((acc, order) => {
  acc[order.customer] = (acc[order.customer] || 0) + order.amount;
  return acc;
}, {});

const vipCustomers = Object.entries(customerTotals)
  .filter(([_, total]) => total >= 500)
  .sort((a, b) => b[1] - a[1])
  .map(([name, total]) => ({ customer: name, totalSpent: \`$\${total.toLocaleString()}\` }));

console.log("📊 Category Revenue Breakdown:", categoryRevenue);
console.log("⭐ Top VIP Customers:", vipCustomers);
console.log("✅ Total Pipeline Revenue: $" + completed.reduce((sum, o) => sum + o.amount, 0).toLocaleString());
`
  },
  {
    id: "lru-cache",
    title: "LRU Cache Implementation",
    category: "Systems & Data Structures",
    language: "javascript",
    description: "Least-Recently-Used (LRU) Cache operating with O(1) get and put operations via Map ordering.",
    code: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return -1;
    // Refresh access order by re-inserting
    const val = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Evict the least recently used (first element in Map)
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      console.log(\`⚠️ Evicted oldest item: [Key: \${oldestKey}]\`);
    }
    this.cache.set(key, value);
  }

  dump() {
    return Array.from(this.cache.entries());
  }
}

console.log("🧠 Testing LRU Cache (Capacity = 3)...");
const lru = new LRUCache(3);

lru.put("auth:token_1", { user: "Bron", role: "admin" });
lru.put("auth:token_2", { user: "Sarah", role: "editor" });
lru.put("auth:token_3", { user: "Alex", role: "viewer" });

console.log("Cache contents:", lru.dump().map(([k, v]) => \`\${k} -> \${v.user}\`));

// Access token_1, refreshing its recency
console.log("Accessing 'auth:token_1':", lru.get("auth:token_1"));

// Insert 4th item, which should evict token_2!
lru.put("auth:token_4", { user: "David", role: "guest" });

console.log("Cache after eviction:", lru.dump().map(([k, v]) => \`\${k} -> \${v.user}\`));
console.log("Is 'auth:token_2' still present?", lru.get("auth:token_2") === -1 ? "No (Evicted ✅)" : "Yes");
`
  },
  {
    id: "pubsub-emitter",
    title: "Event Emitter & PubSub Pattern",
    category: "Real-time / Architecture",
    language: "javascript",
    description: "Lightweight publish-subscribe message bus powering decoupled real-time updates and notifications.",
    code: `class EventEmitter {
  constructor() {
    this.events = new Map();
  }

  on(event, listener) {
    if (!this.events.has(event)) this.events.set(event, []);
    this.events.get(event).push(listener);
    return () => this.off(event, listener);
  }

  off(event, listener) {
    if (!this.events.has(event)) return;
    this.events.set(event, this.events.get(event).filter(l => l !== listener));
  }

  emit(event, ...args) {
    if (!this.events.has(event)) return false;
    this.events.get(event).forEach(fn => fn(...args));
    return true;
  }
}

const bus = new EventEmitter();

console.log("📡 Registering reactive OS listeners...");

// Listener 1: Terminal Logger
bus.on("system:status", (status) => {
  console.log(\`[Monitor] System status changed to: \${status.toUpperCase()}\`);
});

// Listener 2: Audio chime trigger
const unsubAudio = bus.on("system:status", (status) => {
  console.log(\`[AudioEngine] Playing notification chime for: \${status}\`);
});

// Listener 3: Notification Toast
bus.on("user:starred", ({ username, project }) => {
  console.log(\`[ActivityFeed] ⭐ \${username} starred '\${project}'!\`);
});

// Emit events
bus.emit("system:status", "online");
bus.emit("user:starred", { username: "Elena_Dev", project: "SandreaLee Salon" });

// Unsubscribe audio listener
unsubAudio();
console.log("Unsubscribed Audio listener. Emitting next event...");
bus.emit("system:status", "standby");
`
  },
  {
    id: "benchmarks",
    title: "Sorting & Search Benchmarks",
    category: "Algorithms & Performance",
    language: "javascript",
    description: "Benchmarks Linear Search O(N) vs Binary Search O(log N) across a 100,000 element sorted array.",
    code: `console.log("⏱️ Preparing 100,000 item benchmark array...");
const SIZE = 100000;
const array = Array.from({ length: SIZE }, (_, i) => i * 2);
const target = array[Math.floor(SIZE * 0.85)]; // target near the end

// Linear Search O(N)
function linearSearch(arr, val) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === val) return i;
  }
  return -1;
}

// Binary Search O(log N)
function binarySearch(arr, val) {
  let low = 0, high = arr.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (arr[mid] === val) return mid;
    if (arr[mid] < val) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}

// 1. Run Linear Search benchmark
const t0 = performance.now();
const linearIdx = linearSearch(array, target);
const t1 = performance.now();

// 2. Run Binary Search benchmark
const t2 = performance.now();
const binaryIdx = binarySearch(array, target);
const t3 = performance.now();

console.log(\`Target value: \${target}\`);
console.log(\`Linear Search index: \${linearIdx} (Duration: \${(t1 - t0).toFixed(4)} ms)\`);
console.log(\`Binary Search index: \${binaryIdx} (Duration: \${(t3 - t2).toFixed(4)} ms)\`);
console.log(\`🚀 Binary search is ~ \${Math.max(1, Math.round((t1 - t0) / Math.max(0.0001, t3 - t2)))}x faster!\`);
`
  },
  {
    id: "async-pool",
    title: "Async Concurrency Limiter",
    category: "Asynchronous Systems",
    language: "javascript",
    description: "Executes a batch of asynchronous tasks with a strict concurrency ceiling (e.g. rate-limited API calls).",
    code: `// Simulates an async HTTP request
const simulateRequest = (id, delay) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(\`Response for Request #\${id} (after \${delay}ms)\`);
    }, delay);
  });
};

async function asyncPool(limit, tasks) {
  const results = [];
  const executing = new Set();

  for (const [index, task] of tasks.entries()) {
    const p = Promise.resolve().then(() => task(index + 1)).then(res => {
      executing.delete(p);
      return res;
    });
    results.push(p);
    executing.add(p);

    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }

  return Promise.all(results);
}

console.log("🚦 Dispatching 6 async jobs with max concurrency = 2...");
const jobs = [
  (id) => simulateRequest(id, 60),
  (id) => simulateRequest(id, 40),
  (id) => simulateRequest(id, 80),
  (id) => simulateRequest(id, 50),
  (id) => simulateRequest(id, 70),
  (id) => simulateRequest(id, 30),
];

asyncPool(2, jobs).then(results => {
  console.log("✅ All pool tasks completed:");
  results.forEach(r => console.log("  ->", r));
});
`
  }
];

