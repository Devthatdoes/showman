"use client";

import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

export default function FluidBackground() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: any) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Use springs for a "heavy", organic feel to the movement
  const smoothX = useSpring(mousePos.x, { stiffness: 50, damping: 20 });
  const smoothY = useSpring(mousePos.y, { stiffness: 50, damping: 20 });

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
