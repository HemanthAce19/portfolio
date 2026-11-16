"use client";

import { useEffect, useRef } from "react";

// Animated spine-leaf network fabric: every leaf switch connects to every
// spine, and packets travel leaf -> spine -> leaf. Hover a switch to light up
// its links.

const SPINES = 3;
const LEAVES = 6;
const PACKETS = 9;

type Point = { x: number; y: number };
type Packet = { from: number; via: number; to: number; t: number; speed: number };

function newPacket(): Packet {
  const from = Math.floor(Math.random() * LEAVES);
  let to = Math.floor(Math.random() * (LEAVES - 1));
  if (to >= from) to += 1; // never route back to the source leaf
  return {
    from,
    to,
    via: Math.floor(Math.random() * SPINES),
    t: 0,
    speed: 0.006 + Math.random() * 0.006,
  };
}

export default function FabricCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const packets = Array.from({ length: PACKETS }, () => ({ ...newPacket(), t: Math.random() * 2 }));
    let spines: Point[] = [];
    let leaves: Point[] = [];
    let hovered: { kind: "spine" | "leaf"; i: number } | null = null;
    let frame = 0;

    const layout = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      spines = Array.from({ length: SPINES }, (_, i) => ({ x: (width * (i + 1)) / (SPINES + 1), y: height * 0.2 }));
      leaves = Array.from({ length: LEAVES }, (_, i) => ({ x: (width * (i + 0.5)) / LEAVES, y: height * 0.8 }));
    };

    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const css = getComputedStyle(canvas);
      const line = css.getPropertyValue("--line");
      const accent = css.getPropertyValue("--accent");
      const surface = css.getPropertyValue("--surface");
      ctx.clearRect(0, 0, width, height);

      for (let l = 0; l < LEAVES; l++) {
        for (let s = 0; s < SPINES; s++) {
          const lit = hovered && (hovered.kind === "leaf" ? hovered.i === l : hovered.i === s);
          ctx.strokeStyle = lit ? accent : line;
          ctx.lineWidth = lit ? 1.5 : 1;
          ctx.beginPath();
          ctx.moveTo(leaves[l].x, leaves[l].y);
          ctx.lineTo(spines[s].x, spines[s].y);
          ctx.stroke();
        }
      }

      ctx.fillStyle = accent;
      for (const p of packets) {
        // t runs 0..1 on the uplink, 1..2 on the downlink
        const [a, b, k] = p.t < 1 ? [leaves[p.from], spines[p.via], p.t] : [spines[p.via], leaves[p.to], p.t - 1];
        ctx.beginPath();
        ctx.arc(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k, 3, 0, Math.PI * 2);
        ctx.fill();
        p.t += p.speed;
        if (p.t >= 2) Object.assign(p, newPacket());
      }

      const node = (pt: Point, w: number, lit: boolean) => {
        ctx.fillStyle = surface;
        ctx.strokeStyle = lit ? accent : line;
        ctx.lineWidth = lit ? 2 : 1.5;
        ctx.beginPath();
        ctx.roundRect(pt.x - w / 2, pt.y - 9, w, 18, 4);
        ctx.fill();
        ctx.stroke();
      };
      spines.forEach((pt, i) => node(pt, 54, hovered?.kind === "spine" && hovered.i === i));
      leaves.forEach((pt, i) => node(pt, 36, hovered?.kind === "leaf" && hovered.i === i));

      if (!reducedMotion) frame = requestAnimationFrame(draw);
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const near = (pt: Point) => Math.hypot(pt.x - x, pt.y - y) < 32;
      const s = spines.findIndex(near);
      const l = leaves.findIndex(near);
      hovered = s >= 0 ? { kind: "spine", i: s } : l >= 0 ? { kind: "leaf", i: l } : null;
      if (reducedMotion) draw();
    };
    const onLeave = () => {
      hovered = null;
      if (reducedMotion) draw();
    };
    const onResize = () => {
      layout();
      if (reducedMotion) draw();
    };

    layout();
    draw();
    window.addEventListener("resize", onResize);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} className="fabric" aria-hidden="true" />;
}
