import React, { useState, useMemo } from 'react';
import { GitCompare, X, ArrowUp, ArrowDown, Minus, Building2, Calendar } from 'lucide-react';
import { COLORS, ENTRY_TYPE_COLORS, getFingerRateStatus } from '../constants/colors';
import { useKPIsByOffice, useKPIsByWeek } from '../hooks/useKPIs';
import { useFilters } from '../contexts/FilterContext';

type CompareType = 'offices' | 'weeks';

interface ComparisonModeProps {
  isOpen: boolean;
  onClose: () => void;
}

interface KPIComparison {
  label: string;
  key: string;
  valueA: number;
  valueB: number;
  format: 'percent' | 'number' | 'decimal';
  inverse?: boolean; // true if lower is better
}

const ComparisonMode: React.FC<ComparisonModeProps> = ({ isOpen, onClose }) => {
  const [compareType, setCompareType] = useState<CompareType>('offices');
  const [selectionA, setSelectionA] = useState<string>('');
  const [selectionB, setSelectionB] = useState<string>('');

  const { filters } = useFilters();
  const { officeKPIs, loading: officesLoading } = useKPIsByOffice(filters);
  const { weeklyKPIs, loading: weeksLoading } = useKPIsByWeek(filters);

  const loading = officesLoading || weeksLoading;

  const options = useMemo(() => {
    if (compareType === 'offices') {
      return officeKPIs?.map((o) => o.office).sort() || [];
    } else {
      return weeklyKPIs?.map((w) => w.week).sort().reverse() || [];
    }
  }, [compareType, officeKPIs, weeklyKPIs]);

  const dataA = useMemo(() => {
    if (!selectionA) return null;
    if (compareType === 'offices') {
      return officeKPIs?.find((o) => o.office === selectionA);
    } else {
      return weeklyKPIs?.find((w) => w.week === selectionA);
    }
  }, [compareType, selectionA, officeKPIs, weeklyKPIs]);

  const dataB = useMemo(() => {
    if (!selectionB) return null;
    if (compareType === 'offices') {
      return officeKPIs?.find((o) => o.office === selectionB);
    } else {
      return weeklyKPIs?.find((w) => w.week === selectionB);
    }
  }, [compareType, selectionB, officeKPIs, weeklyKPIs]);

  const comparisons: KPIComparison[] = useMemo(() => {
    if (!dataA || !dataB) return [];
    return [
      { label: 'Finger Rate', key: 'finger_rate', valueA: dataA.finger_rate, valueB: dataB.finger_rate, format: 'percent' },
      { label: 'Provisional Rate', key: 'provisional_rate', valueA: dataA.provisional_rate, valueB: dataB.provisional_rate, format: 'decimal', inverse: true },
      { label: 'Write-In Rate', key: 'write_in_rate', valueA: dataA.write_in_rate, valueB: dataB.write_in_rate, format: 'decimal', inverse: true },
      { label: 'Missing C/O Rate', key: 'missing_co_rate', valueA: dataA.missing_co_rate, valueB: dataB.missing_co_rate, format: 'decimal', inverse: true },
      { label: 'Total Entries', key: 'total_entries', valueA: dataA.total_entries, valueB: dataB.total_entries, format: 'number' },
      { label: 'Total Hours', key: 'total_hours', valueA: dataA.total_hours, valueB: dataB.total_hours, format: 'number' },
    ];
  }, [dataA, dataB]);

  const formatValue = (value: number, format: 'percent' | 'number' | 'decimal') => {
    switch (format) {
      case 'percent':
        return `${value.toFixed(1)}%`;
      case 'decimal':
        return `${value.toFixed(2)}%`;
      case 'number':
        return value.toLocaleString();
    }
  };

  const getDiff = (valueA: number, valueB: number, inverse: boolean = false) => {
    const diff = valueA - valueB;
    const isPositive = inverse ? diff < 0 : diff > 0;
    const isNeutral = Math.abs(diff) < 0.1;

    return {
      diff,
      isPositive,
      isNeutral,
      color: isNeutral ? COLORS.text.muted : isPositive ? COLORS.status.success : COLORS.status.danger,
    };
  };

  const formatWeek = (week: string) => {
    const date = new Date(week);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'rgba(0, 0, 0, 0.6)' }}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl overflow-hidden"
        style={{
          background: COLORS.background.primary,
          border: `1px solid ${COLORS.border.default}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${COLORS.border.subtle}` }}
        >
          <div className="flex items-center gap-3">
            <GitCompare size={20} style={{ color: COLORS.accent.primary }} />
            <h2 className="text-lg font-bold" style={{ color: COLORS.text.primary }}>
              Comparison Mode
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-opacity-50 transition-colors"
            style={{ color: COLORS.text.muted }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 70px)' }}>
          {/* Compare Type Toggle */}
          <div className="flex justify-center mb-5">
            <div
              className="inline-flex p-1 rounded-lg"
              style={{ background: COLORS.background.secondary }}
            >
              <button
                onClick={() => { setCompareType('offices'); setSelectionA(''); setSelectionB(''); }}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all"
                style={{
                  background: compareType === 'offices' ? COLORS.background.tertiary : 'transparent',
                  color: compareType === 'offices' ? COLORS.text.primary : COLORS.text.secondary,
                }}
              >
                <Building2 size={16} />
                Compare Offices
              </button>
              <button
                onClick={() => { setCompareType('weeks'); setSelectionA(''); setSelectionB(''); }}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all"
                style={{
                  background: compareType === 'weeks' ? COLORS.background.tertiary : 'transparent',
                  color: compareType === 'weeks' ? COLORS.text.primary : COLORS.text.secondary,
                }}
              >
                <Calendar size={16} />
                Compare Weeks
              </button>
            </div>
          </div>

          {/* Selection Dropdowns */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: COLORS.text.secondary }}>
                {compareType === 'offices' ? 'Office A' : 'Week A'}
              </label>
              <select
                value={selectionA}
                onChange={(e) => setSelectionA(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
                style={{
                  background: COLORS.background.secondary,
                  border: `1px solid ${COLORS.border.subtle}`,
                  color: COLORS.text.primary,
                }}
              >
                <option value="">Select {compareType === 'offices' ? 'Office' : 'Week'}</option>
                {options.map((option) => (
                  <option key={option} value={option}>
                    {compareType === 'weeks' ? formatWeek(option) : option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: COLORS.text.secondary }}>
                {compareType === 'offices' ? 'Office B' : 'Week B'}
              </label>
              <select
                value={selectionB}
                onChange={(e) => setSelectionB(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
                style={{
                  background: COLORS.background.secondary,
                  border: `1px solid ${COLORS.border.subtle}`,
                  color: COLORS.text.primary,
                }}
              >
                <option value="">Select {compareType === 'offices' ? 'Office' : 'Week'}</option>
                {options.filter((o) => o !== selectionA).map((option) => (
                  <option key={option} value={option}>
                    {compareType === 'weeks' ? formatWeek(option) : option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div
                className="w-8 h-8 rounded-full border-3 border-t-transparent animate-spin"
                style={{ borderColor: `${COLORS.accent.primary} transparent transparent transparent` }}
              />
            </div>
          )}

          {/* Comparison Table */}
          {!loading && selectionA && selectionB && dataA && dataB && (
            <div
              className="rounded-lg overflow-hidden"
              style={{ border: `1px solid ${COLORS.border.subtle}` }}
            >
              {/* Table Header */}
              <div
                className="grid grid-cols-4 gap-2 px-4 py-3"
                style={{ background: COLORS.background.secondary }}
              >
                <div className="text-xs font-semibold" style={{ color: COLORS.text.secondary }}>
                  Metric
                </div>
                <div className="text-xs font-semibold text-center" style={{ color: COLORS.accent.primary }}>
                  {compareType === 'offices' ? selectionA : formatWeek(selectionA)}
                </div>
                <div className="text-xs font-semibold text-center" style={{ color: COLORS.accent.secondary }}>
                  {compareType === 'offices' ? selectionB : formatWeek(selectionB)}
                </div>
                <div className="text-xs font-semibold text-center" style={{ color: COLORS.text.secondary }}>
                  Difference
                </div>
              </div>

              {/* Table Body */}
              {comparisons.map((comp, idx) => {
                const { diff, isPositive, isNeutral, color } = getDiff(comp.valueA, comp.valueB, comp.inverse);
                return (
                  <div
                    key={comp.key}
                    className="grid grid-cols-4 gap-2 px-4 py-3 items-center"
                    style={{
                      background: idx % 2 === 0 ? COLORS.background.primary : COLORS.background.secondary,
                      borderTop: `1px solid ${COLORS.border.subtle}`,
                    }}
                  >
                    <div className="text-sm font-medium" style={{ color: COLORS.text.primary }}>
                      {comp.label}
                    </div>
                    <div
                      className="text-lg font-bold text-center"
                      style={{
                        color: comp.key === 'finger_rate' ? getFingerRateStatus(comp.valueA) :
                               comp.key.includes('rate') ? ENTRY_TYPE_COLORS[comp.key === 'provisional_rate' ? 'Provisional Entry' : comp.key === 'write_in_rate' ? 'Write-In' : 'Missing c/o'] :
                               COLORS.text.primary
                      }}
                    >
                      {formatValue(comp.valueA, comp.format)}
                    </div>
                    <div
                      className="text-lg font-bold text-center"
                      style={{
                        color: comp.key === 'finger_rate' ? getFingerRateStatus(comp.valueB) :
                               comp.key.includes('rate') ? ENTRY_TYPE_COLORS[comp.key === 'provisional_rate' ? 'Provisional Entry' : comp.key === 'write_in_rate' ? 'Write-In' : 'Missing c/o'] :
                               COLORS.text.primary
                      }}
                    >
                      {formatValue(comp.valueB, comp.format)}
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      {isNeutral ? (
                        <Minus size={14} style={{ color }} />
                      ) : isPositive ? (
                        <ArrowUp size={14} style={{ color }} />
                      ) : (
                        <ArrowDown size={14} style={{ color }} />
                      )}
                      <span className="text-sm font-semibold" style={{ color }}>
                        {comp.format === 'number'
                          ? Math.abs(diff).toLocaleString()
                          : `${Math.abs(diff).toFixed(comp.format === 'decimal' ? 2 : 1)}%`
                        }
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!loading && (!selectionA || !selectionB) && (
            <div
              className="flex flex-col items-center justify-center py-12 rounded-lg"
              style={{ background: COLORS.background.secondary }}
            >
              <GitCompare size={48} style={{ color: COLORS.text.muted, marginBottom: '1rem' }} />
              <p className="text-sm" style={{ color: COLORS.text.muted }}>
                Select two {compareType === 'offices' ? 'offices' : 'weeks'} to compare
              </p>
            </div>
          )}

          {/* Insights */}
          {!loading && selectionA && selectionB && dataA && dataB && (
            <div
              className="mt-4 p-4 rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${COLORS.accent.primary}10 0%, transparent 100%)`,
                border: `1px solid ${COLORS.accent.primary}30`,
              }}
            >
              <h3 className="text-sm font-semibold mb-2" style={{ color: COLORS.text.primary }}>
                Quick Insights
              </h3>
              <ul className="space-y-1 text-xs" style={{ color: COLORS.text.secondary }}>
                {dataA.finger_rate > dataB.finger_rate ? (
                  <li>
                    {compareType === 'offices' ? selectionA : formatWeek(selectionA)} has{' '}
                    <span style={{ color: COLORS.status.success }}>
                      {(dataA.finger_rate - dataB.finger_rate).toFixed(1)}% higher
                    </span>{' '}
                    finger rate
                  </li>
                ) : dataB.finger_rate > dataA.finger_rate ? (
                  <li>
                    {compareType === 'offices' ? selectionB : formatWeek(selectionB)} has{' '}
                    <span style={{ color: COLORS.status.success }}>
                      {(dataB.finger_rate - dataA.finger_rate).toFixed(1)}% higher
                    </span>{' '}
                    finger rate
                  </li>
                ) : null}
                {dataA.provisional_rate > dataB.provisional_rate && (
                  <li>
                    {compareType === 'offices' ? selectionA : formatWeek(selectionA)} has{' '}
                    <span style={{ color: COLORS.status.warning }}>
                      {(dataA.provisional_rate - dataB.provisional_rate).toFixed(2)}% more
                    </span>{' '}
                    provisional entries
                  </li>
                )}
                {dataB.provisional_rate > dataA.provisional_rate && (
                  <li>
                    {compareType === 'offices' ? selectionB : formatWeek(selectionB)} has{' '}
                    <span style={{ color: COLORS.status.warning }}>
                      {(dataB.provisional_rate - dataA.provisional_rate).toFixed(2)}% more
                    </span>{' '}
                    provisional entries
                  </li>
                )}
                <li>
                  Volume difference:{' '}
                  <span style={{ color: COLORS.text.primary }}>
                    {Math.abs(dataA.total_entries - dataB.total_entries).toLocaleString()} entries
                  </span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Hook for managing comparison mode state
export const useComparisonMode = () => {
  const [isOpen, setIsOpen] = useState(false);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };
};

export default ComparisonMode;
