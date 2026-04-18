'use client';

export function Sparkline({
  values,
  height = 40,
  stroke = '#f97316',
  fill = 'rgba(249, 115, 22, 0.12)',
}: {
  values: number[];
  height?: number;
  stroke?: string;
  fill?: string;
}) {
  if (!values || values.length === 0) {
    return <div style={{ height, opacity: 0.3, fontSize: 11, color: 'var(--color-text-secondary)' }}>—</div>;
  }
  const w = 200;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = values.length > 1 ? w / (values.length - 1) : 0;
  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = height - 4 - ((v - min) / range) * (height - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const path = `M ${points.join(' L ')}`;
  const area = `${path} L ${w},${height} L 0,${height} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" width="100%" height={height}>
      <path d={area} fill={fill} />
      <path d={path} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={(values.length - 1) * stepX} cy={height - 4 - ((values[values.length - 1] - min) / range) * (height - 8)} r={3} fill={stroke} />
    </svg>
  );
}

export function pctChange(values: number[]): { delta: number; label: string } | null {
  if (values.length < 2) return null;
  const first = values[0];
  const last = values[values.length - 1];
  if (first === 0) return last > 0 ? { delta: 1, label: '+∞' } : null;
  const pct = (last - first) / first;
  const sign = pct >= 0 ? '+' : '';
  return { delta: pct, label: `${sign}${Math.round(pct * 100)}%` };
}
