import React from 'react';
import { COLORS } from '../constants/colors';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rectangular' | 'circular' | 'card' | 'chart';
  className?: string;
  animate?: boolean;
}

const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  variant = 'rectangular',
  className = '',
  animate = true,
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'text':
        return {
          width: width || '100%',
          height: height || '1rem',
          borderRadius: '4px',
        };
      case 'circular':
        return {
          width: width || '40px',
          height: height || width || '40px',
          borderRadius: '50%',
        };
      case 'card':
        return {
          width: width || '100%',
          height: height || '100px',
          borderRadius: '8px',
        };
      case 'chart':
        return {
          width: width || '100%',
          height: height || '200px',
          borderRadius: '8px',
        };
      case 'rectangular':
      default:
        return {
          width: width || '100%',
          height: height || '20px',
          borderRadius: '4px',
        };
    }
  };

  return (
    <div
      className={`${animate ? 'animate-pulse' : ''} ${className}`}
      style={{
        ...getVariantStyles(),
        background: `linear-gradient(90deg, ${COLORS.background.tertiary} 25%, ${COLORS.background.secondary} 50%, ${COLORS.background.tertiary} 75%)`,
        backgroundSize: '200% 100%',
        animation: animate ? 'shimmer 1.5s infinite' : 'none',
      }}
    />
  );
};

// Skeleton group for common patterns
export const SkeletonKPICard: React.FC = () => (
  <div
    className="p-3.5 rounded-lg"
    style={{
      background: COLORS.background.secondary,
      border: `1px solid ${COLORS.border.subtle}`,
    }}
  >
    <div className="flex items-center justify-between mb-2">
      <Skeleton variant="text" width="60%" height="12px" />
      <Skeleton variant="circular" width="16px" height="16px" />
    </div>
    <Skeleton variant="text" width="50%" height="28px" />
    <div className="flex items-center gap-2 mt-2">
      <Skeleton variant="text" width="40%" height="12px" />
    </div>
  </div>
);

export const SkeletonChart: React.FC<{ height?: number }> = ({ height = 200 }) => (
  <div
    className="rounded-lg p-4"
    style={{
      background: COLORS.background.secondary,
      border: `1px solid ${COLORS.border.subtle}`,
    }}
  >
    <Skeleton variant="text" width="30%" height="16px" className="mb-3" />
    <Skeleton variant="chart" height={`${height}px`} />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div
    className="rounded-lg overflow-hidden"
    style={{
      background: COLORS.background.secondary,
      border: `1px solid ${COLORS.border.subtle}`,
    }}
  >
    {/* Header */}
    <div
      className="flex gap-4 p-3"
      style={{ background: COLORS.background.tertiary }}
    >
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} variant="text" width={`${20 + i * 5}%`} height="12px" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="flex gap-4 p-3"
        style={{ borderBottom: `1px solid ${COLORS.border.subtle}` }}
      >
        {[1, 2, 3, 4].map((j) => (
          <Skeleton key={j} variant="text" width={`${25 + j * 3}%`} height="14px" />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonInsights: React.FC = () => (
  <div
    className="rounded-lg p-3"
    style={{
      background: COLORS.background.secondary,
      border: `1px solid ${COLORS.border.subtle}`,
    }}
  >
    <div className="flex items-center gap-2 mb-3">
      <Skeleton variant="circular" width="24px" height="24px" />
      <Skeleton variant="text" width="120px" height="14px" />
    </div>
    <div className="grid grid-cols-2 gap-2">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="p-2.5 rounded-md"
          style={{ background: COLORS.background.tertiary }}
        >
          <div className="flex items-start gap-2">
            <Skeleton variant="circular" width="16px" height="16px" />
            <div className="flex-1">
              <Skeleton variant="text" width="80%" height="12px" className="mb-1" />
              <Skeleton variant="text" width="60%" height="10px" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Add shimmer animation to global styles
const shimmerKeyframes = `
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
`;

// Inject keyframes
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = shimmerKeyframes;
  document.head.appendChild(style);
}

export default Skeleton;
