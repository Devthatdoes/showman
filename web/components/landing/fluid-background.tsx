"use client";

import React, { useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

export default function FluidBackground() {
  // Motion values instead of state: this component covers the whole landing
  // page, so a setState per mousemove would re-render the tree on every pixel.
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Use springs for a "heavy", organic feel to the movement
  const smoothX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      <motion.div
        className="absolute w-[80vw] h-[80vw] rounded-full blur-[120px] opacity-30"
        style={{
          backgroundColor: 'var(--raw-red)',
          left: useTransform(smoothX, (val) => `calc(${val}px - 40vw)`),
          top: useTransform(smoothY, (val) => `calc(${val}px - 40vw)`),
        }}
      />
      <div className="fixed inset-0 opacity-0.05 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
    </div>
  );
}
