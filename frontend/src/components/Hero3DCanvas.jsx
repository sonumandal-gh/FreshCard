import React, { useEffect, useRef } from 'react';

/**
 * Hero3DCanvas
 * An interactive, lightweight WebGL-style 3D wave and floating produce particle canvas
 * with depth, lighting effects, and subtle cursor interaction.
 */
const Hero3DCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = canvas.parentElement.offsetWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement.offsetHeight || 600);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.offsetWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement.offsetHeight || 600;
    };
    window.addEventListener('resize', handleResize);

    // Mouse coordinates for subtle 3D parallax
    let mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Floating 3D Produce & Light Orbs
    const orbs = [
      { x: width * 0.15, y: height * 0.25, radius: 45, color: '#16a34a', speed: 0.008, phase: 0, amp: 25 },
      { x: width * 0.85, y: height * 0.35, radius: 55, color: '#f59e0b', speed: 0.006, phase: 2, amp: 30 },
      { x: width * 0.70, y: height * 0.75, radius: 38, color: '#10b981', speed: 0.01, phase: 4, amp: 20 },
      { x: width * 0.25, y: height * 0.80, radius: 30, color: '#ea580c', speed: 0.007, phase: 1.5, amp: 18 },
      { x: width * 0.50, y: height * 0.15, radius: 25, color: '#22c55e', speed: 0.012, phase: 3, amp: 15 },
    ];

    // Wave points for 3D ribbon
    const numPoints = 28;
    let step = 0;

    const render = () => {
      step += 0.02;
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw glowing ambient light circles (depth)
      orbs.forEach((orb) => {
        const floatY = orb.y + Math.sin(step * orb.speed * 100 + orb.phase) * orb.amp;
        const floatX = orb.x + Math.cos(step * orb.speed * 80 + orb.phase) * (orb.amp * 0.6);
        
        // Parallax offset
        const parallaxX = (mouse.x - width / 2) * 0.03;
        const parallaxY = (mouse.y - height / 2) * 0.03;

        const grad = ctx.createRadialGradient(
          floatX + parallaxX,
          floatY + parallaxY,
          orb.radius * 0.1,
          floatX + parallaxX,
          floatY + parallaxY,
          orb.radius * 2.2
        );

        grad.addColorStop(0, `${orb.color}35`);
        grad.addColorStop(0.5, `${orb.color}15`);
        grad.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(floatX + parallaxX, floatY + parallaxY, orb.radius * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      });

      // 2. Draw 3D curved waves / dynamic ribbon
      const waves = [
        { amp: 45, freq: 0.003, speed: 0.015, color: 'rgba(22, 163, 74, 0.06)', yOffset: height * 0.55 },
        { amp: 35, freq: 0.004, speed: 0.02, color: 'rgba(245, 158, 11, 0.05)', yOffset: height * 0.65 },
        { amp: 55, freq: 0.0025, speed: 0.01, color: 'rgba(34, 197, 94, 0.08)', yOffset: height * 0.48 }
      ];

      waves.forEach(w => {
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(0, w.yOffset);

        for (let x = 0; x <= width; x += width / numPoints) {
          const y = w.yOffset + Math.sin(x * w.freq + step * 2 + (mouse.x * 0.001)) * w.amp;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fillStyle = w.color;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.85
      }}
    />
  );
};

export default Hero3DCanvas;
