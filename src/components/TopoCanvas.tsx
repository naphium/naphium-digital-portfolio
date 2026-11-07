import { useEffect, useRef } from "react";

export function TopoCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    let raf = 0;
    const css = getComputedStyle(document.documentElement);
    const line = css.getPropertyValue("--accent").trim() || "#4A6E8D";
    const ice = css.getPropertyValue("--muted-foreground").trim() || "#A4C8E1";
    const resize = () => {
      c.width = innerWidth * devicePixelRatio;
      c.height = innerHeight * devicePixelRatio;
    };
    resize();
    addEventListener("resize", resize);
    const h = (x: number, y: number, t: number) =>
      Math.sin(x * 0.004 + t) * 0.5 + Math.cos(y * 0.005 - t * 0.7) * 0.5 + Math.sin((x + y) * 0.003 + t * 0.4) * 0.6;
    const draw = (ms: number) => {
      const t = ms * 0.00008;
      const W = c.width, H = c.height, d = devicePixelRatio;
      ctx.clearRect(0, 0, W, H);
      // grid
      ctx.globalAlpha = 0.14;
      ctx.strokeStyle = line;
      ctx.lineWidth = 1;
      const g = 64 * d;
      ctx.beginPath();
      for (let x = 0; x < W; x += g) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
      for (let y = 0; y < H; y += g) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
      ctx.stroke();
      // contours (marching dots approximation)
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = line;
      const s = 7 * d;
      for (let y = 0; y < H; y += s) {
        for (let x = 0; x < W; x += s) {
          const v = h(x / d, y / d, t) * 6;
          if (Math.abs(v - Math.round(v)) < 0.06) ctx.fillRect(x, y, 1.4 * d, 1.4 * d);
        }
      }
      // crosshairs + coordinates
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = ice;
      ctx.fillStyle = ice;
      ctx.font = `${10 * d}px JetBrains Mono, monospace`;
      for (let x = g * 2; x < W; x += g * 4) {
        for (let y = g * 2; y < H; y += g * 4) {
          ctx.beginPath();
          ctx.moveTo(x - 6 * d, y); ctx.lineTo(x + 6 * d, y);
          ctx.moveTo(x, y - 6 * d); ctx.lineTo(x, y + 6 * d);
          ctx.stroke();
          const lat = (24.3739 + (y / H - 0.5) * 0.02).toFixed(4);
          const lng = (88.6011 + (x / W - 0.5) * 0.02).toFixed(4);
          ctx.globalAlpha = 0.25;
          ctx.fillText(`${lat}N ${lng}E`, x + 8 * d, y - 6 * d);
          ctx.globalAlpha = 0.5;
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />;
}
