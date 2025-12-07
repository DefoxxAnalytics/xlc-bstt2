/**
 * Entry Type Analysis Page - Distribution and Trends of Time Entry Methods
 *
 * NOTE: ISO Week Number Alignment
 * The "Weekly Trend" tab uses ISO week numbers to group data across offices
 * with different week ending days:
 * - Martinsburg: Saturday week endings → ISO week X
 * - Other offices: Sunday week endings → ISO week X (same week)
 *
 * This ensures the weekly trend chart accurately reflects cross-office
 * performance for each ISO week period.
 */
import React, { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ReferenceLine
} from 'recharts';
import { FileType, Fingerprint, AlertTriangle, Edit3, Clock, PieChart as PieChartIcon, TrendingUp, Building2, Target, CheckCircle2 } from 'lucide-react';
import { COLORS, ENTRY_TYPE_COLORS } from '../constants/colors';
import { useKPIs, useKPIsByWeek, useKPIsByOffice } from '../hooks/useKPIs';
import { useFilters } from '../contexts/FilterContext';
import AnimatedNumber from '../components/AnimatedNumber';

type TabType = 'distribution' | 'weekly' | 'by-office';

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

// Progress ring component for visual indicators
const ProgressRing: React.FC<{ value: number; max?: number; color: string; size?: number }> = ({
  value, max = 100, color, size = 60
}) => {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={COLORS.background.tertiary}
        strokeWidth="4"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
};

const EntryTypeAnalysis: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('distribution');
  const { filters } = useFilters();
  const { kpis, loading: kpisLoading } = useKPIs(filters);
  const { weeklyKPIs, loading: weeklyLoading } = useKPIsByWeek(filters);
  const { officeKPIs, loading: officeLoading } = useKPIsByOffice(filters);

  const loading = kpisLoading || weeklyLoading || officeLoading;

  // Prepare pie chart data
  const pieData = useMemo(() => {
    if (!kpis) return [];
    return [
      { name: 'Finger', value: kpis.finger_rate, color: ENTRY_TYPE_COLORS['Finger'], count: Math.round(kpis.total_entries * kpis.finger_rate / 100) },
      { name: 'Provisional', value: kpis.provisional_rate, color: ENTRY_TYPE_COLORS['Provisional Entry'], count: Math.round(kpis.total_entries * kpis.provisional_rate / 100) },
      { name: 'Write-In', value: kpis.write_in_rate, color: ENTRY_TYPE_COLORS['Write-In'], count: Math.round(kpis.total_entries * kpis.write_in_rate / 100) },
      { name: 'Missing C/O', value: kpis.missing_co_rate, color: ENTRY_TYPE_COLORS['Missing c/o'], count: Math.round(kpis.total_entries * kpis.missing_co_rate / 100) },
    ].filter(d => d.value > 0);
  }, [kpis]);

  // Entry type cards data
  const entryTypeCards = useMemo(() => {
    if (!kpis) return [];
    return [
      {
        name: 'Finger',
        rate: kpis.finger_rate,
        icon: <Fingerprint size={18} />,
        color: ENTRY_TYPE_COLORS['Finger'],
        description: 'Biometric clock entries',
        target: 95,
        isGood: (rate: number) => rate >= 95,
      },
      {
        name: 'Provisional',
        rate: kpis.provisional_rate,
        icon: <AlertTriangle size={18} />,
        color: ENTRY_TYPE_COLORS['Provisional Entry'],
        description: 'Temporary entries awaiting verification',
        target: 1,
        isGood: (rate: number) => rate <= 1,
      },
      {
        name: 'Write-In',
        rate: kpis.write_in_rate,
        icon: <Edit3 size={18} />,
        color: ENTRY_TYPE_COLORS['Write-In'],
        description: 'Manual time entries',
        target: 3,
        isGood: (rate: number) => rate <= 3,
      },
      {
        name: 'Missing C/O',
        rate: kpis.missing_co_rate,
        icon: <Clock size={18} />,
        color: ENTRY_TYPE_COLORS['Missing c/o'],
        description: 'Missing clock-out records',
        target: 2,
        isGood: (rate: number) => rate <= 2,
      },
    ];
  }, [kpis]);

  const tabs = [
    { id: 'distribution' as TabType, label: 'Distribution', icon: <PieChartIcon size={14} /> },
    { id: 'weekly' as TabType, label: 'Weekly Trend', icon: <TrendingUp size={14} /> },
    { id: 'by-office' as TabType, label: 'By Office', icon: <Building2 size={14} /> },
  ];

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className="p-3 rounded-lg shadow-xl backdrop-blur-md"
          style={{
            background: `${COLORS.background.elevated}f0`,
            border: `1px solid ${COLORS.border.default}`,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: data.color }} />
            <p className="font-semibold text-sm" style={{ color: data.color }}>{data.name}</p>
          </div>
          <p className="text-sm" style={{ color: COLORS.text.secondary }}>
            Rate: <span className="font-semibold" style={{ color: COLORS.text.primary }}>{data.value.toFixed(2)}%</span>
          </p>
          <p className="text-sm" style={{ color: COLORS.text.secondary }}>
            Count: <span className="font-semibold" style={{ color: COLORS.text.primary }}>{data.count?.toLocaleString()}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomAreaTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Add T12:00:00 to avoid UTC-to-local timezone shift
      const date = new Date(label + 'T12:00:00');
      return (
        <div
          className="p-3 rounded-lg shadow-xl backdrop-blur-md"
          style={{
            background: `${COLORS.background.elevated}f0`,
            border: `1px solid ${COLORS.border.default}`,
          }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: COLORS.text.primary }}>
            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
                <span style={{ color: COLORS.text.secondary }}>{entry.name}</span>
              </div>
              <span className="font-semibold" style={{ color: entry.color }}>{entry.value?.toFixed(1)}%</span>
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
            <FileType
              size={24}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ color: COLORS.accent.primary }}
            />
          </div>
          <p className="text-sm" style={{ color: COLORS.text.secondary }}>Loading entry type data...</p>
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
          <FileType size={22} style={{ color: COLORS.accent.primary }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: COLORS.text.primary }}>
            Entry Type Analysis
          </h1>
          <p className="text-xs" style={{ color: COLORS.text.muted }}>
            Distribution and trends of time entry methods
          </p>
        </div>
      </div>

      {/* Entry Type Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {entryTypeCards.map((card) => {
          const isOnTarget = card.isGood(card.rate);
          return (
            <GlassCard key={card.name} glow={card.color}>
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{
                      background: `${card.color}15`,
                      border: `1px solid ${card.color}30`,
                    }}
                  >
                    <span style={{ color: card.color }}>{card.icon}</span>
                  </div>
                  {isOnTarget && (
                    <CheckCircle2 size={16} style={{ color: COLORS.status.success }} />
                  )}
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: COLORS.text.secondary }}>
                      {card.name}
                    </p>
                    <p className="text-2xl font-bold" style={{ color: card.color }}>
                      <AnimatedNumber value={card.rate} decimals={1} suffix="%" />
                    </p>
                  </div>
                  <div className="relative">
                    <ProgressRing
                      value={card.name === 'Finger' ? card.rate : Math.max(0, 100 - card.rate * 10)}
                      color={card.color}
                      size={48}
                    />
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ color: COLORS.text.muted, fontSize: '10px' }}
                    >
                      <Target size={14} />
                    </div>
                  </div>
                </div>
                <p className="text-xs mt-2" style={{ color: COLORS.text.muted }}>
                  {card.description}
                </p>
                <div
                  className="mt-2 pt-2 flex items-center justify-between text-xs"
                  style={{ borderTop: `1px solid ${COLORS.border.subtle}` }}
                >
                  <span style={{ color: COLORS.text.muted }}>Target</span>
                  <span style={{ color: isOnTarget ? COLORS.status.success : COLORS.status.warning }}>
                    {card.name === 'Finger' ? `≥${card.target}%` : `≤${card.target}%`}
                  </span>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

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
          {activeTab === 'distribution' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <PieChartIcon size={16} style={{ color: COLORS.accent.primary }} />
                  <h3 className="text-sm font-semibold" style={{ color: COLORS.text.primary }}>
                    Entry Type Distribution
                  </h3>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      labelLine={false}
                      label={({ name, percent }) => {
                        const pct = percent ?? 0;
                        return pct > 0.03 ? `${(pct * 100).toFixed(0)}%` : '';
                      }}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke={COLORS.background.primary}
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-4 mt-2">
                  {pieData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
                      <span className="text-xs" style={{ color: COLORS.text.secondary }}>{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Stats */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Target size={16} style={{ color: COLORS.accent.primary }} />
                  <h3 className="text-sm font-semibold" style={{ color: COLORS.text.primary }}>
                    Entry Breakdown
                  </h3>
                </div>
                <div className="space-y-2">
                  {pieData.map((entry, index) => (
                    <div
                      key={entry.name}
                      className="flex items-center justify-between p-3 rounded-lg text-sm transition-all duration-200 hover:scale-[1.01]"
                      style={{
                        background: index % 2 === 0 ? COLORS.background.tertiary : `${COLORS.background.tertiary}80`,
                        borderLeft: `3px solid ${entry.color}`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: `${entry.color}20` }}
                        >
                          <div className="w-3 h-3 rounded-full" style={{ background: entry.color }} />
                        </div>
                        <span className="font-medium" style={{ color: COLORS.text.primary }}>{entry.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold" style={{ color: entry.color }}>
                          <AnimatedNumber value={entry.value} decimals={2} suffix="%" />
                        </p>
                        <p className="text-xs" style={{ color: COLORS.text.muted }}>
                          <AnimatedNumber value={entry.count || 0} /> entries
                        </p>
                      </div>
                    </div>
                  ))}

                  {kpis && (
                    <div
                      className="mt-4 p-4 rounded-xl relative overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, ${COLORS.accent.primary}15 0%, ${COLORS.accent.primary}05 100%)`,
                        border: `1px solid ${COLORS.accent.primary}30`,
                      }}
                    >
                      <div className="absolute top-2 right-2 opacity-10">
                        <FileType size={48} style={{ color: COLORS.accent.primary }} />
                      </div>
                      <p className="text-xs font-medium" style={{ color: COLORS.text.secondary }}>Total Entries</p>
                      <p className="text-3xl font-bold mt-1" style={{ color: COLORS.text.primary }}>
                        <AnimatedNumber value={kpis.total_entries} />
                      </p>
                      <p className="text-xs mt-1" style={{ color: COLORS.text.muted }}>
                        Across all entry types
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'weekly' && weeklyKPIs && weeklyKPIs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} style={{ color: COLORS.accent.primary }} />
                <h3 className="text-sm font-semibold" style={{ color: COLORS.text.primary }}>
                  Entry Types Over Time
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={weeklyKPIs}>
                  <defs>
                    <linearGradient id="fingerGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={ENTRY_TYPE_COLORS['Finger']} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={ENTRY_TYPE_COLORS['Finger']} stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="provGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={ENTRY_TYPE_COLORS['Provisional Entry']} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={ENTRY_TYPE_COLORS['Provisional Entry']} stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="writeInGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={ENTRY_TYPE_COLORS['Write-In']} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={ENTRY_TYPE_COLORS['Write-In']} stopOpacity={0.05} />
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
                    domain={[0, 100]}
                    fontSize={11}
                    stroke={COLORS.chart.axis}
                    tick={{ fill: COLORS.text.muted }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <ReferenceLine
                    y={95}
                    stroke={COLORS.status.success}
                    strokeDasharray="4 4"
                    strokeOpacity={0.7}
                    label={{
                      value: '95% Target',
                      position: 'right',
                      fill: COLORS.status.success,
                      fontSize: 10,
                    }}
                  />
                  <Tooltip content={<CustomAreaTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="finger_rate"
                    stroke={ENTRY_TYPE_COLORS['Finger']}
                    strokeWidth={2}
                    fill="url(#fingerGradient)"
                    name="Finger"
                  />
                  <Area
                    type="monotone"
                    dataKey="provisional_rate"
                    stroke={ENTRY_TYPE_COLORS['Provisional Entry']}
                    strokeWidth={2}
                    fill="url(#provGradient)"
                    name="Provisional"
                  />
                  <Area
                    type="monotone"
                    dataKey="write_in_rate"
                    stroke={ENTRY_TYPE_COLORS['Write-In']}
                    strokeWidth={2}
                    fill="url(#writeInGradient)"
                    name="Write-In"
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span style={{ color: COLORS.text.secondary, fontSize: '12px' }}>{value}</span>
                    )}
                  />
                </AreaChart>
              </ResponsiveContainer>

              {/* Weekly Summary Cards */}
              {weeklyKPIs.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div
                    className="p-3 rounded-lg text-center"
                    style={{ background: COLORS.background.tertiary }}
                  >
                    <p className="text-xs" style={{ color: COLORS.text.muted }}>Avg Finger Rate</p>
                    <p className="text-lg font-bold" style={{ color: ENTRY_TYPE_COLORS['Finger'] }}>
                      <AnimatedNumber
                        value={weeklyKPIs.reduce((sum, w) => sum + w.finger_rate, 0) / weeklyKPIs.length}
                        decimals={1}
                        suffix="%"
                      />
                    </p>
                  </div>
                  <div
                    className="p-3 rounded-lg text-center"
                    style={{ background: COLORS.background.tertiary }}
                  >
                    <p className="text-xs" style={{ color: COLORS.text.muted }}>Avg Provisional</p>
                    <p className="text-lg font-bold" style={{ color: ENTRY_TYPE_COLORS['Provisional Entry'] }}>
                      <AnimatedNumber
                        value={weeklyKPIs.reduce((sum, w) => sum + w.provisional_rate, 0) / weeklyKPIs.length}
                        decimals={2}
                        suffix="%"
                      />
                    </p>
                  </div>
                  <div
                    className="p-3 rounded-lg text-center"
                    style={{ background: COLORS.background.tertiary }}
                  >
                    <p className="text-xs" style={{ color: COLORS.text.muted }}>Weeks Analyzed</p>
                    <p className="text-lg font-bold" style={{ color: COLORS.accent.primary }}>
                      <AnimatedNumber value={weeklyKPIs.length} />
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'by-office' && officeKPIs && officeKPIs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 size={16} style={{ color: COLORS.accent.primary }} />
                <h3 className="text-sm font-semibold" style={{ color: COLORS.text.primary }}>
                  Entry Types by Office
                </h3>
              </div>
              <div className="overflow-x-auto rounded-lg" style={{ border: `1px solid ${COLORS.border.subtle}` }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ background: COLORS.background.tertiary }}>
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
                      <th className="text-right py-3 px-4 text-xs font-semibold" style={{ color: ENTRY_TYPE_COLORS['Provisional Entry'] }}>
                        <div className="flex items-center justify-end gap-1.5">
                          <AlertTriangle size={12} />
                          Prov
                        </div>
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold" style={{ color: ENTRY_TYPE_COLORS['Write-In'] }}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Edit3 size={12} />
                          W-In
                        </div>
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold" style={{ color: ENTRY_TYPE_COLORS['Missing c/o'] }}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Clock size={12} />
                          Miss
                        </div>
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold" style={{ color: COLORS.text.secondary }}>
                        Entries
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-semibold" style={{ color: COLORS.text.secondary }}>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {officeKPIs.sort((a, b) => b.finger_rate - a.finger_rate).map((office, index) => {
                      const meetsTarget = office.finger_rate >= 95;
                      return (
                        <tr
                          key={office.office}
                          className="transition-colors hover:bg-opacity-50"
                          style={{
                            background: index % 2 === 0 ? 'transparent' : `${COLORS.background.tertiary}40`,
                            borderBottom: `1px solid ${COLORS.border.subtle}`,
                          }}
                        >
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                style={{
                                  background: index < 3 ? `${COLORS.status.success}20` : COLORS.background.tertiary,
                                  color: index < 3 ? COLORS.status.success : COLORS.text.muted,
                                }}
                              >
                                {index + 1}
                              </span>
                              <span className="text-sm font-medium" style={{ color: COLORS.text.primary }}>
                                {office.office}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <span
                              className="text-sm font-semibold"
                              style={{ color: office.finger_rate >= 95 ? COLORS.status.success : office.finger_rate >= 90 ? COLORS.status.warning : COLORS.status.danger }}
                            >
                              {office.finger_rate}%
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <span className="text-sm" style={{ color: ENTRY_TYPE_COLORS['Provisional Entry'] }}>
                              {office.provisional_rate}%
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <span className="text-sm" style={{ color: ENTRY_TYPE_COLORS['Write-In'] }}>
                              {office.write_in_rate}%
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <span className="text-sm" style={{ color: ENTRY_TYPE_COLORS['Missing c/o'] }}>
                              {office.missing_co_rate}%
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <span className="text-sm" style={{ color: COLORS.text.secondary }}>
                              {office.total_entries?.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                background: meetsTarget ? `${COLORS.status.success}20` : `${COLORS.status.warning}20`,
                                color: meetsTarget ? COLORS.status.success : COLORS.status.warning,
                              }}
                            >
                              {meetsTarget ? (
                                <>
                                  <CheckCircle2 size={10} />
                                  On Target
                                </>
                              ) : (
                                <>
                                  <AlertTriangle size={10} />
                                  Below
                                </>
                              )}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Office Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <div
                  className="p-3 rounded-lg text-center"
                  style={{ background: `${COLORS.status.success}15`, border: `1px solid ${COLORS.status.success}30` }}
                >
                  <p className="text-xs" style={{ color: COLORS.text.muted }}>Meeting Target</p>
                  <p className="text-xl font-bold" style={{ color: COLORS.status.success }}>
                    <AnimatedNumber value={officeKPIs.filter(o => o.finger_rate >= 95).length} />
                  </p>
                </div>
                <div
                  className="p-3 rounded-lg text-center"
                  style={{ background: `${COLORS.status.warning}15`, border: `1px solid ${COLORS.status.warning}30` }}
                >
                  <p className="text-xs" style={{ color: COLORS.text.muted }}>Below Target</p>
                  <p className="text-xl font-bold" style={{ color: COLORS.status.warning }}>
                    <AnimatedNumber value={officeKPIs.filter(o => o.finger_rate < 95).length} />
                  </p>
                </div>
                <div
                  className="p-3 rounded-lg text-center"
                  style={{ background: COLORS.background.tertiary }}
                >
                  <p className="text-xs" style={{ color: COLORS.text.muted }}>Best Office</p>
                  <p className="text-sm font-bold truncate" style={{ color: COLORS.status.success }}>
                    {officeKPIs.sort((a, b) => b.finger_rate - a.finger_rate)[0]?.office || '-'}
                  </p>
                </div>
                <div
                  className="p-3 rounded-lg text-center"
                  style={{ background: COLORS.background.tertiary }}
                >
                  <p className="text-xs" style={{ color: COLORS.text.muted }}>Needs Attention</p>
                  <p className="text-sm font-bold truncate" style={{ color: COLORS.status.warning }}>
                    {officeKPIs.sort((a, b) => a.finger_rate - b.finger_rate)[0]?.office || '-'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default EntryTypeAnalysis;
