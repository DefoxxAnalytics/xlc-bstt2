import React, { useCallback } from 'react';
import { Calendar, Building2, Download, RefreshCw } from 'lucide-react';
import { useFilters } from '../../contexts/FilterContext';
import { downloadFullReport } from '../../api/client';
import { COLORS } from '../../constants/colors';
import DateRangeFilter from '../DateRangeFilter';

const FilterBar: React.FC = () => {
  const { filters, filterOptions, updateFilter, clearFilters } = useFilters();

  const handleDateRangeChange = useCallback((startDate: string | undefined, endDate: string | undefined) => {
    updateFilter('dt_end_cli_work_week__gte', startDate);
    updateFilter('dt_end_cli_work_week__lte', endDate);
  }, [updateFilter]);

  return (
    <div
      className="sticky top-0 z-30 px-4 py-2 backdrop-blur-md"
      style={{
        background: `${COLORS.background.secondary}ee`,
        borderBottom: `1px solid ${COLORS.border.subtle}`,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        {/* Left Side Filters */}
        <div className="flex items-center gap-2">
          {/* Year Filter */}
          <div className="flex items-center gap-1.5">
            <Calendar size={14} style={{ color: COLORS.text.muted }} />
            <select
              className="px-2 py-1.5 rounded-md text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2"
              style={{
                background: COLORS.background.tertiary,
                color: COLORS.text.primary,
                border: `1px solid ${COLORS.border.subtle}`,
              }}
              value={filters.year || ''}
              onChange={(e) => updateFilter('year', Number(e.target.value))}
            >
              {filterOptions?.years?.map((year) => (
                <option key={year} value={year}>{year}</option>
              )) || <option value={2025}>2025</option>}
            </select>
          </div>

          {/* Office Filter */}
          <div className="flex items-center gap-1.5">
            <Building2 size={14} style={{ color: COLORS.text.muted }} />
            <select
              className="px-2 py-1.5 rounded-md text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2"
              style={{
                background: COLORS.background.tertiary,
                color: COLORS.text.primary,
                border: `1px solid ${COLORS.border.subtle}`,
              }}
              value={filters.xlc_operation || ''}
              onChange={(e) => updateFilter('xlc_operation', e.target.value || undefined)}
            >
              <option value="">All Offices</option>
              {filterOptions?.offices?.map((office) => (
                <option key={office} value={office}>{office}</option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <DateRangeFilter onChange={handleDateRangeChange} initialPreset="ytd" />

          {/* Reset Filters */}
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105"
            style={{
              color: COLORS.text.muted,
            }}
          >
            <RefreshCw size={12} />
            Reset
          </button>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          <a
            href={downloadFullReport(filters)}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${COLORS.accent.primary} 0%, ${COLORS.status.info} 100%)`,
              color: COLORS.text.inverse,
              boxShadow: `0 4px 12px ${COLORS.accent.primary}30`,
            }}
          >
            <Download size={14} />
            Export
          </a>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
