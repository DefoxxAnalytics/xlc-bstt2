import React from 'react';
import { COLORS } from '../../constants/colors';
import xlcLogo from '../../assets/xlc_logo.png';

const PageFooter: React.FC = () => {
  return (
    <footer
      className="mt-auto py-4 px-6 border-t"
      style={{
        borderColor: COLORS.border.subtle,
        background: `${COLORS.background.secondary}80`,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={xlcLogo}
            alt="XLC Services"
            className="h-5 w-auto"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <span
            className="text-xs"
            style={{ color: COLORS.text.muted }}
          >
            BSTT Compliance Dashboard
          </span>
        </div>
        <div
          className="text-xs"
          style={{ color: COLORS.text.muted }}
        >
          {new Date().getFullYear()} XLC Services
        </div>
      </div>
    </footer>
  );
};

export default PageFooter;
