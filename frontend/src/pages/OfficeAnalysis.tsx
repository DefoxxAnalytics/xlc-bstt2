import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import { Building2, Award, TrendingDown, Users, Clock, Trophy, AlertTriangle, Target, ArrowRight, RefreshCw, Layers, Calendar } from 'lucide-react';
import { COLORS, getFingerRateStatus, THRESHOLDS } from '../constants/colors';
import { useKPIsByOffice, useKPIsByDepartment, useKPIsByShift } from '../hooks/useKPIs';
import { useFilters } from '../contexts/FilterContext';
import AnimatedNumber from '../components/AnimatedNumber';

type TabType = 'ranking' | 'details' | 'comparison' | 'department' | 'shift';

// Glass morphism card
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

// Progress bar component
const ProgressBar: React.FC<{ value: number; max?: number; color: string }> = ({ value, max = 100, color }) => (
  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: COLORS.background.tertiary }}>
    <div
      className="h-full rounded-full transition-all duration-1000 ease-out"
      style={{ width: `${(value / max) * 100}%`, background: color }}
    />
  </div>
);

const OfficeAnalysis: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('ranking');
  const [shiftDeptFilter, setShiftDeptFilter] = useState<string>('');
  const { filters } = useFilters();
  const { officeKPIs, loading: officeLoading } = useKPIsByOffice(filters);
  const { departmentKPIs, loading: deptLoading } = useKPIsByDepartment(filters);

  // Apply department filter for shift data
  const shiftFilters = useMemo(() => {
    if (!shiftDeptFilter) return filters;
    return { ...filters, bu_dept_name: shiftDeptFilter };
  }, [filters, shiftDeptFilter]);
  const { shiftKPIs, loading: shiftLoading } = useKPIsByShift(shiftFilters);

  const loading = officeLoading || deptLoading || shiftLoading;

  // Sort offices by finger rate
  const sortedOffices = useMemo(() => {
    if (!officeKPIs) return [];
    return [...officeKPIs].sort((a, b) => b.finger_rate - a.finger_rate);
  }, [officeKPIs]);

  // Calculate summary stats
  const summary = useMemo(() => {
    if (!officeKPIs || officeKPIs.length === 0) return null;

    const meetingTarget = officeKPIs.filter(o => o.finger_rate >= THRESHOLDS.finger_rate.excellent).length;
    const belowTarget = officeKPIs.filter(o => o.finger_rate < THRESHOLDS.finger_rate.good).length;
    const avgFingerRate = officeKPIs.reduce((sum, o) => sum + o.finger_rate, 0) / officeKPIs.length;
    const totalEmployees = officeKPIs.reduce((sum, o) => sum + o.unique_employees, 0);
    const totalHours = officeKPIs.reduce((sum, o) => sum + o.total_hours, 0);

    return {
      meetingTarget,
      belowTarget,
      avgFingerRate: avgFingerRate.toFixed(1),
      totalEmployees,
      totalHours: totalHours.toFixed(0),
      best: sortedOffices[0],
      worst: sortedOffices[sortedOffices.length - 1],
    };
  }, [officeKPIs, sortedOffices]);

  // Sort departments and shifts by finger rate
  const sortedDepartments = useMemo(() => {
    if (!departmentKPIs) return [];
    return [...departmentKPIs].sort((a, b) => b.finger_rate - a.finger_rate);
  }, [departmentKPIs]);

  const sortedShifts = useMemo(() => {
    if (!shiftKPIs) return [];
    return [...shiftKPIs].sort((a, b) => b.finger_rate - a.finger_rate);
  }, [shiftKPIs]);

  const tabs = [
    { id: 'ranking' as TabType, label: 'Ranking', icon: <Trophy size={14} /> },
    { id: 'details' as TabType, label: 'Details', icon: <Building2 size={14} /> },
    { id: 'comparison' as TabType, label: 'Compare', icon: <Target size={14} /> },
    { id: 'department' as TabType, label: 'Department', icon: <Layers size={14} /> },
    { id: 'shift' as TabType, label: 'Shift', icon: <Calendar size={14} /> },
  ];

  // Custom tooltip for bar chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      // Determine the label based on available fields
      const label = data.office || data.department || (data.shift ? `Shift ${data.shift}` : 'Unknown');
      return (
        <div
          className="p-3 rounded-xl shadow-2xl backdrop-blur-md"
          style={{
            background: `${COLORS.background.elevated}f0`,
            border: `1px solid ${COLORS.border.default}`,
          }}
        >
          <p className="font-semibold mb-2 text-sm" style={{ color: COLORS.text.primary }}>{label}</p>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between gap-6">
              <span style={{ color: COLORS.text.secondary }}>Finger Rate:</span>
              <span className="font-bold" style={{ color: getFingerRateStatus(data.finger_rate) }}>
                {data.finger_rate}%
              </span>
            </div>
            <div className="flex justify-between gap-6">
              <span style={{ color: COLORS.text.secondary }}>Entries:</span>
              <span className="font-medium" style={{ color: COLORS.text.primary }}>{data.total_entries?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span style={{ color: COLORS.text.secondary }}>Employees:</span>
              <span className="font-medium" style={{ color: COLORS.text.primary }}>{data.unique_employees}</span>
            </div>
            {data.ot_percentage !== undefined && (
              <div className="flex justify-between gap-6">
                <span style={{ color: COLORS.text.secondary }}>OT %:</span>
                <span className="font-medium" style={{ color: COLORS.text.primary }}>{data.ot_percentage}%</span>
              </div>
            )}
            {data.unique_offices !== undefined && (
              <div className="flex justify-between gap-6">
                <span style={{ color: COLORS.text.secondary }}>Offices:</span>
                <span className="font-medium" style={{ color: COLORS.text.primary }}>{data.unique_offices}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw size={32} className="animate-spin" style={{ color: COLORS.accent.primary }} />
          <p className="text-sm" style={{ color: COLORS.text.secondary }}>Loading office data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${COLORS.accent.primary}30 0%, ${COLORS.accent.primary}10 100%)`,
              border: `1px solid ${COLORS.accent.primary}30`
            }}
          >
            <Building2 size={20} style={{ color: COLORS.accent.primary }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: COLORS.text.primary }}>
              Office Analysis
            </h1>
            <p className="text-xs" style={{ color: COLORS.text.muted }}>
              Performance comparison across all offices
            </p>
          </div>
        </div>
        {summary && (
          <div className="flex items-center gap-2">
            <span
              className="px-3 py-1.5 rounded-full text-xs font-medium"
              style={{
                background: `${COLORS.status.success}15`,
                color: COLORS.status.success,
              }}
            >
              {summary.meetingTarget}/{officeKPIs?.length} Meeting Target
            </span>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <GlassCard glow={COLORS.status.success}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div
                  className="p-2 rounded-lg"
                  style={{ background: `${COLORS.status.success}20` }}
                >
                  <Award size={16} style={{ color: COLORS.status.success }} />
                </div>
                <span className="text-xs" style={{ color: COLORS.text.muted }}>≥95%</span>
              </div>
              <p className="text-xs mb-1" style={{ color: COLORS.text.secondary }}>Meeting Target</p>
              <AnimatedNumber
                value={summary.meetingTarget}
                className="text-2xl font-bold"
                style={{ color: COLORS.status.success }}
              />
              <p className="text-xs mt-1" style={{ color: COLORS.text.muted }}>
                of {officeKPIs?.length} offices
              </p>
            </div>
          </GlassCard>

          <GlassCard glow={COLORS.status.danger}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div
                  className="p-2 rounded-lg"
                  style={{ background: `${COLORS.status.danger}20` }}
                >
                  <AlertTriangle size={16} style={{ color: COLORS.status.danger }} />
                </div>
                <span className="text-xs" style={{ color: COLORS.text.muted }}>&lt;90%</span>
              </div>
              <p className="text-xs mb-1" style={{ color: COLORS.text.secondary }}>Below Target</p>
              <AnimatedNumber
                value={summary.belowTarget}
                className="text-2xl font-bold"
                style={{ color: COLORS.status.danger }}
              />
              <p className="text-xs mt-1" style={{ color: COLORS.text.muted }}>
                need attention
              </p>
            </div>
          </GlassCard>

          <GlassCard glow={COLORS.accent.primary}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div
                  className="p-2 rounded-lg"
                  style={{ background: `${COLORS.accent.primary}20` }}
                >
                  <Users size={16} style={{ color: COLORS.accent.primary }} />
                </div>
              </div>
              <p className="text-xs mb-1" style={{ color: COLORS.text.secondary }}>Total Employees</p>
              <AnimatedNumber
                value={summary.totalEmployees}
                className="text-2xl font-bold"
                style={{ color: COLORS.text.primary }}
              />
              <p className="text-xs mt-1" style={{ color: COLORS.text.muted }}>
                across all offices
              </p>
            </div>
          </GlassCard>

          <GlassCard glow={COLORS.accent.secondary}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div
                  className="p-2 rounded-lg"
                  style={{ background: `${COLORS.accent.secondary}20` }}
                >
                  <Clock size={16} style={{ color: COLORS.accent.secondary }} />
                </div>
              </div>
              <p className="text-xs mb-1" style={{ color: COLORS.text.secondary }}>Total Hours</p>
              <AnimatedNumber
                value={Number(summary.totalHours)}
                className="text-2xl font-bold"
                style={{ color: COLORS.text.primary }}
              />
              <p className="text-xs mt-1" style={{ color: COLORS.text.muted }}>
                hours worked
              </p>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Tabs */}
      <div
        className="inline-flex gap-1 p-1 rounded-xl"
        style={{ background: COLORS.background.secondary, border: `1px solid ${COLORS.border.subtle}` }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              background: activeTab === tab.id
                ? `linear-gradient(135deg, ${COLORS.accent.primary}20 0%, ${COLORS.accent.primary}10 100%)`
                : 'transparent',
              color: activeTab === tab.id ? COLORS.accent.primary : COLORS.text.secondary,
              border: activeTab === tab.id ? `1px solid ${COLORS.accent.primary}30` : '1px solid transparent',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <GlassCard>
        <div className="p-5">
          {activeTab === 'ranking' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Trophy size={16} style={{ color: COLORS.accent.primary }} />
                  <h3 className="text-sm font-semibold" style={{ color: COLORS.text.primary }}>
                    Office Ranking by Finger Rate
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: COLORS.status.success }} />
                    <span style={{ color: COLORS.text.muted }}>≥95%</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: COLORS.status.warning }} />
                    <span style={{ color: COLORS.text.muted }}>90-95%</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: COLORS.status.danger }} />
                    <span style={{ color: COLORS.text.muted }}>&lt;90%</span>
                  </span>
                </div>
              </div>

              {sortedOffices.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={sortedOffices} layout="vertical" margin={{ left: 10, right: 30 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      vertical={true}
                      stroke={COLORS.chart.grid}
                    />
                    <XAxis
                      type="number"
                      domain={[(dataMin: number) => Math.floor(Math.min(dataMin, 75) / 5) * 5, 100]}
                      tickFormatter={(value) => `${value}%`}
                      fontSize={10}
                      stroke={COLORS.chart.axis}
                      tick={{ fill: COLORS.text.muted }}
                    />
                    <YAxis
                      dataKey="office"
                      type="category"
                      width={100}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: COLORS.text.secondary }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine x={95} stroke={COLORS.status.success} strokeDasharray="4 4" strokeWidth={1.5} />
                    <ReferenceLine x={90} stroke={COLORS.status.warning} strokeDasharray="4 4" strokeWidth={1.5} />
                    <Bar dataKey="finger_rate" radius={[0, 6, 6, 0]} maxBarSize={24}>
                      {sortedOffices.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getFingerRateStatus(entry.finger_rate)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <p className="text-sm" style={{ color: COLORS.text.muted }}>
                    No office data available
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'details' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 size={16} style={{ color: COLORS.accent.primary }} />
                <h3 className="text-sm font-semibold" style={{ color: COLORS.text.primary }}>
                  Office Details
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${COLORS.border.subtle}` }}>
                      <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.text.muted }}>#</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.text.muted }}>Office</th>
                      <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.text.muted }}>Finger</th>
                      <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.text.muted }}>Prov</th>
                      <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.text.muted }}>W-In</th>
                      <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.text.muted }}>Miss</th>
                      <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.text.muted }}>Entries</th>
                      <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.text.muted }}>Emps</th>
                      <th className="py-3 px-3 text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.text.muted }}>Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedOffices.map((office, index) => (
                      <tr
                        key={office.office}
                        className="transition-colors duration-150"
                        style={{
                          borderBottom: `1px solid ${COLORS.border.subtle}`,
                          background: index % 2 === 0 ? 'transparent' : `${COLORS.background.tertiary}30`
                        }}
                      >
                        <td className="py-3 px-3">
                          <span
                            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                            style={{
                              background: index < 3 ? `${COLORS.status.success}20` : COLORS.background.tertiary,
                              color: index < 3 ? COLORS.status.success : COLORS.text.muted
                            }}
                          >
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-sm font-medium" style={{ color: COLORS.text.primary }}>
                          {office.office}
                        </td>
                        <td className="py-3 px-3 text-sm text-right">
                          <span className="font-bold" style={{ color: getFingerRateStatus(office.finger_rate) }}>
                            {office.finger_rate}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-sm text-right" style={{ color: COLORS.text.secondary }}>
                          {office.provisional_rate}%
                        </td>
                        <td className="py-3 px-3 text-sm text-right" style={{ color: COLORS.text.secondary }}>
                          {office.write_in_rate}%
                        </td>
                        <td className="py-3 px-3 text-sm text-right" style={{ color: COLORS.text.secondary }}>
                          {office.missing_co_rate}%
                        </td>
                        <td className="py-3 px-3 text-sm text-right font-medium" style={{ color: COLORS.text.primary }}>
                          {office.total_entries?.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-sm text-right" style={{ color: COLORS.text.secondary }}>
                          {office.unique_employees}
                        </td>
                        <td className="py-3 px-3 w-32">
                          <ProgressBar
                            value={office.finger_rate}
                            color={getFingerRateStatus(office.finger_rate)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'comparison' && summary && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Target size={16} style={{ color: COLORS.accent.primary }} />
                <h3 className="text-sm font-semibold" style={{ color: COLORS.text.primary }}>
                  Best vs Worst Performing
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Best Office */}
                <div
                  className="p-5 rounded-xl relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.status.success}15 0%, transparent 100%)`,
                    border: `1px solid ${COLORS.status.success}30`,
                  }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                    <Trophy size={128} style={{ color: COLORS.status.success }} />
                  </div>
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{ background: `${COLORS.status.success}20` }}
                      >
                        <Award size={16} style={{ color: COLORS.status.success }} />
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.status.success }}>
                        Best Performing
                      </span>
                    </div>
                    <h4 className="text-xl font-bold mb-4" style={{ color: COLORS.text.primary }}>
                      {summary.best?.office}
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs" style={{ color: COLORS.text.secondary }}>Finger Rate</span>
                          <span className="text-sm font-bold" style={{ color: COLORS.status.success }}>
                            {summary.best?.finger_rate}%
                          </span>
                        </div>
                        <ProgressBar value={summary.best?.finger_rate || 0} color={COLORS.status.success} />
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div>
                          <p className="text-xs" style={{ color: COLORS.text.muted }}>Employees</p>
                          <p className="text-lg font-semibold" style={{ color: COLORS.text.primary }}>
                            {summary.best?.unique_employees}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs" style={{ color: COLORS.text.muted }}>Entries</p>
                          <p className="text-lg font-semibold" style={{ color: COLORS.text.primary }}>
                            {summary.best?.total_entries?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Worst Office */}
                <div
                  className="p-5 rounded-xl relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.status.danger}15 0%, transparent 100%)`,
                    border: `1px solid ${COLORS.status.danger}30`,
                  }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                    <AlertTriangle size={128} style={{ color: COLORS.status.danger }} />
                  </div>
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{ background: `${COLORS.status.danger}20` }}
                      >
                        <TrendingDown size={16} style={{ color: COLORS.status.danger }} />
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.status.danger }}>
                        Needs Improvement
                      </span>
                    </div>
                    <h4 className="text-xl font-bold mb-4" style={{ color: COLORS.text.primary }}>
                      {summary.worst?.office}
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs" style={{ color: COLORS.text.secondary }}>Finger Rate</span>
                          <span className="text-sm font-bold" style={{ color: COLORS.status.danger }}>
                            {summary.worst?.finger_rate}%
                          </span>
                        </div>
                        <ProgressBar value={summary.worst?.finger_rate || 0} color={COLORS.status.danger} />
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div>
                          <p className="text-xs" style={{ color: COLORS.text.muted }}>Employees</p>
                          <p className="text-lg font-semibold" style={{ color: COLORS.text.primary }}>
                            {summary.worst?.unique_employees}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs" style={{ color: COLORS.text.muted }}>Entries</p>
                          <p className="text-lg font-semibold" style={{ color: COLORS.text.primary }}>
                            {summary.worst?.total_entries?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gap Analysis */}
              <div
                className="mt-4 p-4 rounded-xl flex items-center justify-between"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.accent.primary}10 0%, transparent 100%)`,
                  border: `1px solid ${COLORS.accent.primary}20`
                }}
              >
                <div className="flex items-center gap-3">
                  <Target size={18} style={{ color: COLORS.accent.primary }} />
                  <div>
                    <h4 className="text-sm font-semibold" style={{ color: COLORS.text.primary }}>
                      Performance Gap
                    </h4>
                    <p className="text-xs" style={{ color: COLORS.text.secondary }}>
                      Difference between best and worst performing offices
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-2xl font-bold" style={{ color: COLORS.accent.primary }}>
                      {((summary.best?.finger_rate || 0) - (summary.worst?.finger_rate || 0)).toFixed(1)}
                    </p>
                    <p className="text-xs" style={{ color: COLORS.text.muted }}>percentage points</p>
                  </div>
                  <ArrowRight size={20} style={{ color: COLORS.accent.primary }} />
                </div>
              </div>
            </div>
          )}

          {/* Department Tab */}
          {activeTab === 'department' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Layers size={16} style={{ color: COLORS.accent.primary }} />
                  <h3 className="text-sm font-semibold" style={{ color: COLORS.text.primary }}>
                    Department Breakdown
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: COLORS.status.success }} />
                    <span style={{ color: COLORS.text.muted }}>≥95%</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: COLORS.status.warning }} />
                    <span style={{ color: COLORS.text.muted }}>90-95%</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: COLORS.status.danger }} />
                    <span style={{ color: COLORS.text.muted }}>&lt;90%</span>
                  </span>
                </div>
              </div>

              {sortedDepartments.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={Math.max(280, sortedDepartments.length * 36)}>
                    <BarChart data={sortedDepartments} layout="vertical" margin={{ left: 10, right: 30 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        vertical={true}
                        stroke={COLORS.chart.grid}
                      />
                      <XAxis
                        type="number"
                        domain={[(dataMin: number) => Math.floor(Math.min(dataMin, 75) / 5) * 5, 100]}
                        tickFormatter={(value) => `${value}%`}
                        fontSize={10}
                        stroke={COLORS.chart.axis}
                        tick={{ fill: COLORS.text.muted }}
                      />
                      <YAxis
                        dataKey="department"
                        type="category"
                        width={150}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: COLORS.text.secondary }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine x={95} stroke={COLORS.status.success} strokeDasharray="4 4" strokeWidth={1.5} />
                      <ReferenceLine x={90} stroke={COLORS.status.warning} strokeDasharray="4 4" strokeWidth={1.5} />
                      <Bar dataKey="finger_rate" radius={[0, 6, 6, 0]} maxBarSize={24}>
                        {sortedDepartments.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getFingerRateStatus(entry.finger_rate)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Department Details Table */}
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ borderBottom: `2px solid ${COLORS.border.subtle}` }}>
                          <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.text.muted }}>#</th>
                          <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.text.muted }}>Department</th>
                          <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.text.muted }}>Finger</th>
                          <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.text.muted }}>Prov</th>
                          <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.text.muted }}>W-In</th>
                          <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.text.muted }}>Entries</th>
                          <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.text.muted }}>Emps</th>
                          <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.text.muted }}>Offices</th>
                          <th className="py-3 px-3 text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.text.muted }}>Progress</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedDepartments.map((dept, index) => (
                          <tr
                            key={dept.department}
                            className="transition-colors duration-150"
                            style={{
                              borderBottom: `1px solid ${COLORS.border.subtle}`,
                              background: index % 2 === 0 ? 'transparent' : `${COLORS.background.tertiary}30`
                            }}
                          >
                            <td className="py-3 px-3">
                              <span
                                className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                                style={{
                                  background: index < 3 ? `${COLORS.status.success}20` : COLORS.background.tertiary,
                                  color: index < 3 ? COLORS.status.success : COLORS.text.muted
                                }}
                              >
                                {index + 1}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-sm font-medium" style={{ color: COLORS.text.primary }}>
                              {dept.department}
                            </td>
                            <td className="py-3 px-3 text-sm text-right">
                              <span className="font-bold" style={{ color: getFingerRateStatus(dept.finger_rate) }}>
                                {dept.finger_rate}%
                              </span>
                            </td>
                            <td className="py-3 px-3 text-sm text-right" style={{ color: COLORS.text.secondary }}>
                              {dept.provisional_rate}%
                            </td>
                            <td className="py-3 px-3 text-sm text-right" style={{ color: COLORS.text.secondary }}>
                              {dept.write_in_rate}%
                            </td>
                            <td className="py-3 px-3 text-sm text-right font-medium" style={{ color: COLORS.text.primary }}>
                              {dept.total_entries?.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-sm text-right" style={{ color: COLORS.text.secondary }}>
                              {dept.unique_employees}
                            </td>
                            <td className="py-3 px-3 text-sm text-right" style={{ color: COLORS.text.secondary }}>
                              {dept.unique_offices}
                            </td>
                            <td className="py-3 px-3 w-32">
                              <ProgressBar
                                value={dept.finger_rate}
                                color={getFingerRateStatus(dept.finger_rate)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <p className="text-sm" style={{ color: COLORS.text.muted }}>
                    No department data available
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Shift Tab */}
          {activeTab === 'shift' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} style={{ color: COLORS.accent.primary }} />
                    <h3 className="text-sm font-semibold" style={{ color: COLORS.text.primary }}>
                      Shift Breakdown
                    </h3>
                  </div>
                  {/* Department Filter */}
                  <select
                    value={shiftDeptFilter}
                    onChange={(e) => setShiftDeptFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer"
                    style={{
                      background: COLORS.background.tertiary,
                      border: `1px solid ${shiftDeptFilter ? COLORS.accent.primary : COLORS.border.subtle}`,
                      color: COLORS.text.primary,
                      outline: 'none',
                    }}
                  >
                    <option value="">All Departments</option>
                    {sortedDepartments.map((dept) => (
                      <option key={dept.department} value={dept.department}>
                        {dept.department}
                      </option>
                    ))}
                  </select>
                  {shiftDeptFilter && (
                    <button
                      onClick={() => setShiftDeptFilter('')}
                      className="px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200"
                      style={{
                        background: `${COLORS.accent.primary}15`,
                        color: COLORS.accent.primary,
                        border: `1px solid ${COLORS.accent.primary}30`,
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: COLORS.status.success }} />
                    <span style={{ color: COLORS.text.muted }}>≥95%</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: COLORS.status.warning }} />
                    <span style={{ color: COLORS.text.muted }}>90-95%</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: COLORS.status.danger }} />
                    <span style={{ color: COLORS.text.muted }}>&lt;90%</span>
                  </span>
                </div>
              </div>

              {/* Active Filter Indicator */}
              {shiftDeptFilter && (
                <div
                  className="mb-4 px-3 py-2 rounded-lg flex items-center gap-2"
                  style={{
                    background: `${COLORS.accent.primary}10`,
                    border: `1px solid ${COLORS.accent.primary}20`,
                  }}
                >
                  <Layers size={14} style={{ color: COLORS.accent.primary }} />
                  <span className="text-xs" style={{ color: COLORS.text.secondary }}>
                    Filtered by department:
                  </span>
                  <span className="text-xs font-semibold" style={{ color: COLORS.accent.primary }}>
                    {shiftDeptFilter}
                  </span>
                </div>
              )}

              {sortedShifts.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={Math.max(200, sortedShifts.length * 40)}>
                    <BarChart data={sortedShifts} layout="vertical" margin={{ left: 10, right: 30 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        vertical={true}
                        stroke={COLORS.chart.grid}
                      />
                      <XAxis
                        type="number"
                        domain={[(dataMin: number) => Math.floor(Math.min(dataMin, 75) / 5) * 5, 100]}
                        tickFormatter={(value) => `${value}%`}
                        fontSize={10}
                        stroke={COLORS.chart.axis}
                        tick={{ fill: COLORS.text.muted }}
                      />
                      <YAxis
                        dataKey="shift"
                        type="category"
                        width={80}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: COLORS.text.secondary }}
                        tickFormatter={(value) => `Shift ${value}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine x={95} stroke={COLORS.status.success} strokeDasharray="4 4" strokeWidth={1.5} />
                      <ReferenceLine x={90} stroke={COLORS.status.warning} strokeDasharray="4 4" strokeWidth={1.5} />
                      <Bar dataKey="finger_rate" radius={[0, 6, 6, 0]} maxBarSize={28}>
                        {sortedShifts.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getFingerRateStatus(entry.finger_rate)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Shift Details Table */}
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ borderBottom: `2px solid ${COLORS.border.subtle}` }}>
                          <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.text.muted }}>#</th>
                          <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.text.muted }}>Shift</th>
                          <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.text.muted }}>Finger</th>
                          <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.text.muted }}>Prov</th>
                          <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.text.muted }}>W-In</th>
                          <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.text.muted }}>Miss</th>
                          <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.text.muted }}>Entries</th>
                          <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.text.muted }}>Emps</th>
                          <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.text.muted }}>Hours</th>
                          <th className="py-3 px-3 text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.text.muted }}>Progress</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedShifts.map((shift, index) => (
                          <tr
                            key={shift.shift}
                            className="transition-colors duration-150"
                            style={{
                              borderBottom: `1px solid ${COLORS.border.subtle}`,
                              background: index % 2 === 0 ? 'transparent' : `${COLORS.background.tertiary}30`
                            }}
                          >
                            <td className="py-3 px-3">
                              <span
                                className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                                style={{
                                  background: index < 3 ? `${COLORS.status.success}20` : COLORS.background.tertiary,
                                  color: index < 3 ? COLORS.status.success : COLORS.text.muted
                                }}
                              >
                                {index + 1}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-sm font-medium" style={{ color: COLORS.text.primary }}>
                              Shift {shift.shift}
                            </td>
                            <td className="py-3 px-3 text-sm text-right">
                              <span className="font-bold" style={{ color: getFingerRateStatus(shift.finger_rate) }}>
                                {shift.finger_rate}%
                              </span>
                            </td>
                            <td className="py-3 px-3 text-sm text-right" style={{ color: COLORS.text.secondary }}>
                              {shift.provisional_rate}%
                            </td>
                            <td className="py-3 px-3 text-sm text-right" style={{ color: COLORS.text.secondary }}>
                              {shift.write_in_rate}%
                            </td>
                            <td className="py-3 px-3 text-sm text-right" style={{ color: COLORS.text.secondary }}>
                              {shift.missing_co_rate}%
                            </td>
                            <td className="py-3 px-3 text-sm text-right font-medium" style={{ color: COLORS.text.primary }}>
                              {shift.total_entries?.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-sm text-right" style={{ color: COLORS.text.secondary }}>
                              {shift.unique_employees}
                            </td>
                            <td className="py-3 px-3 text-sm text-right" style={{ color: COLORS.text.secondary }}>
                              {shift.total_hours?.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 w-32">
                              <ProgressBar
                                value={shift.finger_rate}
                                color={getFingerRateStatus(shift.finger_rate)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <p className="text-sm" style={{ color: COLORS.text.muted }}>
                    No shift data available
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default OfficeAnalysis;
