import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import FilterBar from './FilterBar';
import PageFooter from './PageFooter';
import { COLORS } from '../../constants/colors';
import { useFilters } from '../../contexts/FilterContext';
import { fetchFilterOptions } from '../../api/client';

const AppLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { setFilterOptions } = useFilters();

  useEffect(() => {
    fetchFilterOptions()
      .then(setFilterOptions)
      .catch(console.error);
  }, [setFilterOptions]);

  return (
    <div
      className="min-h-screen"
      style={{ background: COLORS.background.primary }}
    >
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main
        className="transition-all duration-300 min-h-screen flex flex-col"
        style={{
          marginLeft: sidebarCollapsed ? '72px' : '260px',
        }}
      >
        {/* Top Filter Bar */}
        <FilterBar />

        {/* Page Content */}
        <div className="p-6 flex-1">
          <Outlet />
        </div>

        {/* Page Footer */}
        <PageFooter />
      </main>

      {/* Global Ambient Glow */}
      <div
        className="fixed top-0 right-0 w-96 h-96 pointer-events-none opacity-30"
        style={{
          background: `radial-gradient(circle at top right, ${COLORS.accent.primary}20 0%, transparent 60%)`,
        }}
      />
    </div>
  );
};

export default AppLayout;
