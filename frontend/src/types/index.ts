/**
 * API Response Types for BSTT Compliance Dashboard
 *
 * NOTE: ISO Week Numbers
 * This dashboard uses ISO week numbers (1-53) to align data across offices with
 * different week ending days:
 * - Martinsburg uses Saturday week endings
 * - All other offices (Albany, Andover, Greensboro, New Orleans) use Sunday week endings
 *
 * ISO weeks run Monday through Sunday, so both Saturday and Sunday of the same
 * calendar week share the same ISO week number. This ensures accurate cross-office
 * comparisons without date manipulation.
 *
 * Example: Week 48 of 2025
 * - Martinsburg: Saturday Nov 29, 2025 → ISO Week 48
 * - Other offices: Sunday Nov 30, 2025 → ISO Week 48
 * Both align to the same week for reporting purposes.
 */

export interface TimeEntry {
  id: number;
  year: number;
  ofc_name: string;
  xlc_operation: string;
  dt_end_cli_work_week: string;
  work_date: string | null;
  date_range: string;
  // ISO week number (for cross-office alignment)
  week_number: number | null;
  week_year: number | null;
  applicant_id: string;
  last_name: string;
  first_name: string;
  full_name: string;
  employee_type_id: string;
  shift_number: string;
  bu_dept_name: string;
  allocation_method: string;
  dt_time_start: string | null;
  dt_time_end: string | null;
  reg_hours: number;
  ot_hours: number;
  dt_hours: number;
  hol_wrk_hours: number;
  total_hours: number;
  clock_in_local: string;
  clock_in_tries: number;
  clock_in_method: string;
  clock_out_local: string;
  clock_out_tries: number;
  clock_out_method: string;
  entry_type: string;
}

export interface KPIs {
  // Compliance
  finger_rate: number;
  provisional_rate: number;
  write_in_rate: number;
  missing_co_rate: number;
  manual_rate: number;
  biometric_compliance: number;
  auto_clock_rate: number;
  exception_rate: number;
  // Volume
  total_entries: number;
  total_hours: number;
  total_reg_hours: number;
  total_ot_hours: number;
  total_dt_hours: number;
  total_hol_hours: number;
  unique_employees: number;
  unique_offices: number;
  unique_weeks: number;
  avg_hours_per_entry: number;
  avg_hours_per_emp_week: number;
  entries_per_employee: number;
  ot_percentage: number;
  // Efficiency
  first_try_clock_in_rate: number;
  first_try_clock_out_rate: number;
  avg_clock_in_tries: number;
  avg_clock_out_tries: number;
  multi_try_rate: number;
}

export interface OfficeKPIs extends KPIs {
  office: string;
}

/**
 * Weekly KPIs grouped by ISO week number.
 *
 * ISO week alignment ensures Martinsburg (Saturday endings) and other offices
 * (Sunday endings) are grouped into the same weeks for accurate comparison.
 */
export interface WeeklyKPIs extends KPIs {
  week: string;              // ISO date string (backwards compatibility)
  week_display: string;      // Sunday of the ISO week (for chart labels)
  week_year: number;         // ISO year (may differ from calendar year at year boundaries)
  week_number: number;       // ISO week number (1-53)
}

export interface FilterOptions {
  years: number[];
  offices: string[];
  departments: string[];
  entry_types: string[];
  weeks: string[];
}

export interface Filters {
  year?: number;
  xlc_operation?: string;
  entry_type?: string;
  dt_end_cli_work_week?: string;
  dt_end_cli_work_week__gte?: string;
  dt_end_cli_work_week__lte?: string;
  // ISO week number filters
  week_number?: number;
  week_number__gte?: number;
  week_number__lte?: number;
  week_year?: number;
  // Department filter
  bu_dept_name?: string;
}

export type DateRangePreset = 'custom' | 'last_week' | 'last_4_weeks' | 'last_month' | 'last_quarter' | 'ytd';

export interface DateRange {
  preset: DateRangePreset;
  startDate?: string;
  endDate?: string;
}
