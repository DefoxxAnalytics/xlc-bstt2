import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend
} from 'recharts';
import {
  Timer, AlertTriangle, CheckCircle2, TrendingDown,
  Users, Fingerprint, Target, Award, XCircle, RefreshCw
} from 'lucide-react';
import { fetchClockBehavior } from '../api/client';
import { useFilters } from '../contexts/FilterContext';
import { COLORS } from '../constants/colors';
import AnimatedNumber from '../components/AnimatedNumber';

// Glass Card component
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

// Progress Ring component
const ProgressRing: React.FC<{
  value: number;
  maxValue?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  showValue?: boolean;
  label?: string;
}> = ({
  value,
  maxValue = 100,
  size = 80,
  strokeWidth = 8,
  color = COLORS.status.success,
  bgColor = COLORS.border.subtle,
  showValue = true,
  label,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min(value / maxValue, 1);
  const offset = circumference - percentage * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold" style={{ color }}>
            {value.toFixed(1)}
          </span>
          {label && (
            <span className="text-[10px]" style={{ color: COLORS.text.muted }}>
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

const ClockBehavior: React.FC = () => {
  const { filters } = useFilters();
  const [activeTab, setActiveTab] = useState<'distribution' | 'problems'>('distribution');

  const { data, isLoading, error } = useQuery({
    queryKey: ['clockBehavior', filters],
    queryFn: () => fetchClockBehavior(filters),
  });

  const summary = data?.summary || {
    avg_clock_in_tries: 0,
    avg_clock_out_tries: 0,
    first_attempt_rate: 0,
    multi_try_clock_ins: 0,
    multi_try_clock_outs: 0,
    max_tries_observed: 0,
    total_entries: 0,
  };

  const distribution = data?.distribution || { clock_in: [], clock_out: [] };
  const problemEmployees = data?.problem_employees || [];

  // Status determination
  const getAttemptStatus = (avgTries: number) => {
    if (avgTries <= 1.1) return { color: COLORS.status.success, label: 'Excellent', icon: CheckCircle2 };
    if (avgTries <= 1.3) return { color: COLORS.status.warning, label: 'Good', icon: AlertTriangle };
    return { color: COLORS.status.danger, label: 'Needs Attention', icon: XCircle };
  };

  const clockInStatus = getAttemptStatus(summary.avg_clock_in_tries);
  const clockOutStatus = getAttemptStatus(summary.avg_clock_out_tries);

  // Chart data for distribution
  const chartData = useMemo(() => {
    const maxTries = Math.max(
      ...distribution.clock_in.map((d: any) => d.tries),
      ...distribution.clock_out.map((d: any) => d.tries),
      1
    );

    const result = [];
    for (let i = 1; i <= Math.min(maxTries, 5); i++) {
      const clockInEntry = distribution.clock_in.find((d: any) => d.tries === i);
      const clockOutEntry = distribution.clock_out.find((d: any) => d.tries === i);
      result.push({
        tries: i === 5 ? '5+' : i.toString(),
        clockIn: clockInEntry?.count || 0,
        clockInPct: clockInEntry?.percentage || 0,
        clockOut: clockOutEntry?.count || 0,
        clockOutPct: clockOutEntry?.percentage || 0,
      });
    }
    return result;
  }, [distribution]);

  // Pie chart data
  const pieData = useMemo(() => [
    { name: 'First Try Success', value: summary.first_attempt_rate, color: COLORS.status.success },
    { name: 'Multi-Try Required', value: 100 - summary.first_attempt_rate, color: COLORS.status.warning },
  ], [summary.first_attempt_rate]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="p-3 rounded-lg shadow-xl backdrop-blur-md"
          style={{
            background: `${COLORS.background.elevated}f0`,
            border: `1px solid ${COLORS.border.default}`,
          }}
        >
          <p className="text-sm font-medium mb-2" style={{ color: COLORS.text.primary }}>
            {label} {label === '5+' ? 'or more' : ''} Attempt{label === '1' ? '' : 's'}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()} ({entry.payload[`${entry.dataKey}Pct`]?.toFixed(1)}%)
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <RefreshCw className="animate-spin" size={24} style={{ color: COLORS.accent.primary }} />
          <span style={{ color: COLORS.text.secondary }}>Loading clock behavior data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircle size={48} className="mx-auto mb-4" style={{ color: COLORS.status.danger }} />
          <p style={{ color: COLORS.text.primary }}>Failed to load clock behavior data</p>
          <p className="text-sm" style={{ color: COLORS.text.muted }}>Please try again later</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'distribution', label: 'Attempt Distribution', icon: BarChart },
    { id: 'problems', label: 'Problem Analysis', icon: AlertTriangle },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div
          className="p-2.5 rounded-xl"
          style={{
            background: `linear-gradient(135deg, ${COLORS.accent.primary}20 0%, ${COLORS.accent.secondary}20 100%)`,
          }}
        >
          <Timer size={24} style={{ color: COLORS.accent.primary }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: COLORS.text.primary }}>
            Clock Behavior Analysis
          </h1>
          <p className="text-sm" style={{ color: COLORS.text.muted }}>
            Biometric clock attempt patterns and problem identification
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* First Attempt Rate */}
        <GlassCard glow={summary.first_attempt_rate >= 95 ? COLORS.status.success : COLORS.status.warning}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="p-1.5 rounded-lg"
                  style={{
                    background: `${summary.first_attempt_rate >= 95 ? COLORS.status.success : COLORS.status.warning}20`,
                  }}
                >
                  <Target size={16} style={{ color: summary.first_attempt_rate >= 95 ? COLORS.status.success : COLORS.status.warning }} />
                </div>
                <span className="text-xs font-medium" style={{ color: COLORS.text.muted }}>
                  First Attempt Rate
                </span>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <AnimatedNumber
                  value={summary.first_attempt_rate}
                  decimals={1}
                  suffix="%"
                  className="text-2xl font-bold"
                  style={{ color: summary.first_attempt_rate >= 95 ? COLORS.status.success : COLORS.status.warning }}
                />
                <p className="text-xs mt-1" style={{ color: COLORS.text.muted }}>
                  Target: 95%+
                </p>
              </div>
              <ProgressRing
                value={summary.first_attempt_rate}
                size={56}
                strokeWidth={6}
                color={summary.first_attempt_rate >= 95 ? COLORS.status.success : COLORS.status.warning}
                showValue={false}
              />
            </div>
          </div>
        </GlassCard>

        {/* Avg Clock-In Tries */}
        <GlassCard glow={clockInStatus.color}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="p-1.5 rounded-lg"
                  style={{ background: `${clockInStatus.color}20` }}
                >
                  <Fingerprint size={16} style={{ color: clockInStatus.color }} />
                </div>
                <span className="text-xs font-medium" style={{ color: COLORS.text.muted }}>
                  Avg Clock-In Tries
                </span>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <AnimatedNumber
                  value={summary.avg_clock_in_tries}
                  decimals={2}
                  className="text-2xl font-bold"
                  style={{ color: clockInStatus.color }}
                />
                <p className="text-xs mt-1 flex items-center gap-1" style={{ color: clockInStatus.color }}>
                  <clockInStatus.icon size={12} />
                  {clockInStatus.label}
                </p>
              </div>
              <ProgressRing
                value={2 - summary.avg_clock_in_tries}
                maxValue={1}
                size={56}
                strokeWidth={6}
                color={clockInStatus.color}
                showValue={false}
              />
            </div>
          </div>
        </GlassCard>

        {/* Avg Clock-Out Tries */}
        <GlassCard glow={clockOutStatus.color}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="p-1.5 rounded-lg"
                  style={{ background: `${clockOutStatus.color}20` }}
                >
                  <Fingerprint size={16} style={{ color: clockOutStatus.color }} />
                </div>
                <span className="text-xs font-medium" style={{ color: COLORS.text.muted }}>
                  Avg Clock-Out Tries
                </span>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <AnimatedNumber
                  value={summary.avg_clock_out_tries}
                  decimals={2}
                  className="text-2xl font-bold"
                  style={{ color: clockOutStatus.color }}
                />
                <p className="text-xs mt-1 flex items-center gap-1" style={{ color: clockOutStatus.color }}>
                  <clockOutStatus.icon size={12} />
                  {clockOutStatus.label}
                </p>
              </div>
              <ProgressRing
                value={2 - summary.avg_clock_out_tries}
                maxValue={1}
                size={56}
                strokeWidth={6}
                color={clockOutStatus.color}
                showValue={false}
              />
            </div>
          </div>
        </GlassCard>

        {/* Problem Entries */}
        <GlassCard glow={summary.multi_try_clock_ins > 100 ? COLORS.status.danger : COLORS.status.info}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="p-1.5 rounded-lg"
                  style={{ background: `${COLORS.status.warning}20` }}
                >
                  <AlertTriangle size={16} style={{ color: COLORS.status.warning }} />
                </div>
                <span className="text-xs font-medium" style={{ color: COLORS.text.muted }}>
                  Multi-Try Entries
                </span>
              </div>
            </div>
            <div>
              <AnimatedNumber
                value={summary.multi_try_clock_ins + summary.multi_try_clock_outs}
                className="text-2xl font-bold"
                style={{ color: COLORS.text.primary }}
              />
              <div className="flex gap-3 mt-2 text-xs" style={{ color: COLORS.text.muted }}>
                <span>In: {summary.multi_try_clock_ins.toLocaleString()}</span>
                <span>Out: {summary.multi_try_clock_outs.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <GlassCard>
          <div className="p-3 text-center">
            <p className="text-xs" style={{ color: COLORS.text.muted }}>Total Entries</p>
            <p className="text-lg font-bold" style={{ color: COLORS.text.primary }}>
              {summary.total_entries.toLocaleString()}
            </p>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="p-3 text-center">
            <p className="text-xs" style={{ color: COLORS.text.muted }}>Max Tries Observed</p>
            <p className="text-lg font-bold" style={{ color: summary.max_tries_observed > 3 ? COLORS.status.danger : COLORS.text.primary }}>
              {summary.max_tries_observed}
            </p>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="p-3 text-center">
            <p className="text-xs" style={{ color: COLORS.text.muted }}>Problem Employees</p>
            <p className="text-lg font-bold" style={{ color: problemEmployees.length > 10 ? COLORS.status.warning : COLORS.text.primary }}>
              {problemEmployees.length}
            </p>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="p-3 text-center">
            <p className="text-xs" style={{ color: COLORS.text.muted }}>Efficiency Score</p>
            <p className="text-lg font-bold" style={{ color: summary.first_attempt_rate >= 95 ? COLORS.status.success : COLORS.status.warning }}>
              {(summary.first_attempt_rate / 100 * 5).toFixed(1)}/5.0
            </p>
          </div>
        </GlassCard>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mt-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200"
              style={{
                background: isActive
                  ? `linear-gradient(135deg, ${COLORS.accent.primary}30 0%, ${COLORS.accent.secondary}20 100%)`
                  : COLORS.background.tertiary,
                border: `1px solid ${isActive ? COLORS.accent.primary : COLORS.border.subtle}`,
                color: isActive ? COLORS.text.primary : COLORS.text.secondary,
              }}
            >
              <IconComponent size={16} />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'distribution' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Bar Chart */}
          <GlassCard>
            <div className="p-4">
              <h3 className="text-sm font-semibold mb-4" style={{ color: COLORS.text.primary }}>
                Attempt Distribution
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border.subtle} opacity={0.3} />
                  <XAxis
                    dataKey="tries"
                    tick={{ fill: COLORS.text.muted, fontSize: 12 }}
                    axisLine={{ stroke: COLORS.border.subtle }}
                    tickLine={false}
                    label={{ value: 'Attempts', position: 'bottom', fill: COLORS.text.muted, fontSize: 11 }}
                  />
                  <YAxis
                    tick={{ fill: COLORS.text.muted, fontSize: 12 }}
                    axisLine={{ stroke: COLORS.border.subtle }}
                    tickLine={false}
                    tickFormatter={(v) => v.toLocaleString()}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="clockIn" name="Clock-In" fill={COLORS.accent.primary} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="clockOut" name="Clock-Out" fill={COLORS.accent.secondary} radius={[4, 4, 0, 0]} />
                  <Legend
                    wrapperStyle={{ paddingTop: 10 }}
                    formatter={(value) => <span style={{ color: COLORS.text.secondary, fontSize: 12 }}>{value}</span>}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Pie Chart */}
          <GlassCard>
            <div className="p-4">
              <h3 className="text-sm font-semibold mb-4" style={{ color: COLORS.text.primary }}>
                First Attempt Success Rate
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend
                    formatter={(value, entry: any) => (
                      <span style={{ color: COLORS.text.secondary, fontSize: 12 }}>
                        {value}: {entry.payload.value.toFixed(1)}%
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      )}

      {activeTab === 'problems' && (
        <GlassCard>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: COLORS.text.primary }}>
                Employees with Multiple Clock Attempts
              </h3>
              <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${COLORS.status.warning}20`, color: COLORS.status.warning }}>
                {problemEmployees.length} employees
              </span>
            </div>

            {problemEmployees.length === 0 ? (
              <div className="text-center py-8">
                <Award size={48} className="mx-auto mb-3" style={{ color: COLORS.status.success }} />
                <p className="text-sm" style={{ color: COLORS.text.primary }}>
                  No problem employees found!
                </p>
                <p className="text-xs" style={{ color: COLORS.text.muted }}>
                  All employees are clocking in/out on their first attempt.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto" style={{ maxHeight: '400px' }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${COLORS.border.subtle}` }}>
                      <th className="text-left py-2 px-3 text-xs font-medium" style={{ color: COLORS.text.muted }}>Employee</th>
                      <th className="text-left py-2 px-3 text-xs font-medium" style={{ color: COLORS.text.muted }}>Office</th>
                      <th className="text-right py-2 px-3 text-xs font-medium" style={{ color: COLORS.text.muted }}>Entries</th>
                      <th className="text-right py-2 px-3 text-xs font-medium" style={{ color: COLORS.text.muted }}>Avg In</th>
                      <th className="text-right py-2 px-3 text-xs font-medium" style={{ color: COLORS.text.muted }}>Avg Out</th>
                      <th className="text-right py-2 px-3 text-xs font-medium" style={{ color: COLORS.text.muted }}>Multi-Try</th>
                    </tr>
                  </thead>
                  <tbody>
                    {problemEmployees.slice(0, 20).map((emp: any, index: number) => (
                      <tr
                        key={emp.applicant_id}
                        style={{
                          borderBottom: `1px solid ${COLORS.border.subtle}`,
                          background: index % 2 === 0 ? 'transparent' : `${COLORS.background.tertiary}50`,
                        }}
                      >
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
                              style={{
                                background: `linear-gradient(135deg, ${COLORS.accent.primary}30 0%, ${COLORS.accent.secondary}30 100%)`,
                                color: COLORS.accent.primary,
                              }}
                            >
                              {emp.full_name?.charAt(0) || '?'}
                            </div>
                            <span className="text-sm" style={{ color: COLORS.text.primary }}>
                              {emp.full_name}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-sm" style={{ color: COLORS.text.secondary }}>
                          {emp.office}
                        </td>
                        <td className="py-2 px-3 text-sm text-right" style={{ color: COLORS.text.secondary }}>
                          {emp.total_entries.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-sm text-right">
                          <span
                            className="px-1.5 py-0.5 rounded text-xs"
                            style={{
                              background: emp.avg_clock_in_tries > 1.3 ? `${COLORS.status.danger}20` : `${COLORS.status.success}20`,
                              color: emp.avg_clock_in_tries > 1.3 ? COLORS.status.danger : COLORS.status.success,
                            }}
                          >
                            {emp.avg_clock_in_tries.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-sm text-right">
                          <span
                            className="px-1.5 py-0.5 rounded text-xs"
                            style={{
                              background: emp.avg_clock_out_tries > 1.3 ? `${COLORS.status.danger}20` : `${COLORS.status.success}20`,
                              color: emp.avg_clock_out_tries > 1.3 ? COLORS.status.danger : COLORS.status.success,
                            }}
                          >
                            {emp.avg_clock_out_tries.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-sm text-right font-medium" style={{ color: COLORS.status.warning }}>
                          {emp.multi_try_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {problemEmployees.length > 20 && (
                  <p className="text-center py-3 text-xs" style={{ color: COLORS.text.muted }}>
                    Showing top 20 of {problemEmployees.length} employees
                  </p>
                )}
              </div>
            )}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default ClockBehavior;
