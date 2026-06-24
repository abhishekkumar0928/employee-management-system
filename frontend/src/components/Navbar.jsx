import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, User, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Navbar = ({ isCollapsed, setIsCollapsed }) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const location = useLocation();

  // Determine page title based on path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return 'Dashboard Overview';
    if (path.includes('employees')) return 'Employee Directory';
    if (path.includes('attendance')) return 'Attendance Logs';
    if (path.includes('leaves')) return 'Leave Requests';
    if (path.includes('overtime')) return 'Overtime logs';
    if (path.includes('advance-salary')) return 'Salary Advances';
    if (path.includes('payroll')) return 'Payroll & Payslips';
    if (path.includes('holidays')) return 'Holiday Calendar';
    if (path.includes('reports')) return 'Analytics Reports';
    return 'Fine Work Industies';
  };

  return (
    <header
      style={{
        height: '70px',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 90,
        transition: 'background-color var(--transition-speed)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Menu size={22} />
        </button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
          {getPageTitle()}
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s',
            backgroundColor: 'var(--gray-bg)',
            width: '38px',
            height: '38px'
          }}
          title="Toggle Light/Dark Theme"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* User Card */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '4px 12px 4px 6px',
            backgroundColor: 'var(--gray-bg)',
            borderRadius: '50px',
            border: '1px solid var(--border-color)'
          }}
        >
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-color)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem'
            }}
          >
            {user?.username?.substring(0, 2).toUpperCase() || 'AD'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {user?.username}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
