import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Users, Search, AlertTriangle, Fingerprint, CheckCircle, XCircle, UserCheck, UserX, Building2, Clock, Edit3, ArrowLeft, Award, TrendingDown } from 'lucide-react';
import { COLORS, ENTRY_TYPE_COLORS, getFingerRateStatus } from '../constants/colors';
import { useKPIsByEmployee, EmployeeKPI } from '../hooks/useKPIs';
import { useFilters } from '../contexts/FilterContext';
import AnimatedNumber from '../components/AnimatedNumber';

type TabType = 'all' | 'enrollment' | 'search';

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

// Progress bar component
const ProgressBar: React.FC<{ value: number; max?: number; color: string }> = ({ value, max = 100, color }) => (
  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: COLORS.background.tertiary }}>
    <div
      className="h-full rounded-full transition-all duration-1000 ease-out"
      style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color }}
    />
  </div>
);

const EmployeeAnalysis: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyNonFinger, setShowOnlyNonFinger] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeKPI | null>(null);
  const { filters } = useFilters();
  const { employeeKPIs, loading } = useKPIsByEmployee(filters);

  // Filter employees based on search and toggle
  const filteredEmployees = useMemo(() => {
    let result = employeeKPIs;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        emp => emp.full_name.toLowerCase().includes(search) ||
               emp.applicant_id.toLowerCase().includes(search) ||
               emp.office.toLowerCase().includes(search)
      );
    }

    if (showOnlyNonFinger) {
      result = result.filter(emp => emp.non_finger_count > 0);
    }

    return result;
  }, [employeeKPIs, searchTerm, showOnlyNonFinger]);

  // Employees needing enrollment (3+ provisional entries)
  const enrollmentNeeded = useMemo(() => {
    return employeeKPIs.filter(emp => emp.needs_enrollment);
  }, [employeeKPIs]);

  // Summary stats
  const stats = useMemo(() => {
    if (!employeeKPIs || employeeKPIs.length === 0) return null;

    const totalEmployees = employeeKPIs.length;
    const perfectCompliance = employeeKPIs.filter(emp => emp.finger_rate === 100).length;
    const belowTarget = employeeKPIs.filter(emp => emp.finger_rate < 90).length;
    const avgFingerRate = employeeKPIs.reduce((sum, emp) => sum + emp.finger_rate, 0) / totalEmployees;

    return {
      totalEmployees,
      perfectCompliance,
      belowTarget,
      avgFingerRate: avgFingerRate.toFixed(1),
      enrollmentNeeded: enrollmentNeeded.length,
    };
  }, [employeeKPIs, enrollmentNeeded]);

  // Top non-compliant employees for chart
  const chartData = useMemo(() => {
    return employeeKPIs
      .filter(emp => emp.non_finger_count > 0)
      .slice(0, 12)
      .map(emp => ({
        name: emp.full_name.split(' ').slice(0, 2).join(' '),
        fullName: emp.full_name,
        provisional: emp.provisional_count,
        writeIn: emp.write_in_count,
        missingCO: emp.missing_co_count,
        total: emp.non_finger_count,
        fingerRate: emp.finger_rate,
      }));
  }, [employeeKPIs]);

  const tabs = [
    { id: 'all' as TabType, label: 'All Employees', icon: <Users size={14} /> },
    { id: 'enrollment' as TabType, label: `Enrollment (${enrollmentNeeded.length})`, icon: <AlertTriangle size={14} /> },
    { id: 'search' as TabType, label: 'Lookup', icon: <Search size={14} /> },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const emp = chartData.find(d => d.name === label);
      return (
        <div
          className="p-3 rounded-lg shadow-xl backdrop-blur-md"
          style={{
            background: `${COLORS.background.elevated}f0`,
            border: `1px solid ${COLORS.border.default}`,
          }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: COLORS.text.primary }}>
            {emp?.fullName}
          </p>
          <p className="text-xs mb-1" style={{ color: COLORS.text.muted }}>
            Finger Rate: <span className="font-semibold" style={{ color: getFingerRateStatus(emp?.fingerRate || 0) }}>{emp?.fingerRate}%</span>
          </p>
          {payload.map((entry: any, index: number) => {
            const labels: Record<string, string> = {
              provisional: 'Provisional',
              writeIn: 'Write-In',
              missingCO: 'Missing C/O',
            };
            if (entry.value > 0) {
              return (
                <div key={index} className="flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: entry.fill }} />
                    <span style={{ color: COLORS.text.secondary }}>{labels[entry.dataKey]}</span>
                  </div>
                  <span className="font-semibold" style={{ color: entry.fill }}>{entry.value}</span>
                </div>
              );
            }
            return null;
          })}
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
            <Users
              size={24}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ color: COLORS.accent.primary }}
            />
          </div>
          <p className="text-sm" style={{ color: COLORS.text.secondary }}>Loading employee data...</p>
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
          <Users size={22} style={{ color: COLORS.accent.primary }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: COLORS.text.primary }}>
            Employee Analysis
          </h1>
          <p className="text-xs" style={{ color: COLORS.text.muted }}>
            Individual compliance tracking and enrollment management
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <GlassCard glow={COLORS.accent.primary}>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users size={14} style={{ color: COLORS.accent.primary }} />
                <p className="text-xs" style={{ color: COLORS.text.secondary }}>Total Employees</p>
              </div>
              <p className="text-2xl font-bold" style={{ color: COLORS.text.primary }}>
                <AnimatedNumber value={stats.totalEmployees} />
              </p>
            </div>
          </GlassCard>
          <GlassCard glow={getFingerRateStatus(parseFloat(stats.avgFingerRate))}>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Fingerprint size={14} style={{ color: getFingerRateStatus(parseFloat(stats.avgFingerRate)) }} />
                <p className="text-xs" style={{ color: COLORS.text.secondary }}>Avg Finger Rate</p>
              </div>
              <p className="text-2xl font-bold" style={{ color: getFingerRateStatus(parseFloat(stats.avgFingerRate)) }}>
                <AnimatedNumber value={parseFloat(stats.avgFingerRate)} decimals={1} suffix="%" />
              </p>
            </div>
          </GlassCard>
          <GlassCard glow={COLORS.status.success}>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award size={14} style={{ color: COLORS.status.success }} />
                <p className="text-xs" style={{ color: COLORS.text.secondary }}>Perfect Compliance</p>
              </div>
              <p className="text-2xl font-bold" style={{ color: COLORS.status.success }}>
                <AnimatedNumber value={stats.perfectCompliance} />
              </p>
            </div>
          </GlassCard>
          <GlassCard glow={COLORS.status.danger}>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown size={14} style={{ color: COLORS.status.danger }} />
                <p className="text-xs" style={{ color: COLORS.text.secondary }}>Below 90%</p>
              </div>
              <p className="text-2xl font-bold" style={{ color: COLORS.status.danger }}>
                <AnimatedNumber value={stats.belowTarget} />
              </p>
            </div>
          </GlassCard>
          <GlassCard glow={COLORS.status.warning}>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} style={{ color: COLORS.status.warning }} />
                <p className="text-xs" style={{ color: COLORS.text.secondary }}>Needs Enrollment</p>
              </div>
              <p className="text-2xl font-bold" style={{ color: COLORS.status.warning }}>
                <AnimatedNumber value={stats.enrollmentNeeded} />
              </p>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl"
        style={{
          background: COLORS.background.secondary,
          border: `1px solid ${COLORS.border.subtle}`,
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300"
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
        <div className="p-4">
          {activeTab === 'all' && (
            <div className="space-y-4">
              {/* Non-Compliant Chart */}
              {chartData.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingDown size={16} style={{ color: COLORS.status.danger }} />
                    <h3 className="text-sm font-semibold" style={{ color: COLORS.text.primary }}>
                      Top Non-Compliant Employees
                    </h3>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={chartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={COLORS.chart.grid} opacity={0.5} />
                      <XAxis type="number" stroke={COLORS.chart.axis} tick={{ fill: COLORS.text.muted, fontSize: 10 }} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={110}
                        stroke={COLORS.chart.axis}
                        tick={{ fill: COLORS.text.muted, fontSize: 10 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="provisional" stackId="a" fill={ENTRY_TYPE_COLORS['Provisional Entry']} name="provisional" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="writeIn" stackId="a" fill={ENTRY_TYPE_COLORS['Write-In']} name="writeIn" />
                      <Bar dataKey="missingCO" stackId="a" fill={ENTRY_TYPE_COLORS['Missing c/o']} name="missingCO" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Legend */}
                  <div className="flex justify-center gap-6 mt-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded" style={{ background: ENTRY_TYPE_COLORS['Provisional Entry'] }} />
                      <span className="text-xs" style={{ color: COLORS.text.secondary }}>Provisional</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded" style={{ background: ENTRY_TYPE_COLORS['Write-In'] }} />
                      <span className="text-xs" style={{ color: COLORS.text.secondary }}>Write-In</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded" style={{ background: ENTRY_TYPE_COLORS['Missing c/o'] }} />
                      <span className="text-xs" style={{ color: COLORS.text.secondary }}>Missing C/O</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Controls */}
              <div
                className="flex flex-wrap items-center gap-3 p-3 rounded-lg"
                style={{ background: COLORS.background.tertiary }}
              >
                <div className="relative flex-1 min-w-[200px]">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: COLORS.text.muted }}
                  />
                  <input
                    type="text"
                    placeholder="Search by name, ID, or office..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg text-sm"
                    style={{
                      background: COLORS.background.secondary,
                      border: `1px solid ${COLORS.border.subtle}`,
                      color: COLORS.text.primary,
                    }}
                  />
                </div>
                <label
                  className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors"
                  style={{
                    background: showOnlyNonFinger ? `${COLORS.accent.primary}20` : COLORS.background.secondary,
                    border: `1px solid ${showOnlyNonFinger ? COLORS.accent.primary : COLORS.border.subtle}`,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={showOnlyNonFinger}
                    onChange={(e) => setShowOnlyNonFinger(e.target.checked)}
                    className="w-3.5 h-3.5 rounded"
                  />
                  <span className="text-xs font-medium" style={{ color: showOnlyNonFinger ? COLORS.accent.primary : COLORS.text.secondary }}>
                    Non-finger only
                  </span>
                </label>
                <span
                  className="px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ background: COLORS.background.secondary, color: COLORS.text.muted }}
                >
                  {filteredEmployees.length} of {employeeKPIs.length}
                </span>
              </div>

              {/* Employee Table */}
              <div
                className="overflow-auto rounded-lg"
                style={{
                  maxHeight: '400px',
                  border: `1px solid ${COLORS.border.subtle}`,
                }}
              >
                <table className="w-full">
                  <thead
                    className="sticky top-0 z-10"
                    style={{ background: COLORS.background.tertiary }}
                  >
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold" style={{ color: COLORS.text.secondary }}>
                        <div className="flex items-center gap-1.5">
                          <Users size={12} />
                          Employee
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold" style={{ color: COLORS.text.secondary }}>
                        <div className="flex items-center gap-1.5">
                          <Building2 size={12} />
                          Office
                        </div>
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold" style={{ color: ENTRY_TYPE_COLORS['Finger'] }}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Fingerprint size={12} />
                          Finger
                        </div>
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold" style={{ color: ENTRY_TYPE_COLORS['Provisional Entry'] }}>Prov</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold" style={{ color: ENTRY_TYPE_COLORS['Write-In'] }}>W-In</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold" style={{ color: ENTRY_TYPE_COLORS['Missing c/o'] }}>Miss</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold" style={{ color: COLORS.text.secondary }}>Total</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold" style={{ color: COLORS.text.secondary }}>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.slice(0, 100).map((emp, index) => (
                      <tr
                        key={emp.applicant_id}
                        className="transition-colors cursor-pointer hover:bg-opacity-50"
                        style={{
                          background: index % 2 === 0 ? 'transparent' : `${COLORS.background.tertiary}40`,
                          borderBottom: `1px solid ${COLORS.border.subtle}`,
                        }}
                        onClick={() => {
                          setSelectedEmployee(emp);
                          setActiveTab('search');
                        }}
                      >
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                              style={{
                                background: emp.finger_rate >= 95 ? `${COLORS.status.success}20` : emp.finger_rate >= 90 ? `${COLORS.status.warning}20` : `${COLORS.status.danger}20`,
                                color: getFingerRateStatus(emp.finger_rate),
                              }}
                            >
                              {emp.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-sm font-medium" style={{ color: COLORS.text.primary }}>
                                {emp.full_name}
                              </p>
                              <p className="text-xs" style={{ color: COLORS.text.muted }}>
                                {emp.applicant_id}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-xs" style={{ color: COLORS.text.secondary }}>
                          {emp.office}
                        </td>
                        <td className="py-2.5 px-4 text-sm text-right font-medium" style={{ color: ENTRY_TYPE_COLORS['Finger'] }}>
                          {emp.finger_count}
                        </td>
                        <td className="py-2.5 px-4 text-sm text-right" style={{ color: emp.provisional_count > 0 ? ENTRY_TYPE_COLORS['Provisional Entry'] : COLORS.text.muted }}>
                          {emp.provisional_count > 0 ? emp.provisional_count : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-sm text-right" style={{ color: emp.write_in_count > 0 ? ENTRY_TYPE_COLORS['Write-In'] : COLORS.text.muted }}>
                          {emp.write_in_count > 0 ? emp.write_in_count : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-sm text-right" style={{ color: emp.missing_co_count > 0 ? ENTRY_TYPE_COLORS['Missing c/o'] : COLORS.text.muted }}>
                          {emp.missing_co_count > 0 ? emp.missing_co_count : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-sm text-right" style={{ color: COLORS.text.secondary }}>
                          {emp.total_entries}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <span
                            className="inline-block px-2 py-0.5 rounded-full text-xs font-bold"
                            style={{
                              background: `${getFingerRateStatus(emp.finger_rate)}20`,
                              color: getFingerRateStatus(emp.finger_rate),
                            }}
                          >
                            {emp.finger_rate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredEmployees.length > 100 && (
                <p className="text-center py-2 text-xs" style={{ color: COLORS.text.muted }}>
                  Showing first 100 of {filteredEmployees.length}. Use search to narrow results.
                </p>
              )}
            </div>
          )}

          {activeTab === 'enrollment' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="p-2 rounded-lg"
                  style={{ background: `${COLORS.status.warning}20`, border: `1px solid ${COLORS.status.warning}30` }}
                >
                  <AlertTriangle size={18} style={{ color: COLORS.status.warning }} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: COLORS.text.primary }}>
                    Employees Needing Fingerprint Enrollment
                  </h3>
                  <p className="text-xs" style={{ color: COLORS.text.muted }}>
                    Employees with 3+ provisional entries may need fingerprint re-enrollment.
                  </p>
                </div>
              </div>

              {enrollmentNeeded.length > 0 ? (
                <div
                  className="overflow-auto rounded-lg"
                  style={{
                    maxHeight: '450px',
                    border: `1px solid ${COLORS.border.subtle}`,
                  }}
                >
                  <table className="w-full">
                    <thead
                      className="sticky top-0 z-10"
                      style={{ background: COLORS.background.tertiary }}
                    >
                      <tr>
                        <th className="text-left py-3 px-4 text-xs font-semibold" style={{ color: COLORS.text.secondary }}>Employee</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold" style={{ color: COLORS.text.secondary }}>Office</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold" style={{ color: ENTRY_TYPE_COLORS['Provisional Entry'] }}>Provisional</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold" style={{ color: COLORS.text.secondary }}>Total Entries</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold" style={{ color: COLORS.text.secondary }}>Finger Rate</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold" style={{ color: COLORS.text.secondary }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollmentNeeded.map((emp, index) => (
                        <tr
                          key={emp.applicant_id}
                          className="transition-colors cursor-pointer hover:bg-opacity-50"
                          style={{
                            background: index % 2 === 0 ? 'transparent' : `${COLORS.background.tertiary}40`,
                            borderBottom: `1px solid ${COLORS.border.subtle}`,
                          }}
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setActiveTab('search');
                          }}
                        >
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center"
                                style={{ background: `${COLORS.status.warning}20` }}
                              >
                                <UserX size={14} style={{ color: COLORS.status.warning }} />
                              </div>
                              <div>
                                <p className="text-sm font-medium" style={{ color: COLORS.text.primary }}>
                                  {emp.full_name}
                                </p>
                                <p className="text-xs" style={{ color: COLORS.text.muted }}>
                                  {emp.applicant_id}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-xs" style={{ color: COLORS.text.secondary }}>
                            {emp.office}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <span
                              className="inline-block px-2 py-1 rounded-lg text-sm font-bold"
                              style={{
                                background: `${ENTRY_TYPE_COLORS['Provisional Entry']}20`,
                                color: ENTRY_TYPE_COLORS['Provisional Entry'],
                              }}
                            >
                              {emp.provisional_count}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-sm text-right" style={{ color: COLORS.text.secondary }}>
                            {emp.total_entries}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <span
                              className="text-sm font-semibold"
                              style={{ color: getFingerRateStatus(emp.finger_rate) }}
                            >
                              {emp.finger_rate}%
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                              style={{
                                background: `${COLORS.status.warning}20`,
                                color: COLORS.status.warning,
                              }}
                            >
                              <AlertTriangle size={10} />
                              Action Needed
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div
                  className="text-center py-12 rounded-xl relative overflow-hidden"
                  style={{ background: COLORS.background.tertiary }}
                >
                  <div className="absolute inset-0 opacity-5">
                    <CheckCircle
                      size={200}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                      style={{ color: COLORS.status.success }}
                    />
                  </div>
                  <CheckCircle size={48} className="mx-auto mb-4" style={{ color: COLORS.status.success }} />
                  <p className="text-lg font-bold" style={{ color: COLORS.text.primary }}>
                    No Enrollment Issues
                  </p>
                  <p className="text-sm mt-2" style={{ color: COLORS.text.secondary }}>
                    All employees have acceptable provisional entry counts.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'search' && (
            <div className="space-y-4">
              {!selectedEmployee ? (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <Search size={16} style={{ color: COLORS.accent.primary }} />
                    <h3 className="text-sm font-semibold" style={{ color: COLORS.text.primary }}>
                      Employee Lookup
                    </h3>
                  </div>

                  <div className="relative max-w-lg">
                    <Search
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2"
                      style={{ color: COLORS.text.muted }}
                    />
                    <input
                      type="text"
                      placeholder="Search by name or ID..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setSelectedEmployee(null);
                      }}
                      className="w-full pl-12 pr-4 py-3 rounded-xl text-sm"
                      style={{
                        background: COLORS.background.tertiary,
                        border: `1px solid ${COLORS.border.subtle}`,
                        color: COLORS.text.primary,
                      }}
                    />
                  </div>

                  {searchTerm && (
                    <div className="space-y-2 mt-4">
                      {filteredEmployees.slice(0, 10).map((emp) => (
                        <button
                          key={emp.applicant_id}
                          onClick={() => setSelectedEmployee(emp)}
                          className="w-full text-left p-4 rounded-xl transition-all duration-200 hover:scale-[1.01]"
                          style={{
                            background: COLORS.background.tertiary,
                            border: `1px solid ${COLORS.border.subtle}`,
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                                style={{
                                  background: `${getFingerRateStatus(emp.finger_rate)}20`,
                                  color: getFingerRateStatus(emp.finger_rate),
                                }}
                              >
                                {emp.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                              <div>
                                <p className="font-medium" style={{ color: COLORS.text.primary }}>
                                  {emp.full_name}
                                </p>
                                <p className="text-sm" style={{ color: COLORS.text.muted }}>
                                  {emp.applicant_id} • {emp.office}
                                </p>
                              </div>
                            </div>
                            <div
                              className="text-xl font-bold px-3 py-1 rounded-lg"
                              style={{
                                background: `${getFingerRateStatus(emp.finger_rate)}20`,
                                color: getFingerRateStatus(emp.finger_rate),
                              }}
                            >
                              {emp.finger_rate}%
                            </div>
                          </div>
                        </button>
                      ))}
                      {filteredEmployees.length === 0 && (
                        <p className="text-center py-8" style={{ color: COLORS.text.muted }}>
                          No employees found matching "{searchTerm}"
                        </p>
                      )}
                    </div>
                  )}

                  {!searchTerm && (
                    <div
                      className="text-center py-16 rounded-xl relative overflow-hidden"
                      style={{ background: COLORS.background.tertiary }}
                    >
                      <div className="absolute inset-0 opacity-5">
                        <Users
                          size={200}
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                          style={{ color: COLORS.accent.primary }}
                        />
                      </div>
                      <Search size={48} className="mx-auto mb-4" style={{ color: COLORS.text.muted }} />
                      <p className="text-lg font-bold" style={{ color: COLORS.text.primary }}>
                        Search for an Employee
                      </p>
                      <p className="text-sm mt-2" style={{ color: COLORS.text.secondary }}>
                        Enter a name or ID to view detailed metrics
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  {/* Back Button */}
                  <button
                    onClick={() => setSelectedEmployee(null)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:translate-x-[-2px]"
                    style={{
                      background: COLORS.background.tertiary,
                      color: COLORS.text.secondary,
                      border: `1px solid ${COLORS.border.subtle}`,
                    }}
                  >
                    <ArrowLeft size={14} />
                    Back to Search
                  </button>

                  {/* Employee Profile Card */}
                  <div
                    className="rounded-xl p-6 relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.background.tertiary} 0%, ${COLORS.background.secondary} 100%)`,
                      border: `1px solid ${COLORS.border.default}`,
                    }}
                  >
                    {/* Background Icon */}
                    <div className="absolute top-4 right-4 opacity-5">
                      <Users size={120} style={{ color: COLORS.accent.primary }} />
                    </div>

                    <div className="flex items-start justify-between mb-6 relative z-10">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold"
                          style={{
                            background: `linear-gradient(135deg, ${getFingerRateStatus(selectedEmployee.finger_rate)}30 0%, ${getFingerRateStatus(selectedEmployee.finger_rate)}10 100%)`,
                            color: getFingerRateStatus(selectedEmployee.finger_rate),
                            border: `2px solid ${getFingerRateStatus(selectedEmployee.finger_rate)}50`,
                          }}
                        >
                          {selectedEmployee.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <h4 className="text-2xl font-bold" style={{ color: COLORS.text.primary }}>
                            {selectedEmployee.full_name}
                          </h4>
                          <p className="text-sm mt-1" style={{ color: COLORS.text.muted }}>
                            ID: {selectedEmployee.applicant_id}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Building2 size={12} style={{ color: COLORS.text.secondary }} />
                            <p className="text-sm" style={{ color: COLORS.text.secondary }}>
                              {selectedEmployee.office}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className="text-5xl font-bold"
                          style={{ color: getFingerRateStatus(selectedEmployee.finger_rate) }}
                        >
                          <AnimatedNumber value={selectedEmployee.finger_rate} suffix="%" />
                        </p>
                        <p className="text-sm" style={{ color: COLORS.text.muted }}>Finger Rate</p>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <GlassCard>
                        <div className="p-4 text-center">
                          <p className="text-xs" style={{ color: COLORS.text.muted }}>Total Entries</p>
                          <p className="text-2xl font-bold mt-1" style={{ color: COLORS.text.primary }}>
                            <AnimatedNumber value={selectedEmployee.total_entries} />
                          </p>
                        </div>
                      </GlassCard>
                      <GlassCard>
                        <div className="p-4 text-center">
                          <p className="text-xs" style={{ color: COLORS.text.muted }}>Total Hours</p>
                          <p className="text-2xl font-bold mt-1" style={{ color: COLORS.text.primary }}>
                            <AnimatedNumber value={selectedEmployee.total_hours} decimals={1} />
                          </p>
                        </div>
                      </GlassCard>
                      <GlassCard glow={COLORS.status.danger}>
                        <div className="p-4 text-center">
                          <p className="text-xs" style={{ color: COLORS.text.muted }}>Non-Finger</p>
                          <p className="text-2xl font-bold mt-1" style={{ color: selectedEmployee.non_finger_count > 0 ? COLORS.status.danger : COLORS.status.success }}>
                            <AnimatedNumber value={selectedEmployee.non_finger_count} />
                          </p>
                        </div>
                      </GlassCard>
                      <GlassCard glow={selectedEmployee.needs_enrollment ? COLORS.status.danger : COLORS.status.success}>
                        <div className="p-4 text-center">
                          <p className="text-xs" style={{ color: COLORS.text.muted }}>Enrollment</p>
                          {selectedEmployee.needs_enrollment ? (
                            <div className="flex items-center justify-center gap-2 mt-2">
                              <XCircle size={20} style={{ color: COLORS.status.danger }} />
                              <span className="font-bold" style={{ color: COLORS.status.danger }}>Needed</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2 mt-2">
                              <CheckCircle size={20} style={{ color: COLORS.status.success }} />
                              <span className="font-bold" style={{ color: COLORS.status.success }}>OK</span>
                            </div>
                          )}
                        </div>
                      </GlassCard>
                    </div>

                    {/* Entry Type Breakdown */}
                    <div
                      className="rounded-xl p-4"
                      style={{ background: COLORS.background.secondary }}
                    >
                      <h5 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: COLORS.text.primary }}>
                        <Fingerprint size={14} style={{ color: COLORS.accent.primary }} />
                        Entry Type Breakdown
                      </h5>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Fingerprint size={16} style={{ color: ENTRY_TYPE_COLORS['Finger'] }} />
                              <span className="text-sm" style={{ color: COLORS.text.secondary }}>Finger</span>
                            </div>
                            <span className="text-sm font-bold" style={{ color: ENTRY_TYPE_COLORS['Finger'] }}>
                              {selectedEmployee.finger_count}
                            </span>
                          </div>
                          <ProgressBar
                            value={selectedEmployee.finger_count}
                            max={selectedEmployee.total_entries}
                            color={ENTRY_TYPE_COLORS['Finger']}
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <AlertTriangle size={16} style={{ color: ENTRY_TYPE_COLORS['Provisional Entry'] }} />
                              <span className="text-sm" style={{ color: COLORS.text.secondary }}>Provisional</span>
                            </div>
                            <span className="text-sm font-bold" style={{ color: ENTRY_TYPE_COLORS['Provisional Entry'] }}>
                              {selectedEmployee.provisional_count}
                            </span>
                          </div>
                          <ProgressBar
                            value={selectedEmployee.provisional_count}
                            max={selectedEmployee.total_entries}
                            color={ENTRY_TYPE_COLORS['Provisional Entry']}
                          />
                        </div>
                        {selectedEmployee.write_in_count > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Edit3 size={16} style={{ color: ENTRY_TYPE_COLORS['Write-In'] }} />
                                <span className="text-sm" style={{ color: COLORS.text.secondary }}>Write-In</span>
                              </div>
                              <span className="text-sm font-bold" style={{ color: ENTRY_TYPE_COLORS['Write-In'] }}>
                                {selectedEmployee.write_in_count}
                              </span>
                            </div>
                            <ProgressBar
                              value={selectedEmployee.write_in_count}
                              max={selectedEmployee.total_entries}
                              color={ENTRY_TYPE_COLORS['Write-In']}
                            />
                          </div>
                        )}
                        {selectedEmployee.missing_co_count > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Clock size={16} style={{ color: ENTRY_TYPE_COLORS['Missing c/o'] }} />
                                <span className="text-sm" style={{ color: COLORS.text.secondary }}>Missing C/O</span>
                              </div>
                              <span className="text-sm font-bold" style={{ color: ENTRY_TYPE_COLORS['Missing c/o'] }}>
                                {selectedEmployee.missing_co_count}
                              </span>
                            </div>
                            <ProgressBar
                              value={selectedEmployee.missing_co_count}
                              max={selectedEmployee.total_entries}
                              color={ENTRY_TYPE_COLORS['Missing c/o']}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default EmployeeAnalysis;
