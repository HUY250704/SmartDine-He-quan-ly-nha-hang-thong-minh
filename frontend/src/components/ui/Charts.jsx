import React, { useState, useEffect, useRef } from "react";

// ─── Bar Chart ───────────────────────────────────────────────
export function BarChart({ data, height = 280, color = "#56e5a9" }) {
  const containerRef = useRef(null);
  const [w, setW] = useState(700);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  if (!data || data.length === 0) {
    return (
      <div ref={containerRef} className="flex items-center justify-center text-on-surface-variant/40 text-sm" style={{ height }}>
        No data
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const padLeft = 56;
  const padRight = 24;
  const padTop = 32;
  const padBottom = 32;
  const chartW = Math.max(w, 400);
  const chartH = height;
  const innerH = chartH - padTop - padBottom;
  const innerW = chartW - padLeft - padRight;
  const barSlot = innerW / data.length;
  const barW = barSlot * 0.5;
  const barGap = barSlot - barW;
  const yTicks = 4;

  const formatValue = (v) =>
    v >= 1e9
      ? `${(v / 1e9).toFixed(1)} tỷ`
      : v >= 1e6
      ? `${(v / 1e6).toFixed(1)} tr`
      : v >= 1e3
      ? `${(v / 1e3).toFixed(1)}K`
      : `${Math.round(v).toLocaleString("vi-VN")}đ`;

  // Unique gradient IDs per instance
  const gid = useRef(Math.random().toString(36).slice(2)).current;

  return (
    <div ref={containerRef} className="relative w-full" style={{ height }}>
      <svg width="100%" height={height} viewBox={`0 0 ${chartW} ${chartH}`} className="overflow-visible">
        <defs>
          <linearGradient id={`barGrad-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id={`barGradH-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.55" />
          </linearGradient>
          <filter id={`barGlow-${gid}`} x="-100%" y="-30%" width="300%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
          </filter>
        </defs>

        {/* Grid lines */}
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const yy = padTop + (innerH / yTicks) * i;
          const val = Math.round(maxVal - (maxVal / yTicks) * i);
          return (
            <g key={i}>
              <line x1={padLeft} y1={yy} x2={chartW - padRight} y2={yy}
                stroke="rgba(255,255,255,0.05)" strokeWidth="1"
                strokeDasharray={i === yTicks ? "none" : "4 4"} />
              <text x={padLeft - 8} y={yy + 4} textAnchor="end"
                fill="rgba(216,195,173,0.35)" fontSize="11" fontFamily="Inter, sans-serif">
                {formatValue(val)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const barH = Math.max((d.value / maxVal) * innerH, d.value > 0 ? 4 : 0);
          const barX = padLeft + i * barSlot + barGap / 2;
          const barY = padTop + innerH - barH;
          const isHovered = hovered === i;

          return (
            <g key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}>
              {isHovered && (
                <rect x={barX - 6} y={barY - 3} width={barW + 12} height={barH + 6}
                  rx="8" fill={color} opacity="0.12" filter={`url(#barGlow-${gid})`} />
              )}
              {/* Pillar shadow */}
              <rect x={barX + 2} y={barY + 3} width={barW} height={Math.max(barH - 3, 0)}
                rx="6" fill={color} opacity="0.08" />
              {/* Main bar */}
              <rect x={barX} y={barY} width={barW} height={barH}
                rx="6" fill={isHovered ? `url(#barGradH-${gid})` : `url(#barGrad-${gid})`}>
                <animate attributeName="height" from="0" to={barH}
                  dur="0.7s" begin={`${i * 0.06}s`} fill="freeze" />
                <animate attributeName="y" from={padTop + innerH} to={barY}
                  dur="0.7s" begin={`${i * 0.06}s`} fill="freeze" />
              </rect>
              {/* Value label */}
              <text x={barX + barW / 2} y={barY - 8} textAnchor="middle"
                fill={isHovered ? color : "rgba(255,255,255,0.6)"}
                fontSize={isHovered ? 13 : 11} fontWeight={isHovered ? 700 : 600}
                fontFamily="Inter, sans-serif"
                opacity={d.value > 0 ? 1 : 0}>
                <animate attributeName="opacity" from="0" to={d.value > 0 ? 1 : 0}
                  dur="0.4s" begin={`${i * 0.06 + 0.3}s`} fill="freeze" />
                {formatValue(d.value)}
              </text>
              {/* X label */}
              <text x={barX + barW / 2} y={chartH - 8} textAnchor="middle"
                fill={isHovered ? "rgba(255,255,255,0.9)" : "rgba(216,195,173,0.45)"}
                fontSize="12" fontFamily="Inter, sans-serif" fontWeight={isHovered ? 600 : 500}>
                {d.label}
              </text>
            </g>
          );
        })}

        {/* Baseline */}
        <line x1={padLeft} y1={padTop + innerH} x2={chartW - padRight} y2={padTop + innerH}
          stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

// ─── Line Chart ──────────────────────────────────────────────
export function LineChart({ data, height = 260, color = "#56e5a9" }) {
  const containerRef = useRef(null);
  const [w, setW] = useState(700);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  if (!data || data.length === 0) {
    return (
      <div ref={containerRef} className="flex items-center justify-center text-on-surface-variant/40 text-sm" style={{ height }}>
        No data
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const padLeft = 56;
  const padRight = 24;
  const padTop = 36;
  const padBottom = 32;
  const chartW = Math.max(w, 400);
  const chartH = height;
  const innerH = chartH - padTop - padBottom;
  const innerW = chartW - padLeft - padRight;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

  const points = data.map((d, i) => ({
    x: padLeft + i * stepX,
    y: padTop + innerH - (d.value / maxVal) * innerH,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `M ${points[0].x} ${padTop + innerH} ${pathD.slice(1)} L ${points[points.length - 1].x} ${padTop + innerH} Z`;

  const formatValue = (v) =>
    v >= 1e9
      ? `${(v / 1e9).toFixed(1)} tỷ`
      : v >= 1e6
      ? `${(v / 1e6).toFixed(1)} tr`
      : v >= 1e3
      ? `${(v / 1e3).toFixed(1)}K`
      : `${Math.round(v).toLocaleString("vi-VN")}đ`;

  const gid = useRef(Math.random().toString(36).slice(2)).current;

  return (
    <div ref={containerRef} className="relative w-full" style={{ height }}>
      <svg width="100%" height={height} viewBox={`0 0 ${chartW} ${chartH}`} className="overflow-visible">
        <defs>
          <linearGradient id={`lineArea-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
          <filter id={`lineGlo-${gid}`}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
          </filter>
        </defs>

        {/* Grid lines */}
        {Array.from({ length: 4 }, (_, i) => {
          const yy = padTop + (innerH / 3) * i;
          const val = Math.round(maxVal - (maxVal / 3) * i);
          return (
            <g key={i}>
              <line x1={padLeft} y1={yy} x2={chartW - padRight} y2={yy}
                stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
              <text x={padLeft - 8} y={yy + 4} textAnchor="end"
                fill="rgba(216,195,173,0.35)" fontSize="11" fontFamily="Inter, sans-serif">
                {formatValue(val)}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <polygon points={areaD} fill={`url(#lineArea-${gid})`} />
        {/* Glow */}
        <polyline points={pathD} fill="none" stroke={color} strokeWidth="1"
          opacity="0.25" filter={`url(#lineGlo-${gid})`}
          strokeLinecap="round" strokeLinejoin="round" />
        {/* Line */}
        <polyline points={pathD} fill="none" stroke={color} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />

        {/* Points */}
        {data.map((d, i) => {
          const cx = points[i].x;
          const cy = points[i].y;
          return (
            <g key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}>
              {hovered === i && (
                <circle cx={cx} cy={cy} r="16" fill={color} opacity="0.1" />
              )}
              <circle cx={cx} cy={cy} r="5" fill="#0c1322" stroke={color} strokeWidth="2.5">
                <animate attributeName="opacity" from="0" to="1" dur="0.3s"
                  begin={`${i * 0.05 + 0.5}s`} fill="freeze" />
              </circle>
              {hovered === i && (
                <g>
                  <rect x={cx - 32} y={cy - 40} width="64" height="26" rx="7"
                    fill="rgba(12,19,34,0.95)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                  <text x={cx} y={cy - 22} textAnchor="middle" fill={color}
                    fontSize="12" fontWeight="700" fontFamily="Inter, sans-serif">
                    {formatValue(d.value)}
                  </text>
                </g>
              )}
              <text x={cx} y={chartH - 8} textAnchor="middle"
                fill={hovered === i ? "rgba(255,255,255,0.9)" : "rgba(216,195,173,0.45)"}
                fontSize="12" fontFamily="Inter, sans-serif" fontWeight={hovered === i ? 600 : 500}>
                {d.label}
              </text>
            </g>
          );
        })}

        {/* Baseline */}
        <line x1={padLeft} y1={padTop + innerH} x2={chartW - padRight} y2={padTop + innerH}
          stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

// ─── Donut Chart ─────────────────────────────────────────────
export function DonutChart({ data, width = 260, height = 200, colors = ["#ffc174", "#56e5a9", "#a78bfa", "#ffb690", "#60a5fa"] }) {
  if (!data || data.length === 0) return null;

  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = 100;
  const cy = height / 2;
  const radius = Math.min(cx, cy) - 12;
  const innerRadius = radius * 0.58;
  const [hovered, setHovered] = useState(null);

  let cumAngle = -90;
  const toRad = (deg) => (deg * Math.PI) / 180;

  const slices = data.map((d, i) => {
    const a = (d.value / total) * 360;
    const start = cumAngle;
    cumAngle += a;
    const r = hovered === i ? radius + 5 : radius;
    const x1 = cx + r * Math.cos(toRad(start));
    const y1 = cy + r * Math.sin(toRad(start));
    const x2 = cx + r * Math.cos(toRad(start + a));
    const y2 = cy + r * Math.sin(toRad(start + a));
    const ix1 = cx + innerRadius * Math.cos(toRad(start + a));
    const iy1 = cy + innerRadius * Math.sin(toRad(start + a));
    const ix2 = cx + innerRadius * Math.cos(toRad(start));
    const iy2 = cy + innerRadius * Math.sin(toRad(start));
    return {
      path: `M ${x1} ${y1} A ${r} ${r} 0 ${a > 180 ? 1 : 0} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerRadius} ${innerRadius} 0 ${a > 180 ? 1 : 0} 0 ${ix2} ${iy2} Z`,
      color: colors[i % colors.length],
      label: d.label,
      percent: Math.round((d.value / total) * 100),
    };
  });

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {slices.map((s, i) => (
        <path key={i} d={s.path} fill={s.color} stroke="#0c1322" strokeWidth="2"
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
          style={{ cursor: "pointer" }}>
          <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin={`${i * 0.1}s`} fill="freeze" />
        </path>
      ))}
      <text x={cx} y={cy - 5} textAnchor="middle" fill="white" fontSize="22" fontWeight="bold" fontFamily="Inter, sans-serif">
        {total}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(216,195,173,0.45)" fontSize="10" fontFamily="Inter, sans-serif">
        Total
      </text>
      {/* Legend */}
      {slices.map((s, i) => (
        <g key={i} transform={`translate(${cx + radius + 14}, ${6 + i * 22})`}>
          <rect width="10" height="10" rx="3" fill={s.color} />
          <text x="16" y="9" fill="rgba(255,255,255,0.65)" fontSize="11" fontFamily="Inter, sans-serif">
            {s.label} ({s.percent}%)
          </text>
        </g>
      ))}
    </svg>
  );
}
