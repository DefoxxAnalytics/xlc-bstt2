import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Database, Calendar, RefreshCw, CheckCircle, AlertCircle, Clock, Info } from 'lucide-react';
import { fetchDataQuality, DataQuality } from '../api/client';
import { COLORS } from '../constants/colors';

const freshnessConfig = {
  current: { color: COLORS.status.success, label: 'Current', icon: CheckCircle },
  recent: { color: COLORS.status.info, label: 'Recent', icon: Clock },
  stale: { color: COLORS.status.warning, label: 'Stale', icon: AlertCircle },
  outdated: { color: COLORS.status.danger, label: 'Outdated', icon: AlertCircle },
  unknown: { color: COLORS.text.muted, label: 'Unknown', icon: Info },
};

interface DataQualityIndicatorProps {
  compact?: boolean;
}

const DataQualityIndicator: React.FC<DataQualityIndicatorProps> = ({ compact = false }) => {
  const { data, isLoading, error } = useQuery<DataQuality>({
    queryKey: ['dataQuality'],
    queryFn: fetchDataQuality,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg animate-pulse"
        style={{ background: `${COLORS.background.tertiary}50` }}
      >
        <RefreshCw size={14} className="animate-spin" style={{ color: COLORS.text.muted }} />
        <span className="text-xs" style={{ color: COLORS.text.muted }}>Loading...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
        style={{ background: `${COLORS.status.danger}15` }}
      >
        <AlertCircle size={14} style={{ color: COLORS.status.danger }} />
        <span className="text-xs" style={{ color: COLORS.status.danger }}>Data unavailable</span>
      </div>
    );
  }

  const freshness = freshnessConfig[data.data_freshness] || freshnessConfig.unknown;
  const FreshnessIcon = freshness.icon;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
           date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (compact) {
    return (
      <div
        className="flex items-center gap-3 px-3 py-1.5 rounded-lg cursor-help"
        style={{
          background: `${freshness.color}10`,
          border: `1px solid ${freshness.color}30`,
        }}
        title={`Data through ${formatDate(data.max_date)} | ${data.total_records.toLocaleString()} records | Last sync: ${formatDateTime(data.last_etl_run)}`}
      >
        <div className="flex items-center gap-1.5">
          <FreshnessIcon size={12} style={{ color: freshness.color }} />
          <span className="text-xs font-medium" style={{ color: freshness.color }}>
            {freshness.label}
          </span>
        </div>
        <div className="w-px h-3 bg-gray-600" />
        <div className="flex items-center gap-1.5">
          <Database size={12} style={{ color: COLORS.text.muted }} />
          <span className="text-xs" style={{ color: COLORS.text.secondary }}>
            {(data.total_records / 1000).toFixed(0)}K
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-4 backdrop-blur-sm"
      style={{
        background: `linear-gradient(145deg, ${COLORS.background.secondary}95 0%, ${COLORS.background.tertiary}95 100%)`,
        border: `1px solid ${COLORS.border.subtle}`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Database size={16} style={{ color: COLORS.accent.primary }} />
          <span className="text-sm font-semibold" style={{ color: COLORS.text.primary }}>
            Data Quality
          </span>
        </div>
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-full"
          style={{ background: `${freshness.color}20` }}
        >
          <FreshnessIcon size={12} style={{ color: freshness.color }} />
          <span className="text-xs font-medium" style={{ color: freshness.color }}>
            {freshness.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs" style={{ color: COLORS.text.muted }}>Records</span>
          </div>
          <span className="text-lg font-bold" style={{ color: COLORS.text.primary }}>
            {data.total_records.toLocaleString()}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Calendar size={12} style={{ color: COLORS.text.muted }} />
            <span className="text-xs" style={{ color: COLORS.text.muted }}>Data Through</span>
          </div>
          <span className="text-sm font-medium" style={{ color: COLORS.text.primary }}>
            {formatDate(data.max_date)}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <RefreshCw size={12} style={{ color: COLORS.text.muted }} />
            <span className="text-xs" style={{ color: COLORS.text.muted }}>Last Sync</span>
          </div>
          <span className="text-sm font-medium" style={{ color: COLORS.text.primary }}>
            {formatDateTime(data.last_etl_run)}
          </span>
        </div>

        <div className="space-y-1">
          <span className="text-xs" style={{ color: COLORS.text.muted }}>Date Range</span>
          <span className="text-xs font-medium block" style={{ color: COLORS.text.secondary }}>
            {formatDate(data.min_date)} - {formatDate(data.max_date)}
          </span>
        </div>
      </div>

      {data.years_data && data.years_data.length > 0 && (
        <div
          className="mt-3 pt-3 flex flex-wrap gap-2"
          style={{ borderTop: `1px solid ${COLORS.border.subtle}` }}
        >
          {data.years_data.map(({ year, count }) => (
            <div
              key={year}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md"
              style={{ background: `${COLORS.background.tertiary}80` }}
            >
              <span className="text-xs font-medium" style={{ color: COLORS.text.secondary }}>
                {year}:
              </span>
              <span className="text-xs" style={{ color: COLORS.text.muted }}>
                {(count / 1000).toFixed(0)}K
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DataQualityIndicator;
