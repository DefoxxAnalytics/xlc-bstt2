import React, { useState, useEffect } from 'react';
import { DateRangePreset, DateRange } from '../types';
import { COLORS } from '../constants/colors';

interface DateRangeFilterProps {
  onChange: (startDate: string | undefined, endDate: string | undefined) => void;
  initialPreset?: DateRangePreset;
}

const PRESET_LABELS: Record<DateRangePreset, string> = {
  custom: 'Custom',
  last_week: 'Last Week',
  last_4_weeks: 'Last 4 Weeks',
  last_month: 'Last Month',
  last_quarter: 'Last Quarter',
  ytd: 'Year to Date',
};

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const getPresetDates = (preset: DateRangePreset): { startDate: string; endDate: string } | null => {
  const today = new Date();
  const endDate = formatDate(today);

  switch (preset) {
    case 'last_week': {
      const start = new Date(today);
      start.setDate(today.getDate() - 7);
      return { startDate: formatDate(start), endDate };
    }
    case 'last_4_weeks': {
      const start = new Date(today);
      start.setDate(today.getDate() - 28);
      return { startDate: formatDate(start), endDate };
    }
    case 'last_month': {
      const start = new Date(today);
      start.setMonth(today.getMonth() - 1);
      return { startDate: formatDate(start), endDate };
    }
    case 'last_quarter': {
      const start = new Date(today);
      start.setMonth(today.getMonth() - 3);
      return { startDate: formatDate(start), endDate };
    }
    case 'ytd': {
      const start = new Date(today.getFullYear(), 0, 1);
      return { startDate: formatDate(start), endDate };
    }
    case 'custom':
    default:
      return null;
  }
};

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ onChange, initialPreset = 'ytd' }) => {
  const [dateRange, setDateRange] = useState<DateRange>({
    preset: initialPreset,
    ...getPresetDates(initialPreset),
  });
  const [showCustom, setShowCustom] = useState(initialPreset === 'custom');

  useEffect(() => {
    if (dateRange.preset !== 'custom') {
      const dates = getPresetDates(dateRange.preset);
      if (dates) {
        setDateRange(prev => ({ ...prev, ...dates }));
        onChange(dates.startDate, dates.endDate);
      }
      setShowCustom(false);
    } else {
      setShowCustom(true);
      onChange(dateRange.startDate, dateRange.endDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange.preset]);

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const preset = e.target.value as DateRangePreset;
    setDateRange(prev => ({ ...prev, preset }));
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startDate = e.target.value;
    setDateRange(prev => ({ ...prev, startDate }));
    onChange(startDate, dateRange.endDate);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const endDate = e.target.value;
    setDateRange(prev => ({ ...prev, endDate }));
    onChange(dateRange.startDate, endDate);
  };

  const selectStyle: React.CSSProperties = {
    background: COLORS.background.tertiary,
    color: COLORS.text.primary,
    border: `1px solid ${COLORS.border.subtle}`,
  };

  const inputStyle: React.CSSProperties = {
    background: COLORS.background.tertiary,
    color: COLORS.text.primary,
    border: `1px solid ${COLORS.border.subtle}`,
    colorScheme: 'dark',
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={dateRange.preset}
        onChange={handlePresetChange}
        className="rounded-md px-2 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 transition-all duration-200"
        style={selectStyle}
      >
        {Object.entries(PRESET_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {showCustom && (
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={dateRange.startDate || ''}
            onChange={handleStartDateChange}
            className="rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all duration-200"
            style={inputStyle}
          />
          <span className="text-xs" style={{ color: COLORS.text.muted }}>to</span>
          <input
            type="date"
            value={dateRange.endDate || ''}
            onChange={handleEndDateChange}
            className="rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all duration-200"
            style={inputStyle}
          />
        </div>
      )}

      {!showCustom && dateRange.startDate && dateRange.endDate && (
        <span className="text-xs" style={{ color: COLORS.text.muted }}>
          ({dateRange.startDate} to {dateRange.endDate})
        </span>
      )}
    </div>
  );
};

export default DateRangeFilter;
