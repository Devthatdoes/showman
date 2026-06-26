"use client";

import { useEffect, useRef } from "react";

export default function FluidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let animationFrame = 0;
    const pointer = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.35 };

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const gradient = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 600);
      gradient.addColorStop(0, "rgba(255, 106, 0, 0.15)");
      gradient.addColorStop(1, "rgba(22, 22, 22, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      animationFrame = requestAnimationFrame(draw);
    };

    const handlePointer = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      document.documentElement.style.setProperty("--raw-pointer-x", `${event.clientX}px`);
      document.documentElement.style.setProperty("--raw-pointer-y", `${event.clientY}px`);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointer);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointer);
    };
  }, []);

  return <canvas ref={canvasRef} className="raw-fluid-bg" aria-hidden="true" />;
}
