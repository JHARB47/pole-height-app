import React from "react";
import PropTypes from "prop-types";
import {
  formatFeetInchesTickMarks,
  formatFeetInchesVerbose,
} from "../utils/calculations";
import useAppStore from "../utils/store";

export default function SpanDiagram({
  attachFt,
  midspanFt,
  spanFt,
  groundTargetFt,
}) {
  const { useTickMarkFormat } = useAppStore();
  const fmt = useTickMarkFormat
    ? formatFeetInchesTickMarks
    : formatFeetInchesVerbose;
  const fmtOrDash = (v) => (v == null ? "—" : fmt(v));
  const width = 600;
  const height = 260;
  const margin = { top: 10, right: 20, bottom: 30, left: 40 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const maxH = Math.max(
    attachFt || 0,
    (midspanFt || 0) + 5,
    groundTargetFt || 0,
    10,
  );
  const minH = 0;
  const yScale = (v) => innerH - ((v - minH) / (maxH - minH)) * innerH;
  const xScale = (v) => (v / Math.max(1, spanFt || 1)) * innerW;

  const points = [];
  const steps = 32;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = t * (spanFt || 0);
    // simple parabola through (0, attach), (L/2, mid), (L, attach)
    const L = spanFt || 0;
    const y0 = attachFt || 0;
    const ym = midspanFt || y0;
    // Quadratic interpolation
    const a = (4 * (ym - y0)) / (L * L || 1);
    const y = y0 + a * (x * (x - L));
    points.push({ x: xScale(x), y: yScale(y) });
  }

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  return (
    <svg width={width} height={height} className="border rounded bg-white">
      <g transform={`translate(${margin.left},${margin.top})`}>
        {/* ground line */}
        <line
          x1={0}
          x2={innerW}
          y1={yScale(0)}
          y2={yScale(0)}
          stroke="#999"
          strokeDasharray="4 4"
        />
        {/* ground clearance target */}
        <line
          x1={0}
          x2={innerW}
          y1={yScale(groundTargetFt || 0)}
          y2={yScale(groundTargetFt || 0)}
          stroke="#16a34a"
          strokeDasharray="6 4"
        />
        {/* cable sag curve */}
        <path d={pathD} fill="none" stroke="#2563eb" strokeWidth={2} />
        {/* endpoints */}
        <circle
          cx={xScale(0)}
          cy={yScale(attachFt || 0)}
          r={3}
          fill="#2563eb"
        />
        <circle
          cx={xScale(spanFt || 0)}
          cy={yScale(attachFt || 0)}
          r={3}
          fill="#2563eb"
        />
        {/* labels */}
        <text x={0} y={yScale(attachFt || 0) - 6} fontSize={10} fill="#1f2937">
          Attach {fmtOrDash(attachFt)}
        </text>
        <text
          x={innerW / 2}
          y={yScale(midspanFt || 0) - 6}
          fontSize={10}
          textAnchor="middle"
          fill="#1f2937"
        >
          Mid {fmtOrDash(midspanFt)}
        </text>
        <text
          x={innerW - 2}
          y={yScale(groundTargetFt || 0) - 4}
          fontSize={10}
          textAnchor="end"
          fill="#16a34a"
        >
          Ground target {fmtOrDash(groundTargetFt)}
        </text>
        {/* axis ticks minimal */}
        <text x={0} y={innerH + 16} fontSize={10} fill="#6b7280">
          0 ft
        </text>
        <text x={innerW - 24} y={innerH + 16} fontSize={10} fill="#6b7280">
          {spanFt != null ? spanFt : "—"} ft
        </text>
      </g>
    </svg>
  );
}

SpanDiagram.propTypes = {
  attachFt: PropTypes.number,
  midspanFt: PropTypes.number,
  spanFt: PropTypes.number,
  groundTargetFt: PropTypes.number,
};

SpanDiagram.defaultProps = {
  attachFt: undefined,
  midspanFt: undefined,
  spanFt: undefined,
  groundTargetFt: undefined,
};
