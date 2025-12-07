import React, { createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FilterProvider } from './contexts/FilterContext';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import OfficeAnalysis from './pages/OfficeAnalysis';
import EntryTypeAnalysis from './pages/EntryTypeAnalysis';
import EmployeeAnalysis from './pages/EmployeeAnalysis';
import WeeklyTrends from './pages/WeeklyTrends';
import ClockBehavior from './pages/ClockBehavior';
import DataExplorer from './pages/DataExplorer';
import CommandPalette, { useCommandPalette } from './components/CommandPalette';
import ComparisonMode, { useComparisonMode } from './components/ComparisonMode';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
    },
  },
});

// Context for global modals
interface AppModalsContextType {
  openComparison: () => void;
  openCommandPalette: () => void;
}

const AppModalsContext = createContext<AppModalsContextType | null>(null);

export const useAppModals = () => {
  const context = useContext(AppModalsContext);
  if (!context) {
    throw new Error('useAppModals must be used within AppModalsProvider');
  }
  return context;
};

const AppContent: React.FC = () => {
  const commandPalette = useCommandPalette();
  const comparisonMode = useComparisonMode();

  return (
    <AppModalsContext.Provider
      value={{
        openComparison: comparisonMode.open,
        openCommandPalette: commandPalette.open,
      }}
    >
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="office-analysis" element={<OfficeAnalysis />} />
          <Route path="entry-types" element={<EntryTypeAnalysis />} />
          <Route path="employees" element={<EmployeeAnalysis />} />
          <Route path="trends" element={<WeeklyTrends />} />
          <Route path="clock-behavior" element={<ClockBehavior />} />
          <Route path="data-explorer" element={<DataExplorer />} />
        </Route>
      </Routes>
      <CommandPalette isOpen={commandPalette.isOpen} onClose={commandPalette.close} onOpenComparison={comparisonMode.open} />
      <ComparisonMode isOpen={comparisonMode.isOpen} onClose={comparisonMode.close} />
    </AppModalsContext.Provider>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FilterProvider>
        <Router>
          <AppContent />
        </Router>
      </FilterProvider>
    </QueryClientProvider>
  );
}

export default App;
