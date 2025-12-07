/**
 * Weekly Trends Page - Historical Performance Analysis
 *
 * NOTE: ISO Week Number Alignment
 * This page displays weekly compliance trends using ISO week numbers (1-53).
 *
 * Why ISO weeks?
 * - Martinsburg office uses Saturday week endings
 * - All other offices use Sunday week endings
 * - ISO weeks run Monday→Sunday, so Saturday (day 6) and Sunday (day 7)
 *   of the same calendar week share the same ISO week number
 *
 * This ensures accurate week-over-week comparisons across all offices.
 * The `week_display` field shows the Sunday date for chart labels.
 */
import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, AreaChart, Area
} from 'recharts';
import { TrendingUp, ArrowUp, ArrowDown, Minus, Calendar, Clock, Hash, Target, Activity, BarChart3, Zap, Info } from 'lucide-react';
import { COLORS, ENTRY_TYPE_COLORS, THRESHOLDS, getFingerRateStatus } from '../constants/colors';
import { useKPIsByWeek, useKPITrends } from '../hooks/useKPIs';
import { useFilters } from '../contexts/FilterContext';
import AnimatedNumber from '../components/AnimatedNumber';

// GlassCard component for consistent styling
const GlassCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  glow?: string;
  gradient?: string;
}> = ({ children, className = '', glow, gradient }) => (
  <div
    className={`rounded-xl backdrop-blur-sm overflow-hidden transition-all duration-300 hover:translate-y-[-2px] ${className}`}
    style={{
      background: gradient || `linear-gradient(145deg, ${COLORS.background.secondary}95 0%, ${COLORS.background.tertiary}95 100%)`,
      border: `1px solid ${COLORS.border.subtle}`,
      boxShadow: glow
        ? `0 4px 20px ${glow}20, 0 0 40px ${glow}10, inset 0 1px 0 rgba(255,255,255,0.05)`
        : `0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)`,
    }}
  >
    {children}
  </div>
);

const WeeklyTrends: React.FC = () => {
  const { filters } = useFilters();
  const { weeklyKPIs, loading: weeklyLoading } = useKPIsByWeek(filters);
  const { loading: trendsLoading } = useKPITrends(filters);

  const loading = weeklyLoading || trendsLoading;

  // Calculate week-over-week changes
  const weeklyChanges = useMemo(() => {
    if (!weeklyKPIs || weeklyKPIs.length < 2) return null;

    const lastWeek = weeklyKPIs[weeklyKPIs.length - 1];
    const prevWeek = weeklyKPIs[weeklyKPIs.length - 2];

    return {
      finger_rate: {
        current: lastWeek.finger_rate,
        previous: prevWeek.finger_rate,
        change: lastWeek.finger_rate - prevWeek.finger_rate,
      },
      provisional_rate: {
        current: lastWeek.provisional_rate,
        previous: prevWeek.provisional_rate,
        change: lastWeek.provisional_rate - prevWeek.provisional_rate,
      },
      total_entries: {
        current: lastWeek.total_entries,
        previous: prevWeek.total_entries,
        change: ((lastWeek.total_entries - prevWeek.total_entries) / prevWeek.total_entries) * 100,
      },
      total_hours: {
        current: lastWeek.total_hours,
        previous: prevWeek.total_hours,
        change: ((lastWeek.total_hours - prevWeek.total_hours) / prevWeek.total_hours) * 100,
      },
      currentWeek: lastWeek.week,
    };
  }, [weeklyKPIs]);

  // Calculate overall stats
  const stats = useMemo(() => {
    if (!weeklyKPIs || weeklyKPIs.length === 0) return null;

    const fingerRates = weeklyKPIs.map(w => w.finger_rate);
    const avgFingerRate = fingerRates.reduce((a, b) => a + b, 0) / fingerRates.length;
    const maxFingerRate = Math.max(...fingerRates);
    const minFingerRate = Math.min(...fingerRates);

    const weeksAboveTarget = weeklyKPIs.filter(w => w.finger_rate >= THRESHOLDS.finger_rate.excellent).length;
    const totalEntries = weeklyKPIs.reduce((sum, w) => sum + w.total_entries, 0);
    const totalHours = weeklyKPIs.reduce((sum, w) => sum + w.total_hours, 0);

    return {
      avgFingerRate: avgFingerRate.toFixed(1),
      maxFingerRate: maxFingerRate.toFixed(1),
      minFingerRate: minFingerRate.toFixed(1),
      weeksAboveTarget,
      totalWeeks: weeklyKPIs.length,
      totalEntries,
      totalHours,
    };
  }, [weeklyKPIs]);

  const TrendIndicator = ({ value, inverse = false, size = 16 }: { value: number; inverse?: boolean; size?: number }) => {
    const isPositive = inverse ? value < 0 : value > 0;
    const isNeutral = Math.abs(value) < 0.1;

    if (isNeutral) {
      return (
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{ background: `${COLORS.text.muted}20` }}>
          <Minus size={size - 4} style={{ color: COLORS.text.muted }} />
        </div>
      );
    }

    return (
      <div
        className="flex items-center gap-1 px-1.5 py-0.5 rounded-full"
        style={{ background: isPositive ? `${COLORS.status.success}20` : `${COLORS.status.danger}20` }}
      >
        {isPositive ? (
          <ArrowUp size={size - 4} style={{ color: COLORS.status.success }} />
        ) : (
          <ArrowDown size={size - 4} style={{ color: COLORS.status.danger }} />
        )}
      </div>
    );
  };

  const CustomLineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Add T12:00:00 to avoid UTC-to-local timezone shift
      const date = new Date(label + 'T12:00:00');
      // Get week number from payload if available (ISO week alignment)
      const weekData = payload[0]?.payload;
      const weekInfo = weekData?.week_number
        ? `Week ${weekData.week_number}, ${weekData.week_year}`
        : `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      return (
        <div
          className="p-3 rounded-lg shadow-xl backdrop-blur-md"
          style={{
            background: `${COLORS.background.elevated}f0`,
            border: `1px solid ${COLORS.border.default}`,
          }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: COLORS.text.primary }}>
            {weekInfo}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
                <span style={{ color: COLORS.text.secondary }}>{entry.name}</span>
              </div>
              <span className="font-semibold" style={{ color: entry.color }}>
                {entry.dataKey.includes('rate') ? `${entry.value}%` : entry.value?.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: `${COLORS.accent.primary} transparent ${COLORS.accent.primary}30 transparent` }}
            />
            <TrendingUp
              size={24}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ color: COLORS.accent.primary }}
            />
          </div>
          <p className="text-sm" style={{ color: COLORS.text.secondary }}>Loading weekly trends...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="p-2.5 rounded-xl"
          style={{
            background: `linear-gradient(135deg, ${COLORS.accent.primary}20 0%, ${COLORS.accent.primary}10 100%)`,
            border: `1px solid ${COLORS.accent.primary}30`,
          }}
        >
          <TrendingUp size={22} style={{ color: COLORS.accent.primary }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold" style={{ color: COLORS.text.primary }}>
              Weekly Trends
            </h1>
            {/* ISO Week Info Tooltip */}
            <div className="relative group">
              <Info
                size={14}
                className="cursor-help"
                style={{ color: COLORS.text.muted }}
              />
              <div
                className="absolute left-0 top-6 z-50 w-72 p-3 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200"
                style={{
                  background: COLORS.background.elevated,
                  border: `1px solid ${COLORS.border.default}`,
                }}
              >
                <p className="text-xs font-semibold mb-1" style={{ color: COLORS.text.primary }}>
                  ISO Week Number Alignment
                </p>
                <p className="text-xs" style={{ color: COLORS.text.secondary }}>
                  Weekly trends use ISO week numbers (1-53) to accurately align data across offices:
                </p>
                <ul className="text-xs mt-1 space-y-0.5" style={{ color: COLORS.text.muted }}>
                  <li>• Martinsburg: Saturday week endings</li>
                  <li>• Albany, Andover, Greensboro, NOLA: Sunday week endings</li>
                </ul>
                <p className="text-xs mt-1" style={{ color: COLORS.text.secondary }}>
                  ISO weeks run Monday→Sunday, so both Saturday and Sunday of the same calendar week share the same week number.
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs" style={{ color: COLORS.text.muted }}>
            Historical performance analysis and week-over-week comparisons
          </p>
        </div>
      </div>

      {/* Week-over-Week Change Cards */}
      {weeklyChanges && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <GlassCard glow={getFingerRateStatus(weeklyChanges.finger_rate.current)}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Target size={14} style={{ color: COLORS.accent.primary }} />
                  <span className="text-xs font-medium" style={{ color: COLORS.text.secondary }}>Finger Rate</span>
                </div>
                <TrendIndicator value={weeklyChanges.finger_rate.change} />
              </div>
              <p className="text-2xl font-bold" style={{ color: getFingerRateStatus(weeklyChanges.finger_rate.current) }}>
                <AnimatedNumber value={weeklyChanges.finger_rate.current} decimals={1} suffix="%" />
              </p>
              <div className="mt-2 pt-2 flex items-center justify-between" style={{ borderTop: `1px solid ${COLORS.border.subtle}` }}>
                <span className="text-xs" style={{ color: COLORS.text.muted }}>vs previous</span>
                <span
                  className="text-xs font-semibold"
                  style={{
                    color: weeklyChanges.finger_rate.change >= 0 ? COLORS.status.success : COLORS.status.danger
                  }}
                >
                  {weeklyChanges.finger_rate.change >= 0 ? '+' : ''}{weeklyChanges.finger_rate.change.toFixed(1)}%
                </span>
              </div>
            </div>
          </GlassCard>

          <GlassCard glow={ENTRY_TYPE_COLORS['Provisional Entry']}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Activity size={14} style={{ color: ENTRY_TYPE_COLORS['Provisional Entry'] }} />
                  <span className="text-xs font-medium" style={{ color: COLORS.text.secondary }}>Provisional</span>
                </div>
                <TrendIndicator value={weeklyChanges.provisional_rate.change} inverse />
              </div>
              <p className="text-2xl font-bold" style={{ color: ENTRY_TYPE_COLORS['Provisional Entry'] }}>
                <AnimatedNumber value={weeklyChanges.provisional_rate.current} decimals={2} suffix="%" />
              </p>
              <div className="mt-2 pt-2 flex items-center justify-between" style={{ borderTop: `1px solid ${COLORS.border.subtle}` }}>
                <span className="text-xs" style={{ color: COLORS.text.muted }}>vs previous</span>
                <span
                  className="text-xs font-semibold"
                  style={{
                    color: weeklyChanges.provisional_rate.change <= 0 ? COLORS.status.success : COLORS.status.danger
                  }}
                >
                  {weeklyChanges.provisional_rate.change >= 0 ? '+' : ''}{weeklyChanges.provisional_rate.change.toFixed(2)}%
                </span>
              </div>
            </div>
          </GlassCard>

          <GlassCard glow={COLORS.accent.secondary}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Hash size={14} style={{ color: COLORS.accent.secondary }} />
                  <span className="text-xs font-medium" style={{ color: COLORS.text.secondary }}>Entries</span>
                </div>
                <TrendIndicator value={weeklyChanges.total_entries.change} />
              </div>
              <p className="text-2xl font-bold" style={{ color: COLORS.text.primary }}>
                <AnimatedNumber value={weeklyChanges.total_entries.current} />
              </p>
              <div className="mt-2 pt-2 flex items-center justify-between" style={{ borderTop: `1px solid ${COLORS.border.subtle}` }}>
                <span className="text-xs" style={{ color: COLORS.text.muted }}>vs previous</span>
                <span className="text-xs font-semibold" style={{ color: COLORS.text.secondary }}>
                  {weeklyChanges.total_entries.change >= 0 ? '+' : ''}{weeklyChanges.total_entries.change.toFixed(1)}%
                </span>
              </div>
            </div>
          </GlassCard>

          <GlassCard glow={COLORS.accent.primary}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Clock size={14} style={{ color: COLORS.accent.primary }} />
                  <span className="text-xs font-medium" style={{ color: COLORS.text.secondary }}>Hours</span>
                </div>
                <TrendIndicator value={weeklyChanges.total_hours.change} />
              </div>
              <p className="text-2xl font-bold" style={{ color: COLORS.text.primary }}>
                <AnimatedNumber value={weeklyChanges.total_hours.current} />
              </p>
              <div className="mt-2 pt-2 flex items-center justify-between" style={{ borderTop: `1px solid ${COLORS.border.subtle}` }}>
                <span className="text-xs" style={{ color: COLORS.text.muted }}>vs previous</span>
                <span className="text-xs font-semibold" style={{ color: COLORS.text.secondary }}>
                  {weeklyChanges.total_hours.change >= 0 ? '+' : ''}{weeklyChanges.total_hours.change.toFixed(1)}%
                </span>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Finger Rate Trend Chart */}
      <GlassCard>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} style={{ color: COLORS.accent.primary }} />
              <h3 className="text-sm font-semibold" style={{ color: COLORS.text.primary }}>
                Finger Rate Trend
              </h3>
            </div>
            {stats && (
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: COLORS.background.tertiary }}>
                  <span style={{ color: COLORS.text.muted }}>Avg:</span>
                  <span className="font-semibold" style={{ color: COLORS.text.primary }}>{stats.avgFingerRate}%</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: `${COLORS.status.success}15` }}>
                  <span style={{ color: COLORS.text.muted }}>High:</span>
                  <span className="font-semibold" style={{ color: COLORS.status.success }}>{stats.maxFingerRate}%</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: `${COLORS.status.danger}15` }}>
                  <span style={{ color: COLORS.text.muted }}>Low:</span>
                  <span className="font-semibold" style={{ color: COLORS.status.danger }}>{stats.minFingerRate}%</span>
                </div>
              </div>
            )}
          </div>

          {weeklyKPIs && weeklyKPIs.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={weeklyKPIs}>
                <defs>
                  <linearGradient id="fingerLineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.accent.primary} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={COLORS.accent.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.chart.grid} opacity={0.5} />
                <XAxis
                  dataKey="week_display"
                  fontSize={11}
                  stroke={COLORS.chart.axis}
                  tick={{ fill: COLORS.text.muted }}
                  tickFormatter={(value) => {
                    // Add T12:00:00 to avoid UTC-to-local timezone shift
                    const date = new Date(value + 'T12:00:00');
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }}
                />
                <YAxis
                  domain={[(dataMin: number) => Math.floor(Math.min(dataMin, 75) / 5) * 5, 100]}
                  fontSize={11}
                  stroke={COLORS.chart.axis}
                  tick={{ fill: COLORS.text.muted }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomLineTooltip />} />
                <ReferenceLine
                  y={THRESHOLDS.finger_rate.excellent}
                  stroke={COLORS.status.success}
                  strokeDasharray="4 4"
                  strokeOpacity={0.7}
                  label={{
                    value: '95% Target',
                    position: 'right',
                    fontSize: 10,
                    fill: COLORS.status.success
                  }}
                />
                <ReferenceLine
                  y={THRESHOLDS.finger_rate.good}
                  stroke={COLORS.status.warning}
                  strokeDasharray="4 4"
                  strokeOpacity={0.7}
                  label={{
                    value: '90% Min',
                    position: 'right',
                    fontSize: 10,
                    fill: COLORS.status.warning
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="finger_rate"
                  stroke="transparent"
                  fill="url(#fingerLineGradient)"
                />
                <Line
                  type="monotone"
                  dataKey="finger_rate"
                  stroke={COLORS.accent.primary}
                  strokeWidth={3}
                  dot={{ fill: COLORS.background.primary, stroke: COLORS.accent.primary, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: COLORS.accent.primary, stroke: COLORS.background.primary, strokeWidth: 2 }}
                  name="Finger Rate"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div
              className="text-center py-12 rounded-lg"
              style={{ background: COLORS.background.tertiary }}
            >
              <TrendingUp size={48} className="mx-auto mb-3" style={{ color: COLORS.text.muted }} />
              <p className="text-sm" style={{ color: COLORS.text.muted }}>
                No weekly data available
              </p>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Volume Trends */}
      <GlassCard>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} style={{ color: COLORS.accent.secondary }} />
            <h3 className="text-sm font-semibold" style={{ color: COLORS.text.primary }}>
              Volume Trends
            </h3>
          </div>

          {weeklyKPIs && weeklyKPIs.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={weeklyKPIs}>
                <defs>
                  <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.accent.secondary} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={COLORS.accent.secondary} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.chart.grid} opacity={0.5} />
                <XAxis
                  dataKey="week_display"
                  fontSize={11}
                  stroke={COLORS.chart.axis}
                  tick={{ fill: COLORS.text.muted }}
                  tickFormatter={(value) => {
                    // Add T12:00:00 to avoid UTC-to-local timezone shift
                    const date = new Date(value + 'T12:00:00');
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }}
                />
                <YAxis
                  fontSize={11}
                  stroke={COLORS.chart.axis}
                  tick={{ fill: COLORS.text.muted }}
                  tickFormatter={(value) => value.toLocaleString()}
                />
                <Tooltip content={<CustomLineTooltip />} />
                <Area
                  type="monotone"
                  dataKey="total_entries"
                  stroke={COLORS.accent.secondary}
                  strokeWidth={2}
                  fill="url(#volumeGradient)"
                  name="Entries"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div
              className="text-center py-12 rounded-lg"
              style={{ background: COLORS.background.tertiary }}
            >
              <Zap size={48} className="mx-auto mb-3" style={{ color: COLORS.text.muted }} />
              <p className="text-sm" style={{ color: COLORS.text.muted }}>
                No volume data available
              </p>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Summary Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <GlassCard>
            <div className="p-4 text-center relative overflow-hidden">
              <div className="absolute top-2 right-2 opacity-10">
                <Calendar size={40} style={{ color: COLORS.accent.primary }} />
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Calendar size={14} style={{ color: COLORS.accent.primary }} />
                <p className="text-xs font-medium" style={{ color: COLORS.text.secondary }}>Total Weeks</p>
              </div>
              <p className="text-3xl font-bold" style={{ color: COLORS.text.primary }}>
                <AnimatedNumber value={stats.totalWeeks} />
              </p>
            </div>
          </GlassCard>

          <GlassCard glow={COLORS.status.success}>
            <div className="p-4 text-center relative overflow-hidden">
              <div className="absolute top-2 right-2 opacity-10">
                <Target size={40} style={{ color: COLORS.status.success }} />
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target size={14} style={{ color: COLORS.status.success }} />
                <p className="text-xs font-medium" style={{ color: COLORS.text.secondary }}>Above Target</p>
              </div>
              <p className="text-3xl font-bold" style={{ color: COLORS.status.success }}>
                <AnimatedNumber value={stats.weeksAboveTarget} />
              </p>
              <p className="text-xs mt-1" style={{ color: COLORS.text.muted }}>
                of {stats.totalWeeks} weeks
              </p>
            </div>
          </GlassCard>

          <GlassCard glow={getFingerRateStatus(parseFloat(stats.avgFingerRate))}>
            <div className="p-4 text-center relative overflow-hidden">
              <div className="absolute top-2 right-2 opacity-10">
                <Activity size={40} style={{ color: getFingerRateStatus(parseFloat(stats.avgFingerRate)) }} />
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Activity size={14} style={{ color: getFingerRateStatus(parseFloat(stats.avgFingerRate)) }} />
                <p className="text-xs font-medium" style={{ color: COLORS.text.secondary }}>Average Rate</p>
              </div>
              <p className="text-3xl font-bold" style={{ color: getFingerRateStatus(parseFloat(stats.avgFingerRate)) }}>
                <AnimatedNumber value={parseFloat(stats.avgFingerRate)} decimals={1} suffix="%" />
              </p>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="p-4 text-center relative overflow-hidden">
              <div className="absolute top-2 right-2 opacity-10">
                <TrendingUp size={40} style={{ color: COLORS.accent.primary }} />
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp size={14} style={{ color: COLORS.accent.primary }} />
                <p className="text-xs font-medium" style={{ color: COLORS.text.secondary }}>Rate Range</p>
              </div>
              <p className="text-3xl font-bold" style={{ color: COLORS.text.primary }}>
                <AnimatedNumber value={parseFloat(stats.maxFingerRate) - parseFloat(stats.minFingerRate)} decimals={1} suffix="%" />
              </p>
              <p className="text-xs mt-1" style={{ color: COLORS.text.muted }}>
                {stats.minFingerRate}% - {stats.maxFingerRate}%
              </p>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Period Totals */}
      {stats && (
        <GlassCard>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Hash size={16} style={{ color: COLORS.accent.primary }} />
              <h3 className="text-sm font-semibold" style={{ color: COLORS.text.primary }}>
                Period Totals
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div
                className="p-4 rounded-xl text-center"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.accent.secondary}15 0%, ${COLORS.accent.secondary}05 100%)`,
                  border: `1px solid ${COLORS.accent.secondary}30`,
                }}
              >
                <p className="text-xs" style={{ color: COLORS.text.muted }}>Total Entries</p>
                <p className="text-3xl font-bold mt-1" style={{ color: COLORS.text.primary }}>
                  <AnimatedNumber value={stats.totalEntries} />
                </p>
              </div>
              <div
                className="p-4 rounded-xl text-center"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.accent.primary}15 0%, ${COLORS.accent.primary}05 100%)`,
                  border: `1px solid ${COLORS.accent.primary}30`,
                }}
              >
                <p className="text-xs" style={{ color: COLORS.text.muted }}>Total Hours</p>
                <p className="text-3xl font-bold mt-1" style={{ color: COLORS.text.primary }}>
                  <AnimatedNumber value={stats.totalHours} />
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default WeeklyTrends;
