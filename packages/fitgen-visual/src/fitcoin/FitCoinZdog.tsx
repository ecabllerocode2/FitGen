/// <reference path="../zdog.d.ts" />
import { useEffect, useRef } from 'react';
import Zdog from 'zdog';

type FitCoinZdogCanvasProps = {
  size?: number;
  spin?: boolean;
  className?: string;
};

/** 3D spinning FitCoin with dumbbell — for hero / celebration sizes (48px+). */
export function FitCoinZdogCanvas({ size = 64, spin = true, className }: FitCoinZdogCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = size * 2;
    canvas.height = size * 2;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const illo = new Zdog.Illustration({
      element: canvas,
      resize: false,
      zoom: 1.8,
    });

    const coinGroup = new Zdog.Group({ addTo: illo });

    // Coin disc (edge)
    new Zdog.Ellipse({
      addTo: coinGroup,
      diameter: 40,
      stroke: 8,
      color: '#65A30D',
      translate: { z: 0 },
    });

    // Face
    new Zdog.Ellipse({
      addTo: coinGroup,
      diameter: 36,
      stroke: 36,
      color: '#BEF264',
      translate: { z: 1 },
    });

    // Inner ring
    new Zdog.Ellipse({
      addTo: coinGroup,
      diameter: 28,
      stroke: 1.5,
      color: '#84CC16',
      translate: { z: 2 },
    });

    // Dumbbell bar
    new Zdog.Rect({
      addTo: coinGroup,
      width: 22,
      height: 3,
      stroke: 3,
      color: '#365314',
      translate: { z: 3 },
    });

    // Plates
    [-1, 1].forEach((side) => {
      new Zdog.Rect({
        addTo: coinGroup,
        width: 4,
        height: 10,
        stroke: 4,
        color: '#3F6212',
        translate: { x: side * 11, z: 3 },
      });
      new Zdog.Rect({
        addTo: coinGroup,
        width: 2.5,
        height: 7,
        stroke: 2.5,
        color: '#1A2E05',
        translate: { x: side * 13, z: 3.5 },
      });
    });

    let frameId = 0;
    let alive = true;

    const tick = () => {
      if (!alive) return;
      if (spin) {
        coinGroup.rotate.y += 0.025;
      }
      illo.updateRenderGraph();
      frameId = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      alive = false;
      cancelAnimationFrame(frameId);
    };
  }, [size, spin]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden
      style={{ display: 'block' }}
    />
  );
}
