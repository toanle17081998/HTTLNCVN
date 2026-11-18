import { performance } from "node:perf_hooks";

const targetUrl = process.env.TARGET_URL ?? "http://localhost:3001/api/health/live";
const requestsPerSecond = Number.parseInt(process.env.RPS ?? "100", 10);
const durationSeconds = Number.parseInt(process.env.DURATION_SECONDS ?? "30", 10);
const intervalMs = 100;
const requestsPerInterval = Math.max(1, Math.round(requestsPerSecond / (1000 / intervalMs)));
const latencies = [];
let completed = 0;
let failed = 0;
let launched = 0;
const active = new Set();

function request() {
  launched += 1;
  const start = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  const task = fetch(targetUrl, { signal: controller.signal })
    .then((response) => {
      if (!response.ok) failed += 1;
      return response.arrayBuffer();
    })
    .catch(() => { failed += 1; })
    .finally(() => {
      clearTimeout(timeout);
      completed += 1;
      latencies.push(performance.now() - start);
      active.delete(task);
    });
  active.add(task);
}

const startedAt = performance.now();
const timer = setInterval(() => {
  for (let index = 0; index < requestsPerInterval; index += 1) request();
}, intervalMs);

await new Promise((resolve) => setTimeout(resolve, durationSeconds * 1000));
clearInterval(timer);
await Promise.allSettled(active);

latencies.sort((left, right) => left - right);
const percentile = (value) => latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * value))] ?? 0;
const elapsedSeconds = (performance.now() - startedAt) / 1000;
const errorRate = completed ? failed / completed : 1;
const result = {
  achievedRps: Math.round((completed / elapsedSeconds) * 10) / 10,
  completed,
  errorRatePercent: Math.round(errorRate * 10_000) / 100,
  failed,
  launched,
  p50Ms: Math.round(percentile(0.5) * 10) / 10,
  p95Ms: Math.round(percentile(0.95) * 10) / 10,
  p99Ms: Math.round(percentile(0.99) * 10) / 10,
  targetRps: requestsPerSecond,
  targetUrl,
};

console.log(JSON.stringify(result, null, 2));
if (errorRate > 0.01 || result.p95Ms > 500) process.exitCode = 1;

