import React from 'react';
import { TrendingUp, TrendingDown, Target } from 'lucide-react';
import { COLORS, getFingerRateStatus, getRateStatus, THRESHOLDS } from '../constants/colors';

interface KPICardProps {
  title: string;
  value: number | string;
  unit?: string;
  target?: number;
  isPercentage?: boolean;
  trend?: number; // Positive or negative percentage change
  icon?: React.ReactNode;
  variant?: 'default' | 'compact';
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  unit = '',
  target,
  isPercentage = false,
  trend,
  icon,
  variant = 'default',
}) => {
  // Determine status color based on title and value
  const getStatusColor = (): string => {
    if (typeof value !== 'number') return COLORS.accent.primary;

    const lowerTitle = title.toLowerCase();

    // Finger rate - higher is better
    if (lowerTitle.includes('finger') || lowerTitle.includes('biometric') || lowerTitle.includes('compliance')) {
      return getFingerRateStatus(value);
    }

    // For rates where lower is better (provisional, write-in, missing c/o)
    if (lowerTitle.includes('provisional')) {
      return getRateStatus(value, THRESHOLDS.provisional_max);
    }
    if (lowerTitle.includes('write-in')) {
      return getRateStatus(value, THRESHOLDS.write_in_max);
    }
    if (lowerTitle.includes('missing')) {
      return getRateStatus(value, THRESHOLDS.missing_co_max);
    }

    // Default accent color for neutral metrics
    return COLORS.accent.primary;
  };

  const statusColor = getStatusColor();

  const formatValue = (val: number | string): string => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return (val / 1000000).toFixed(1) + 'M';
      }
      if (val >= 10000) {
        return (val / 1000).toFixed(1) + 'K';
      }
      return val.toLocaleString(undefined, { maximumFractionDigits: 1 });
    }
    return val;
  };

  if (variant === 'compact') {
    return (
      <div
        className="p-3 rounded-lg transition-all duration-300 hover:scale-[1.02]"
        style={{
          background: COLORS.background.secondary,
          border: `1px solid ${COLORS.border.subtle}`,
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: COLORS.text.secondary }}>{title}</span>
          {icon && <span style={{ color: statusColor }}>{icon}</span>}
        </div>
        <div className="mt-1.5 flex items-baseline gap-1">
          <span className="text-xl font-bold" style={{ color: statusColor }}>
            {formatValue(value)}
          </span>
          {isPercentage && <span className="text-base" style={{ color: statusColor }}>%</span>}
          {unit && <span className="text-xs" style={{ color: COLORS.text.muted }}>{unit}</span>}
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative p-3.5 rounded-lg overflow-hidden transition-all duration-300 hover:scale-[1.02] group"
      style={{
        background: `linear-gradient(135deg, ${COLORS.background.secondary} 0%, ${COLORS.background.tertiary} 100%)`,
        border: `1px solid ${COLORS.border.subtle}`,
        boxShadow: `0 0 15px ${statusColor}08`,
      }}
    >
      {/* Glow effect on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at top right, ${statusColor}10 0%, transparent 60%)`,
        }}
      />

      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5"
        style={{ background: statusColor }}
      />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium" style={{ color: COLORS.text.secondary }}>
            {title}
          </span>
          {icon && <span style={{ color: statusColor }}>{icon}</span>}
        </div>

        <div className="flex items-baseline gap-1.5">
          <span
            className="text-2xl font-bold tracking-tight"
            style={{ color: COLORS.text.primary }}
          >
            {formatValue(value)}
          </span>
          {isPercentage && (
            <span className="text-lg font-semibold" style={{ color: statusColor }}>%</span>
          )}
          {unit && (
            <span className="text-xs" style={{ color: COLORS.text.muted }}>{unit}</span>
          )}
        </div>

        {/* Target and Trend */}
        <div className="flex items-center justify-between mt-2">
          {target !== undefined && (
            <div className="flex items-center gap-1">
              <Target size={10} style={{ color: COLORS.text.muted }} />
              <span className="text-xs" style={{ color: COLORS.text.muted }}>
                Target: {target}{isPercentage && '%'}
              </span>
            </div>
          )}

          {trend !== undefined && trend !== 0 && (
            <div
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium"
              style={{
                background: trend > 0 ? `${COLORS.status.success}20` : `${COLORS.status.danger}20`,
                color: trend > 0 ? COLORS.status.success : COLORS.status.danger,
              }}
            >
              {trend > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {Math.abs(trend).toFixed(1)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KPICard;
