"use client";

import { useEffect, useState } from "react";

// A browser port of gateway/token_bucket.lua from the api-gateway project:
// refill by elapsed time, cap at capacity, then spend one token or reject with
// a Retry-After. In the gateway this runs atomically inside Redis; here every
// request is handled in one synchronous call, which gives the same guarantee.

const PLANS = [
  { id: "anonymous", label: "Anonymous", capacity: 5 },
  { id: "free", label: "Free", capacity: 10 },
  { id: "pro", label: "Pro", capacity: 100 },
] as const;

type PlanId = (typeof PLANS)[number]["id"];
type Bucket = { tokens: number; ts: number };
type Verdict = { allowed: boolean; tokens: number; retryAfter: number };
type Cell = { allowed: boolean; order: number };

const BURST = 200;
const WINDOW_SECONDS = 60;

/** The Lua script, line for line: returns the verdict and the bucket's next state. */
function take(bucket: Bucket, now: number, capacity: number, rate: number): [Verdict, Bucket] {
  const elapsed = Math.max(0, now - bucket.ts);
  let tokens = Math.min(capacity, bucket.tokens + elapsed * rate);
  let allowed = false;
  let retryAfter = 0;
  if (tokens >= 1) {
    tokens -= 1;
    allowed = true;
  } else {
    retryAfter = (1 - tokens) / rate;
  }
  return [{ allowed, tokens, retryAfter }, { tokens, ts: now }];
}

const seconds = () => Date.now() / 1000;

export default function TokenBucketDemo() {
  const [planId, setPlanId] = useState<PlanId>("free");
  const plan = PLANS.find((p) => p.id === planId)!;
  const rate = plan.capacity / WINDOW_SECONDS;

  const [bucket, setBucket] = useState<Bucket>({ tokens: plan.capacity, ts: 0 });
  const [now, setNow] = useState(0);
  const [cells, setCells] = useState<Cell[] | null>(null);
  const [summary, setSummary] = useState("No requests sent yet.");
  const [burstId, setBurstId] = useState(0);

  const level = Math.min(plan.capacity, bucket.tokens + Math.max(0, now - bucket.ts) * rate);
  const full = level >= plan.capacity;

  // Tick the clock only while the bucket is refilling.
  useEffect(() => {
    if (full) return;
    const timer = setInterval(() => setNow(seconds()), 200);
    return () => clearInterval(timer);
  }, [full]);

  const choosePlan = (id: PlanId) => {
    const next = PLANS.find((p) => p.id === id)!;
    setPlanId(id);
    setBucket({ tokens: next.capacity, ts: seconds() });
    setCells(null);
    setSummary("No requests sent yet.");
  };

  const sendOne = () => {
    const t = seconds();
    const [verdict, next] = take(bucket, t, plan.capacity, rate);
    setBucket(next);
    setNow(t);
    setCells(null);
    setSummary(
      verdict.allowed
        ? `HTTP 200 · X-RateLimit-Remaining: ${Math.floor(verdict.tokens)}`
        : `HTTP 429 · Retry-After: ${Math.ceil(verdict.retryAfter)} s`,
    );
  };

  const sendBurst = () => {
    const t = seconds();
    // Concurrent requests arrive in an arbitrary order. Which ones win is luck; how many win is not.
    const arrival = Array.from({ length: BURST }, (_, i) => i);
    for (let i = arrival.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arrival[i], arrival[j]] = [arrival[j], arrival[i]];
    }
    let state = bucket;
    let passed = 0;
    const next: Cell[] = new Array(BURST);
    arrival.forEach((cellIndex, order) => {
      const [verdict, after] = take(state, t, plan.capacity, rate);
      state = after;
      if (verdict.allowed) passed += 1;
      next[cellIndex] = { allowed: verdict.allowed, order };
    });
    setBucket(state);
    setNow(t);
    setCells(next);
    setBurstId((id) => id + 1);
    setSummary(`${BURST} sent at once · HTTP 200: ${passed} · HTTP 429: ${BURST - passed}`);
  };

  const reset = () => {
    setBucket({ tokens: plan.capacity, ts: seconds() });
    setCells(null);
    setSummary("Bucket refilled.");
  };

  const untilNext = full ? 0 : (Math.floor(level) + 1 - level) / rate;

  return (
    <section className="console bucket" aria-label="Token bucket rate limiter demo">
      <header className="console-bar">
        <span className="console-title">
          <span className="dot" aria-hidden="true" />
          live demo
        </span>
        <span className="console-meta">token bucket · per-minute limit</span>
      </header>

      <div className="bucket-body">
        <fieldset className="segmented">
          <legend className="sr-only">Plan</legend>
          {PLANS.map((p) => (
            <label key={p.id}>
              <input type="radio" name="plan" checked={p.id === planId} onChange={() => choosePlan(p.id)} />
              <span>
                {p.label} <b>{p.capacity}</b>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="meter">
          <div className="meter-head">
            <span>tokens</span>
            <span className="meter-value">
              {level.toFixed(1)} <i>/ {plan.capacity}</i>
            </span>
          </div>
          <div
            className="meter-track"
            role="meter"
            aria-label="Tokens in the bucket"
            aria-valuemin={0}
            aria-valuemax={plan.capacity}
            aria-valuenow={Math.floor(level)}
          >
            <span style={{ width: `${(level / plan.capacity) * 100}%` }} />
          </div>
          <p className="meter-foot">{full ? "Bucket full." : `Next token in ${untilNext.toFixed(1)} s.`}</p>
        </div>

        <div className="bucket-actions">
          <button type="button" className="btn btn-accent" onClick={sendBurst}>
            Send {BURST} at once
          </button>
          <button type="button" className="btn" onClick={sendOne}>
            Send 1
          </button>
          <button type="button" className="btn btn-quiet" onClick={reset} disabled={full}>
            Refill
          </button>
        </div>

        <div className={`burst${cells ? " is-live" : ""}`} key={burstId} aria-hidden="true">
          {Array.from({ length: BURST }, (_, i) => {
            const cell = cells?.[i];
            return (
              <i
                key={i}
                className={cell ? (cell.allowed ? "ok" : "no") : undefined}
                style={cell ? { animationDelay: `${cell.order * 3}ms` } : undefined}
              />
            );
          })}
        </div>

        <p className="bucket-summary" role="status">
          {summary}
        </p>
      </div>

      <p className="console-note">
        The same algorithm as the gateway&apos;s{" "}
        <a href="https://github.com/HemanthAce19/api-gateway/blob/main/gateway/token_bucket.lua">token_bucket.lua</a>, ported
        to TypeScript. Fire it again before the bucket refills.
      </p>
    </section>
  );
}
