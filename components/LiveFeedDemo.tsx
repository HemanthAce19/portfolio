"use client";

import { useEffect, useRef, useState } from "react";

// A browser-sized version of the market-pipeline project. It reads the same
// public Coinbase trade feed, shows ticks as they arrive, and recomputes
// rolling metrics once a second over at most five minutes of trades. Like the
// real ingestor it reconnects with backoff, treats a silent feed as dead, and
// skips replayed trades. It only holds a connection while it is on screen.

const FEED = "wss://ws-feed.exchange.coinbase.com";
const SYMBOL = "BTC-USD";
const WINDOW_MS = 5 * 60 * 1000;
const SILENT_MS = 10_000;
const MAX_BACKOFF_S = 30;
const TAPE_ROWS = 5;

type Trade = { id: number; t: number; price: number; size: number };
type TapeRow = Trade & { up: boolean | null };
type Status = "idle" | "connecting" | "live" | "reconnecting" | "paused";
type Metrics = { vwap: number; high: number; low: number; trades: number; windowMs: number };

const money = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const clock = (t: number) => new Date(t).toLocaleTimeString("en-GB", { hour12: false });

export default function LiveFeedDemo() {
  const rootRef = useRef<HTMLElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [retryIn, setRetryIn] = useState(0);
  const [last, setLast] = useState<{ price: number; up: boolean | null } | null>(null);
  const [tape, setTape] = useState<TapeRow[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [series, setSeries] = useState<number[]>([]);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let socket: WebSocket | null = null;
    let onScreen = false;
    let attempt = 0;
    let lastMessageAt = 0;
    let lastTradeId = 0;
    let startedAt = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let countdownTimer: ReturnType<typeof setInterval> | undefined;
    let trades: Trade[] = [];
    let pendingTape: TapeRow[] = [];
    let closes: number[] = [];
    let latest: { price: number; up: boolean | null } | null = null;

    const wanted = () => onScreen && !paused && document.visibilityState === "visible";

    const clearTimers = () => {
      clearTimeout(retryTimer);
      clearInterval(countdownTimer);
    };

    const disconnect = () => {
      clearTimers();
      if (!socket) return;
      socket.onopen = socket.onmessage = socket.onclose = socket.onerror = null;
      socket.close();
      socket = null;
    };

    const scheduleReconnect = () => {
      disconnect();
      if (!wanted()) return;
      let wait = Math.min(MAX_BACKOFF_S, 2 ** attempt);
      attempt += 1;
      setStatus("reconnecting");
      setRetryIn(wait);
      countdownTimer = setInterval(() => setRetryIn((wait = Math.max(0, wait - 1))), 1000);
      retryTimer = setTimeout(connect, wait * 1000);
    };

    function connect() {
      disconnect();
      if (!wanted()) return;
      // A gap would distort the rolling window, so every connection starts a fresh one.
      trades = [];
      closes = [];
      pendingTape = [];
      latest = null;
      startedAt = 0;
      setStatus("connecting");

      const ws = new WebSocket(FEED);
      socket = ws;
      lastMessageAt = Date.now();
      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "subscribe", product_ids: [SYMBOL], channels: ["matches", "heartbeat"] }));
      };
      ws.onmessage = (event) => {
        lastMessageAt = Date.now();
        let message: { type?: string; trade_id?: number; price?: string; size?: string; time?: string };
        try {
          message = JSON.parse(event.data);
        } catch {
          return;
        }
        if (message.type !== "match" && message.type !== "last_match") return;
        const id = Number(message.trade_id);
        const price = Number(message.price);
        const size = Number(message.size);
        if (!Number.isFinite(price) || !Number.isFinite(size) || !Number.isFinite(id)) return;
        if (id <= lastTradeId) return; // replayed trade
        lastTradeId = id;
        attempt = 0;

        const up = latest === null || price === latest.price ? null : price > latest.price;
        latest = { price, up: up ?? latest?.up ?? null };
        // "last_match" is the trade before we subscribed: good for a starting price, not part of our window.
        if (message.type === "last_match") return;
        const trade = { id, t: Date.parse(message.time ?? "") || Date.now(), price, size };
        if (!startedAt) startedAt = trade.t;
        trades.push(trade);
        pendingTape.unshift({ ...trade, up });
        if (pendingTape.length > TAPE_ROWS) pendingTape.length = TAPE_ROWS;
      };
      ws.onclose = scheduleReconnect;
      ws.onerror = scheduleReconnect;
    }

    // Ticks reach the screen quickly; metrics are recomputed on a slower, fixed beat.
    const paint = setInterval(() => {
      if (!socket || !latest) return;
      setStatus("live");
      setLast(latest);
      if (pendingTape.length) {
        const fresh = pendingTape;
        pendingTape = [];
        setTape((rows) => [...fresh, ...rows].slice(0, TAPE_ROWS));
      }
    }, 250);

    const compute = setInterval(() => {
      if (!socket) return;
      const nowMs = Date.now();
      if (nowMs - lastMessageAt > SILENT_MS) return scheduleReconnect(); // silent feed
      const cutoff = nowMs - WINDOW_MS;
      while (trades.length && trades[0].t < cutoff) trades.shift();
      if (!trades.length || !latest) return setMetrics(null);

      let notional = 0;
      let volume = 0;
      let high = -Infinity;
      let low = Infinity;
      for (const { price, size } of trades) {
        notional += price * size;
        volume += size;
        if (price > high) high = price;
        if (price < low) low = price;
      }
      closes = [...closes, latest.price].slice(-WINDOW_MS / 1000);
      setSeries(closes);
      setMetrics({
        vwap: notional / volume,
        high,
        low,
        trades: trades.length,
        windowMs: Math.min(WINDOW_MS, nowMs - Math.max(startedAt, cutoff)),
      });
    }, 1000);

    const sync = () => {
      if (wanted()) {
        if (!socket) {
          attempt = 0;
          connect();
        }
      } else {
        disconnect();
        setStatus(paused ? "paused" : "idle");
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        sync();
      },
      { threshold: 0.2 },
    );
    observer.observe(root);
    document.addEventListener("visibilitychange", sync);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      clearInterval(paint);
      clearInterval(compute);
      disconnect();
    };
  }, [paused]);

  const statusText: Record<Status, string> = {
    idle: "starts when on screen",
    connecting: "connecting",
    live: "live",
    reconnecting: `feed lost · retrying in ${retryIn} s`,
    paused: "paused",
  };
  const showData = status === "live";

  return (
    <section className="console feed" aria-label="Live market data demo" ref={rootRef}>
      <header className="console-bar">
        <span className="console-title">
          <span className={`dot dot-${status}`} aria-hidden="true" />
          live demo
        </span>
        <span className="console-meta" role="status">
          {SYMBOL} · {statusText[status]}
        </span>
      </header>

      <div className="feed-body">
        <div className="feed-top">
          <p className="feed-last">
            <span className="feed-label">last trade, USD</span>
            <span className={`feed-price${last?.up === true ? " up" : last?.up === false ? " down" : ""}`}>
              {showData && last ? money(last.price) : "–"}
            </span>
          </p>
          <button type="button" className="btn btn-quiet" onClick={() => setPaused((p) => !p)} aria-pressed={paused}>
            {paused ? "Resume" : "Pause"}
          </button>
        </div>

        <Sparkline values={showData ? series : []} />

        <dl className="feed-metrics">
          <Metric label="VWAP" value={showData && metrics ? money(metrics.vwap) : null} />
          <Metric label="High" value={showData && metrics ? money(metrics.high) : null} />
          <Metric label="Low" value={showData && metrics ? money(metrics.low) : null} />
          <Metric label="Trades" value={showData && metrics ? metrics.trades.toLocaleString("en-US") : null} />
          <Metric label="Window" value={showData && metrics ? formatWindow(metrics.windowMs) : null} />
        </dl>

        <table className="feed-tape">
          <caption className="sr-only">Most recent trades</caption>
          <thead>
            <tr>
              <th scope="col">time</th>
              <th scope="col">price</th>
              <th scope="col">size, BTC</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: TAPE_ROWS }, (_, i) => {
              const row = showData ? tape[i] : undefined;
              return (
                <tr key={row?.id ?? `empty-${i}`} className={row ? (row.up === true ? "up" : row.up === false ? "down" : "") : "empty"}>
                  <td>{row ? clock(row.t) : "–"}</td>
                  <td>{row ? money(row.price) : "–"}</td>
                  <td>{row ? row.size.toFixed(8) : "–"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="console-note">
        Real trades from Coinbase&apos;s public feed, windowed in your browser. Metrics show a dash until there is data, never
        a misleading zero. The project does this with Redis Streams and Celery workers.
      </p>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd className={value === null ? "empty" : undefined}>{value ?? "–"}</dd>
    </div>
  );
}

function formatWindow(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")} / 5:00`;
}

function Sparkline({ values }: { values: number[] }) {
  const width = 300;
  const height = 56;
  if (values.length < 2) {
    return (
      <div className="feed-spark is-empty" aria-hidden="true">
        <span>collecting per-second closes</span>
      </div>
    );
  }
  // Give the range a floor of 0.02% of the price, so a one-cent move does not draw as a cliff.
  const lowest = Math.min(...values);
  const highest = Math.max(...values);
  const span = Math.max(highest - lowest, highest * 0.0002);
  const min = (highest + lowest) / 2 - span / 2;
  const step = width / (values.length - 1);
  const points = values
    .map((value, i) => `${(i * step).toFixed(1)},${(height - 4 - ((value - min) / span) * (height - 8)).toFixed(1)}`)
    .join(" ");
  return (
    <div className="feed-spark" aria-hidden="true">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <polygon className="spark-area" points={`0,${height} ${points} ${width},${height}`} />
        <polyline className="spark-line" points={points} />
      </svg>
    </div>
  );
}
