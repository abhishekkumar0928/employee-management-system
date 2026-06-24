import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Components & Pages
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import SetupWizard from './pages/SetupWizard';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import Leave from './pages/Leave';
import Overtime from './pages/Overtime';
import AdvanceSalary from './pages/AdvanceSalary';
import Payroll from './pages/Payroll';
import Holidays from './pages/Holidays';
import Reports from './pages/Reports';

// Route guards
const ProtectedLayout = () => {
  const { user, loading, setupRequired } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-app)' }}>
        <p style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Checking authorization status...</p>
      </div>
    );
  }

  if (setupRequired) {
    return <Navigate to="/setup" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container" key={user?._id || 'guest'}>
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`main-content ${isCollapsed ? 'collapsed' : ''}`}>
        <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main className="page-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const AuthGuard = ({ children }) => {
  const { user, loading, setupRequired } = useAuth();

  if (loading) return null;

  if (setupRequired) {
    return <Navigate to="/setup" replace />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const SetupGuard = ({ children }) => {
  const { user, loading, setupRequired } = useAuth();

  if (loading) return null;

  if (!setupRequired) {
    if (user) return <Navigate to="/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
};

const RoleGuard = ({ allowedRoles, children }) => {
  const { user } = useAuth();
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Auth routes */}
      <Route path="/login" element={<AuthGuard><Login /></AuthGuard>} />
      <Route path="/setup" element={<SetupGuard><SetupWizard /></SetupGuard>} />

      {/* Main App Layout route */}
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/employees" element={<RoleGuard allowedRoles={['Super Admin', 'HR Manager']}><Employees /></RoleGuard>} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/leaves" element={<Leave />} />
        <Route path="/overtime" element={<Overtime />} />
        <Route path="/advance-salary" element={<AdvanceSalary />} />
        <Route path="/payroll" element={<Payroll />} />
        <Route path="/holidays" element={<Holidays />} />
        <Route path="/reports" element={<RoleGuard allowedRoles={['Super Admin', 'HR Manager']}><Reports /></RoleGuard>} />
        
        {/* Default redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
