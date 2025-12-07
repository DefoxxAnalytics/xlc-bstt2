import React, { useMemo } from 'react';
import { COLORS } from '../constants/colors';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showDots?: boolean;
  showArea?: boolean;
  showLastValue?: boolean;
  className?: string;
}

const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 80,
  height = 24,
  color = COLORS.accent.primary,
  showDots = false,
  showArea = true,
  showLastValue = false,
  className = '',
}) => {
  const { path, areaPath, points, trend } = useMemo(() => {
    if (!data || data.length < 2) {
      return { path: '', areaPath: '', points: [], trend: 0 };
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const padding = 2;
    const effectiveWidth = width - padding * 2;
    const effectiveHeight = height - padding * 2;

    const pointsData = data.map((value, index) => ({
      x: padding + (index / (data.length - 1)) * effectiveWidth,
      y: padding + effectiveHeight - ((value - min) / range) * effectiveHeight,
      value,
    }));

    // Create smooth curve path using bezier curves
    let pathD = `M ${pointsData[0].x} ${pointsData[0].y}`;

    for (let i = 1; i < pointsData.length; i++) {
      const prev = pointsData[i - 1];
      const curr = pointsData[i];
      const cpx = (prev.x + curr.x) / 2;
      pathD += ` Q ${cpx} ${prev.y} ${cpx} ${(prev.y + curr.y) / 2}`;
      pathD += ` Q ${cpx} ${curr.y} ${curr.x} ${curr.y}`;
    }

    // Simpler line version
    const linePath = pointsData.map((p, i) =>
      `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
    ).join(' ');

    // Area path
    const areaD = `${linePath} L ${pointsData[pointsData.length - 1].x} ${height} L ${pointsData[0].x} ${height} Z`;

    // Calculate trend
    const trendValue = data[data.length - 1] - data[0];

    return {
      path: linePath,
      areaPath: areaD,
      points: pointsData,
      trend: trendValue,
    };
  }, [data, width, height]);

  if (!data || data.length < 2) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ width, height, color: COLORS.text.muted }}
      >
        <span className="text-xs">—</span>
      </div>
    );
  }

  const trendColor = trend >= 0 ? COLORS.status.success : COLORS.status.danger;
  const displayColor = color || trendColor;

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <svg width={width} height={height} className="overflow-visible">
        {/* Gradient definition */}
        <defs>
          <linearGradient id={`sparkline-gradient-${displayColor.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={displayColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={displayColor} stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        {showArea && (
          <path
            d={areaPath}
            fill={`url(#sparkline-gradient-${displayColor.replace('#', '')})`}
          />
        )}

        {/* Line */}
        <path
          d={path}
          fill="none"
          stroke={displayColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {showDots && points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={i === points.length - 1 ? 2.5 : 1.5}
            fill={i === points.length - 1 ? displayColor : 'transparent'}
            stroke={displayColor}
            strokeWidth="1"
          />
        ))}

        {/* Last point highlight */}
        {!showDots && points.length > 0 && (
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="2"
            fill={displayColor}
          />
        )}
      </svg>

      {showLastValue && (
        <span
          className="text-xs font-medium tabular-nums"
          style={{ color: displayColor }}
        >
          {data[data.length - 1].toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default Sparkline;
