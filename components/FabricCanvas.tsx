"use client";

import { useEffect, useRef } from "react";

// Animated spine-leaf network fabric: every leaf switch connects to every
// spine, and packets travel leaf -> spine -> leaf. Hover a switch to light up
// its links. Colours come from CSS variables so the design tokens stay in CSS.

const SPINES = 3;
const LEAVES = 6;
const PACKETS = 12;

type Point = { x: number; y: number };
type Packet = { from: number; via: number; to: number; t: number; speed: number };
type Hover = { kind: "spine" | "leaf"; index: number } | null;

function newPacket(): Packet {
  const from = Math.floor(Math.random() * LEAVES);
  let to = Math.floor(Math.random() * (LEAVES - 1));
  if (to >= from) to += 1; // never route back to the source leaf
  return { from, to, via: Math.floor(Math.random() * SPINES), t: 0, speed: 0.006 + Math.random() * 0.006 };
}

export default function FabricCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const css = getComputedStyle(canvas);
    const colour = {
      line: css.getPropertyValue("--fab-line"),
      hot: css.getPropertyValue("--fab-hot"),
      packet: css.getPropertyValue("--fab-packet"),
      node: css.getPropertyValue("--fab-node"),
    };
    const packets: Packet[] = Array.from({ length: PACKETS }, () => ({ ...newPacket(), t: Math.random() * 2 }));
    let spines: Point[] = [];
    let leaves: Point[] = [];
    let hovered: Hover = null;
    let frame = 0;

    const layout = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      spines = Array.from({ length: SPINES }, (_, i) => ({ x: (width * (i + 1)) / (SPINES + 1), y: height * 0.22 }));
      leaves = Array.from({ length: LEAVES }, (_, i) => ({ x: (width * (i + 0.5)) / LEAVES, y: height * 0.8 }));
    };

    const drawNode = (pt: Point, width: number, lit: boolean) => {
      ctx.fillStyle = lit ? colour.hot : colour.node;
      ctx.strokeStyle = colour.line;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(pt.x - width / 2, pt.y - 11, width, 22, 6);
      ctx.fill();
      ctx.stroke();
    };

    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);

      for (let l = 0; l < LEAVES; l++) {
        for (let s = 0; s < SPINES; s++) {
          const lit = hovered !== null && (hovered.kind === "leaf" ? hovered.index === l : hovered.index === s);
          ctx.strokeStyle = lit ? colour.hot : colour.line;
          ctx.globalAlpha = lit ? 1 : 0.45;
          ctx.lineWidth = lit ? 2.5 : 1.5;
          ctx.beginPath();
          ctx.moveTo(leaves[l].x, leaves[l].y);
          ctx.lineTo(spines[s].x, spines[s].y);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = colour.packet;
      for (const p of packets) {
        // t runs 0..1 on the uplink and 1..2 on the downlink
        const [a, b, k] = p.t < 1 ? [leaves[p.from], spines[p.via], p.t] : [spines[p.via], leaves[p.to], p.t - 1];
        ctx.beginPath();
        ctx.arc(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k, 5, 0, Math.PI * 2);
        ctx.fill();
        p.t += p.speed;
        if (p.t >= 2) Object.assign(p, newPacket());
      }

      spines.forEach((pt, i) => drawNode(pt, 64, hovered?.kind === "spine" && hovered.index === i));
      leaves.forEach((pt, i) => drawNode(pt, 40, hovered?.kind === "leaf" && hovered.index === i));

      if (!reducedMotion) frame = requestAnimationFrame(draw);
    };

    // With reduced motion there is no animation loop, so redraw on demand.
    const redrawIfStatic = () => {
      if (reducedMotion) draw();
    };
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const near = (pt: Point) => Math.hypot(pt.x - (e.clientX - rect.left), pt.y - (e.clientY - rect.top)) < 34;
      const s = spines.findIndex(near);
      const l = leaves.findIndex(near);
      hovered = s >= 0 ? { kind: "spine", index: s } : l >= 0 ? { kind: "leaf", index: l } : null;
      redrawIfStatic();
    };
    const onLeave = () => {
      hovered = null;
      redrawIfStatic();
    };
    const onResize = () => {
      layout();
      redrawIfStatic();
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
