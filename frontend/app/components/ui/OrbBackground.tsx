"use client";

import { useEffect, useRef } from "react";

export default function OrbBackground() {
  const o1 = useRef<HTMLDivElement>(null);
  const o2 = useRef<HTMLDivElement>(null);
  const o3 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf: number;
    let mx = 0, my = 0, cx = 0, cy = 0;
    const onMove = (e: MouseEvent) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 20;
      my = (e.clientY / window.innerHeight - 0.5) * 14;
    };
    const tick = () => {
      cx += (mx - cx) * 0.018;
      cy += (my - cy) * 0.018;
      if (o1.current) o1.current.style.transform = `translate(${cx * 0.5}px,${cy * 0.5}px)`;
      if (o2.current) o2.current.style.transform = `translate(${-cx * 0.3}px,${-cy * 0.3}px)`;
      if (o3.current) o3.current.style.transform = `translate(${cx * 0.6}px,${cy * 0.2}px)`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);

  const base: React.CSSProperties = {
    position: "absolute", borderRadius: "50%", filter: "blur(52px)",
    pointerEvents: "none", transition: "transform 0.1s linear",
  };

  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
      <div ref={o1} style={{ ...base, width: "680px", height: "680px", top: "-260px", left: "-200px",
        background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
        animation: "orbDrift1 90s ease-in-out infinite" }} />
      <div ref={o2} style={{ ...base, width: "560px", height: "560px", bottom: "-180px", right: "-140px",
        background: "radial-gradient(circle, rgba(109,40,217,0.06) 0%, transparent 70%)",
        animation: "orbDrift2 110s ease-in-out infinite" }} />
      <div ref={o3} style={{ ...base, width: "380px", height: "380px", top: "35%", left: "58%",
        background: "radial-gradient(circle, rgba(196,181,253,0.05) 0%, transparent 70%)",
        animation: "orbDrift3 130s ease-in-out infinite" }} />
    </div>
  );
}
