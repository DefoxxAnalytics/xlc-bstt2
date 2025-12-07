import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { Filters, FilterOptions } from '../types';

const STORAGE_KEY = 'bstt-dashboard-filters';

interface FilterContextType {
  filters: Filters;
  filterOptions: FilterOptions | null;
  setFilters: (filters: Filters) => void;
  updateFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  clearFilters: () => void;
  setFilterOptions: (options: FilterOptions) => void;
  filtersKey: string;
}

const defaultFilters: Filters = {
  year: new Date().getFullYear(),
};

/**
 * Load filters from localStorage, falling back to defaults.
 * Validates that stored year is reasonable (within last 5 years).
 */
const loadFiltersFromStorage = (): Filters => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Filters;
      // Validate year is reasonable (current year or recent past)
      const currentYear = new Date().getFullYear();
      if (parsed.year && (parsed.year < currentYear - 5 || parsed.year > currentYear + 1)) {
        parsed.year = currentYear;
      }
      return { ...defaultFilters, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load filters from localStorage:', e);
  }
  return defaultFilters;
};

/**
 * Save filters to localStorage.
 */
const saveFiltersToStorage = (filters: Filters): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch (e) {
    console.warn('Failed to save filters to localStorage:', e);
  }
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

interface FilterProviderProps {
  children: ReactNode;
}

export const FilterProvider: React.FC<FilterProviderProps> = ({ children }) => {
  const [filters, setFiltersState] = useState<Filters>(loadFiltersFromStorage);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);

  // Persist filters to localStorage whenever they change
  useEffect(() => {
    saveFiltersToStorage(filters);
  }, [filters]);

  const setFilters = useCallback((newFilters: Filters) => {
    setFiltersState(newFilters);
  }, []);

  const updateFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFiltersState(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(defaultFilters);
  }, []);

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  const value = useMemo(() => ({
    filters,
    filterOptions,
    setFilters,
    updateFilter,
    clearFilters,
    setFilterOptions,
    filtersKey,
  }), [filters, filterOptions, setFilters, updateFilter, clearFilters, filtersKey]);

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = (): FilterContextType => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};

export default FilterContext;
