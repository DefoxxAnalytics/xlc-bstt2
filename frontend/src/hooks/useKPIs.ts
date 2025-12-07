import { useState, useEffect, useMemo } from 'react';
import { KPIs, OfficeKPIs, WeeklyKPIs, Filters } from '../types';
import { fetchKPIs, fetchKPIsByOffice, fetchKPIsByWeek, fetchKPITrends, fetchKPIsByEmployee, fetchKPIsByDepartment, fetchKPIsByShift } from '../api/client';

export const useKPIs = (filters: Filters = {}) => {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    const loadKPIs = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchKPIs(filters);
        setKpis(data);
      } catch (err) {
        setError('Failed to load KPIs');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadKPIs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  return { kpis, loading, error };
};

export const useKPIsByOffice = (filters: Filters = {}) => {
  const [officeKPIs, setOfficeKPIs] = useState<OfficeKPIs[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchKPIsByOffice(filters);
        setOfficeKPIs(data);
      } catch (err) {
        setError('Failed to load office KPIs');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  return { officeKPIs, loading, error };
};

export const useKPIsByWeek = (filters: Filters = {}) => {
  const [weeklyKPIs, setWeeklyKPIs] = useState<WeeklyKPIs[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchKPIsByWeek(filters);
        setWeeklyKPIs(data);
      } catch (err) {
        setError('Failed to load weekly KPIs');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  return { weeklyKPIs, loading, error };
};

export const useKPITrends = (filters: Filters = {}) => {
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchKPITrends(filters);
        setTrends(data);
      } catch (err) {
        setError('Failed to load trends');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  return { trends, loading, error };
};

export interface EmployeeKPI {
  applicant_id: string;
  full_name: string;
  office: string;
  finger_rate: number;
  finger_count: number;
  provisional_count: number;
  write_in_count: number;
  missing_co_count: number;
  non_finger_count: number;
  total_entries: number;
  total_hours: number;
  needs_enrollment: boolean;
}

export const useKPIsByEmployee = (filters: Filters = {}) => {
  const [employeeKPIs, setEmployeeKPIs] = useState<EmployeeKPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchKPIsByEmployee(filters);
        setEmployeeKPIs(data);
      } catch (err) {
        setError('Failed to load employee KPIs');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  return { employeeKPIs, loading, error };
};

export interface DepartmentKPI {
  department: string;
  finger_rate: number;
  provisional_rate: number;
  write_in_rate: number;
  missing_co_rate: number;
  total_entries: number;
  total_hours: number;
  unique_employees: number;
  unique_offices: number;
  unique_weeks: number;
  ot_percentage: number;
  avg_hours_per_emp_week: number;
}

export const useKPIsByDepartment = (filters: Filters = {}) => {
  const [departmentKPIs, setDepartmentKPIs] = useState<DepartmentKPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchKPIsByDepartment(filters);
        setDepartmentKPIs(data);
      } catch (err) {
        setError('Failed to load department KPIs');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  return { departmentKPIs, loading, error };
};

export interface ShiftKPI {
  shift: string;
  finger_rate: number;
  provisional_rate: number;
  write_in_rate: number;
  missing_co_rate: number;
  total_entries: number;
  total_hours: number;
  unique_employees: number;
  unique_offices: number;
  unique_weeks: number;
  ot_percentage: number;
  avg_hours_per_emp_week: number;
}

export const useKPIsByShift = (filters: Filters = {}) => {
  const [shiftKPIs, setShiftKPIs] = useState<ShiftKPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchKPIsByShift(filters);
        setShiftKPIs(data);
      } catch (err) {
        setError('Failed to load shift KPIs');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  return { shiftKPIs, loading, error };
};
