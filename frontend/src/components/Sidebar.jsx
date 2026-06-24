import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  CalendarRange, 
  Clock, 
  DollarSign, 
  Receipt, 
  CalendarDays, 
  FileSpreadsheet, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Briefcase
} from 'lucide-react';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Super Admin', 'HR Manager', 'Employee'] },
    { path: '/employees', label: 'Employees', icon: Users, roles: ['Super Admin', 'HR Manager'] },
    { path: '/attendance', label: 'Attendance', icon: CalendarCheck, roles: ['Super Admin', 'HR Manager', 'Employee'] },
    { path: '/leaves', label: 'Leave Manager', icon: CalendarRange, roles: ['Super Admin', 'HR Manager', 'Employee'] },
    { path: '/overtime', label: 'Overtime', icon: Clock, roles: ['Super Admin', 'HR Manager', 'Employee'] },
    { path: '/advance-salary', label: 'Advance Salary', icon: DollarSign, roles: ['Super Admin', 'HR Manager', 'Employee'] },
    { path: '/payroll', label: 'Payroll & Payslips', icon: Receipt, roles: ['Super Admin', 'HR Manager', 'Employee'] },
    { path: '/holidays', label: 'Holiday Calendar', icon: CalendarDays, roles: ['Super Admin', 'HR Manager', 'Employee'] },
    { path: '/reports', label: 'Reports & Export', icon: FileSpreadsheet, roles: ['Super Admin', 'HR Manager'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role));

  return (
    <aside 
      style={{
        width: isCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        backgroundColor: 'var(--bg-sidebar)',
        color: '#f8fafc',
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width var(--transition-speed)',
        borderRight: '1px solid rgba(255,255,255,0.05)'
      }}
    >
      {/* Brand Header */}
      <div 
        style={{
          height: '70px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          padding: '0 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        {!isCollapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Briefcase size={24} color="var(--primary-color)" />
            <span style={{ fontWeight: 700, fontSize: '1.2rem', letterSpacing: '0.5px' }}>
  Fine Work Industries
</span>
          </div>
        )}
        {isCollapsed && <Briefcase size={28} color="var(--primary-color)" />}
        
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            display: isCollapsed ? 'none' : 'block'
          }}
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* Nav Menu */}
      <nav style={{ flex: 1, padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
        {filteredMenu.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '12px 16px',
                color: isActive ? '#ffffff' : '#94a3b8',
                backgroundColor: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.95rem',
                transition: 'all 0.2s',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                borderLeft: isActive ? '3px solid var(--primary-color)' : '3px solid transparent'
              })}
            >
              <Icon size={20} />
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Profile/Logout */}
      <div 
        style={{
          padding: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        {!isCollapsed && (
          <div style={{ display: 'flex', flexDirection: 'column', padding: '0 8px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.username}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {user?.role}
            </span>
          </div>
        )}

        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            style={{
              alignSelf: 'center',
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <ChevronRight size={20} />
          </button>
        )}

        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '12px 16px',
            width: '100%',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            color: '#ef4444',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: 600,
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            transition: 'background 0.2s'
          }}
        >
          <LogOut size={20} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
