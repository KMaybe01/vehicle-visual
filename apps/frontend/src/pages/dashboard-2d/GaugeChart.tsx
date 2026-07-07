import { useEffect, useRef } from 'react';

interface GaugeChartProps {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  color: string;
}

export default function GaugeChart({ label, value, unit, min, max, color }: GaugeChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastValueRef = useRef<number | null>(null);
  const lastColorRef = useRef<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rounded = Math.round(value);
    const prevRounded = lastValueRef.current;
    const colorChanged = lastColorRef.current !== color;
    lastValueRef.current = rounded;
    lastColorRef.current = color;

    const dpr = window.devicePixelRatio || 1;
    const size = canvas.clientWidth;

    if (rounded === prevRounded && !colorChanged && canvas.width === size * dpr) {
      return;
    }

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2 + 10;
    const radius = size / 2 - 20;
    const startAngle = Math.PI * 0.75;
    const endAngle = Math.PI * 2.25;
    const range = max - min;
    const ratio = Math.max(0, Math.min(1, (value - min) / range));

    ctx.clearRect(0, 0, size, size);

    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.stroke();

    const currentAngle = startAngle + (endAngle - startAngle) * ratio;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, currentAngle);
    ctx.strokeStyle = color;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.font = `bold ${size * 0.13}px -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(rounded.toString(), cx, cy - 4);

    ctx.fillStyle = '#64748b';
    ctx.font = `${size * 0.06}px -apple-system, sans-serif`;
    ctx.fillText(unit, cx, cy + size * 0.11);
  }, [value, min, max, color, unit]);

  return (
    <div className="card">
      <div className="card-title">{label}</div>
      <canvas ref={canvasRef} style={{ width: '100%', aspectRatio: '1' }} />
    </div>
  );
}
