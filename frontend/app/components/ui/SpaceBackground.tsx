"use client";
import { useEffect, useRef } from "react";

export default function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const stars = Array.from({ length: 180 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.2,
      alpha: Math.random() * 0.6 + 0.1,
      speed: Math.random() * 0.004 + 0.001,
      phase: Math.random() * Math.PI * 2,
    }));

    const orbs = [
      { x: 0.15, y: 0.3, r: 280, color: "rgba(124,58,237,0.07)" },
      { x: 0.8, y: 0.6, r: 220, color: "rgba(232,121,249,0.05)" },
      { x: 0.5, y: 0.85, r: 200, color: "rgba(56,189,248,0.04)" },
    ];

    let raf: number;
    let t = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const bg = ctx.createRadialGradient(canvas.width * 0.2, canvas.height * 0.4, 0, canvas.width * 0.5, canvas.height * 0.5, canvas.width);
      bg.addColorStop(0, "#0d0824");
      bg.addColorStop(0.5, "#07050f");
      bg.addColorStop(1, "#03020a");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const orb of orbs) {
        const grad = ctx.createRadialGradient(orb.x * canvas.width, orb.y * canvas.height, 0, orb.x * canvas.width, orb.y * canvas.height, orb.r);
        grad.addColorStop(0, orb.color);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(orb.x * canvas.width, orb.y * canvas.height, orb.r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const star of stars) {
        const flicker = Math.sin(t * star.speed * 60 + star.phase) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${star.alpha * flicker})`;
        ctx.fill();
      }

      t += 0.016;
      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      aria-hidden="true"
    />
  );
}
