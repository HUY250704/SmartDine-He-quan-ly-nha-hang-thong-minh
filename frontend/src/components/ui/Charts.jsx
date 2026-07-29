import React from "react";

// Bar Chart dùng SVG thuần
export function BarChart({ data, width = 600, height = 200, color = "#ffc174" }) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-48 text-on-surface-variant/40 text-sm">No data</div>;
  }

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.max((width - 40) / data.length - 8, 8);
  const chartH = height - 30;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      {data.map((d, i) => {
        const barH = (d.value / maxVal) * chartH;
        const x = 30 + i * ((width - 40) / data.length) + ((width - 40) / data.length - barWidth) / 2;
        const y = chartH - barH + 5;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={barH} rx="4" fill={color} opacity="0.85">
              <animate attributeName="height" from="0" to={barH} dur="0.6s" begin={`${i * 0.08}s`} fill="freeze" />
              <animate attributeName="y" from={chartH + 5} to={y} dur="0.6s" begin={`${i * 0.08}s`} fill="freeze" />
            </rect>
            <text x={x + barWidth / 2} y={height - 8} textAnchor="middle" fill="rgba(216,195,173,0.6)" fontSize="10" fontFamily="monospace">
              {d.label}
            </text>
          </g>
        );
      })}
      {/* baseline */}
      <line x1="25" y1={chartH + 5} x2={width - 10} y2={chartH + 5} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
    </svg>
  );
}

// Line Chart dùng SVG thuần
export function LineChart({ data, width = 600, height = 200, color = "#56e5a9" }) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-48 text-on-surface-variant/40 text-sm">No data</div>;
  }

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const chartH = height - 30;
  const stepX = (width - 60) / (data.length - 1 || 1);

  const points = data
    .map((d, i) => {
      const x = 40 + i * stepX;
      const y = chartH - (d.value / maxVal) * chartH + 5;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `40,${chartH + 5} ${points} ${40 + (data.length - 1) * stepX},${chartH + 5}`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#lineGrad)" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => {
        const cx = 40 + i * stepX;
        const cy = chartH - (d.value / maxVal) * chartH + 5;
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r="4" fill={color} stroke="#0c1322" strokeWidth="2" />
            <text x={cx} y={height - 8} textAnchor="middle" fill="rgba(216,195,173,0.6)" fontSize="10" fontFamily="monospace">
              {d.label}
            </text>
          </g>
        );
      })}
      <line x1="35" y1={chartH + 5} x2={width - 10} y2={chartH + 5} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
    </svg>
  );
}

// Pie/Donut chart đơn giản
export function DonutChart({ data, width = 160, height = 160, colors = ["#ffc174", "#56e5a9", "#a78bfa", "#ffb690", "#60a5fa"] }) {
  if (!data || data.length === 0) return null;

  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(cx, cy) - 16;
  const innerRadius = radius * 0.6;

  let cumulativeAngle = -90;

  const toRad = (deg) => (deg * Math.PI) / 180;

  const slices = data.map((d, i) => {
    const sliceAngle = (d.value / total) * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += sliceAngle;

    const x1 = cx + radius * Math.cos(toRad(startAngle));
    const y1 = cy + radius * Math.sin(toRad(startAngle));
    const x2 = cx + radius * Math.cos(toRad(startAngle + sliceAngle));
    const y2 = cy + radius * Math.sin(toRad(startAngle + sliceAngle));
    const ix1 = cx + innerRadius * Math.cos(toRad(startAngle + sliceAngle));
    const iy1 = cy + innerRadius * Math.sin(toRad(startAngle + sliceAngle));
    const ix2 = cx + innerRadius * Math.cos(toRad(startAngle));
    const iy2 = cy + innerRadius * Math.sin(toRad(startAngle));

    const largeArc = sliceAngle > 180 ? 1 : 0;

    return {
      path: `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2} Z`,
      color: colors[i % colors.length],
      label: d.label,
      value: d.value,
      percent: Math.round((d.value / total) * 100),
    };
  });

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {slices.map((s, i) => (
        <path key={i} d={s.path} fill={s.color} stroke="#0c1322" strokeWidth="2">
          <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin={`${i * 0.1}s`} fill="freeze" />
        </path>
      ))}
      <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">{total}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(216,195,173,0.5)" fontSize="10">Total</text>
    </svg>
  );
}
