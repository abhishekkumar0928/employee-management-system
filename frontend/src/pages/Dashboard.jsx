import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  UserCheck, 
  UserX, 
  CalendarRange, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  CalendarDays,
  FileText,
  Wallet
} from 'lucide-react';

const Dashboard = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    activeEmployees: 0,
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    leaveToday: 0,
    totalSalaryExpense: 0
  });
  
  // Employee personal stats
  const [empStats, setEmpStats] = useState({
    attendanceRate: 0,
    leaveBalance: 0,
    pendingLeaves: 0,
    advanceBalance: 0,
    recentPayslipsCount: 0
  });

  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        if (user?.role === 'Super Admin' || user?.role === 'HR Manager') {
          // Fetch aggregate stats with local date parameter
          const today = new Date();
          const localDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          const res = await fetch(`/api/attendance/dashboard-stats?date=${localDateStr}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setStats(data);
          }

          // Fetch recent employee list for activity feed
          const empRes = await fetch('/api/employees', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (empRes.ok) {
            const emps = await empRes.json();
            // Map recent hires
            const activities = emps.slice(0, 5).map(emp => ({
              id: emp._id,
              type: 'hire',
              text: `New employee onboarded: ${emp.fullName} (${emp.employeeId})`,
              time: new Date(emp.joiningDate).toLocaleDateString()
            }));
            setRecentActivities(activities);
          }
        } else if (user?.role === 'Employee' && user?.employee?._id) {
          const empId = user.employee._id;
          
          // Fetch leave balances
          const leaveBalRes = await fetch(`/api/leaves/balances/${empId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          let balVal = 0;
          if (leaveBalRes.ok) {
            const leaveBals = await leaveBalRes.json();
            balVal = leaveBals.paidLeave.balance + leaveBals.sickLeave.balance + leaveBals.emergencyLeave.balance;
          }

          // Fetch pending leaves count
          const leavesRes = await fetch(`/api/leaves`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          let pendingCount = 0;
          if (leavesRes.ok) {
            const leaves = await leavesRes.json();
            pendingCount = leaves.filter(l => l.status === 'Pending').length;
          }

          // Fetch advance balance
          const advBalRes = await fetch(`/api/advance/balance/${empId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          let remainingAdvance = 0;
          if (advBalRes.ok) {
            const adv = await advBalRes.json();
            remainingAdvance = adv.remainingBalance;
          }

          // Fetch payroll history count
          const payrollRes = await fetch(`/api/payroll`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          let payslipsCount = 0;
          if (payrollRes.ok) {
            const pay = await payrollRes.json();
            payslipsCount = pay.length;
          }

          // Fetch attendance rate
          const year = new Date().getFullYear();
          const month = new Date().getMonth() + 1;
          const attRes = await fetch(`/api/attendance/employee/${empId}?month=${month}&year=${year}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          let attRate = 100;
          if (attRes.ok) {
            const records = await attRes.json();
            if (records.length > 0) {
              const presents = records.filter(r => r.status === 'Present' || r.status === 'Half Day' || r.status === 'Paid Leave' || r.status === 'Sick Leave' || r.status === 'Casual Leave').length;
              attRate = Math.round((presents / records.length) * 100);
            }
          }

          setEmpStats({
            attendanceRate: attRate,
            leaveBalance: balVal,
            pendingLeaves: pendingCount,
            advanceBalance: remainingAdvance,
            recentPayslipsCount: payslipsCount
          });
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, token]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <p style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Loading dashboard analytics...</p>
      </div>
    );
  }

  const renderAdminDashboard = () => (
    <div className="fade-in">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="glass-card stat-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', justify: 'space-between' }}>
          <div className="stat-info">
            <h3>Total Employees</h3>
            <p>{stats.totalEmployees}</p>
            <span style={{ fontSize: '0.8rem', color: 'var(--success-color)' }}>{stats.activeEmployees} Active</span>
          </div>
          <div className="stat-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-color)' }}>
            <Users size={24} />
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', justify: 'space-between' }}>
          <div className="stat-info">
            <h3>Present Today</h3>
            <p>{stats.presentToday}</p>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Working Shift</span>
          </div>
          <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--success-color)' }}>
            <UserCheck size={24} />
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', justify: 'space-between' }}>
          <div className="stat-info">
            <h3>Absent Today</h3>
            <p>{stats.absentToday}</p>
            <span style={{ fontSize: '0.8rem', color: 'var(--danger-color)' }}>No attendance</span>
          </div>
          <div className="stat-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger-color)' }}>
            <UserX size={24} />
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', justify: 'space-between' }}>
          <div className="stat-info">
            <h3>On Leave</h3>
            <p>{stats.leaveToday}</p>
            <span style={{ fontSize: '0.8rem', color: 'var(--info-color)' }}>Approved leaves</span>
          </div>
          <div className="stat-icon" style={{ backgroundColor: 'rgba(14, 165, 233, 0.15)', color: 'var(--info-color)' }}>
            <CalendarRange size={24} />
          </div>
        </div>
      </div>

      {/* Analytics Charts & Feed */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px',
          marginTop: '24px'
        }}
      >
        {/* SVG analytics graph */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Attendance & Payroll Overview</h3>
            <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary-color)' }}></span>
                Work Ratio
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success-color)' }}></span>
                Payroll Costs
              </span>
            </div>
          </div>
          
          <div style={{ position: 'relative', height: '240px' }}>
            <svg style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              {/* Grid Lines */}
              <line x1="5%" y1="10%" x2="95%" y2="10%" stroke="var(--border-color)" strokeDasharray="4" />
              <line x1="5%" y1="35%" x2="95%" y2="35%" stroke="var(--border-color)" strokeDasharray="4" />
              <line x1="5%" y1="60%" x2="95%" y2="60%" stroke="var(--border-color)" strokeDasharray="4" />
              <line x1="5%" y1="85%" x2="95%" y2="85%" stroke="var(--border-color)" />
              
              {/* Wave SVG or Bar charts */}
              {/* Let's draw some beautiful SVG bars represent monthly payroll */}
              <rect x="15%" y="40%" width="8%" height="45%" fill="var(--primary-color)" opacity="0.15" rx="4" />
              <rect x="35%" y="30%" width="8%" height="55%" fill="var(--primary-color)" opacity="0.15" rx="4" />
              <rect x="55%" y="20%" width="8%" height="65%" fill="var(--primary-color)" opacity="0.15" rx="4" />
              <rect x="75%" y="15%" width="8%" height="70%" fill="var(--primary-color)" rx="4" />

              {/* Line graph representing attendance levels */}
              <path 
                d="M 19% 75 Q 39% 45 59% 25 T 79% 20" 
                fill="none" 
                stroke="var(--success-color)" 
                strokeWidth="3" 
                strokeLinecap="round"
              />
              <circle cx="19%" cy="75" r="5" fill="var(--success-color)" />
              <circle cx="39%" cy="45" r="5" fill="var(--success-color)" />
              <circle cx="59%" cy="25" r="5" fill="var(--success-color)" />
              <circle cx="79%" cy="20" r="5" fill="var(--success-color)" />
              
              {/* X Axis Labels */}
              <text x="19%" y="95%" fontSize="10" fill="var(--text-muted)" textAnchor="middle">Mar</text>
              <text x="39%" y="95%" fontSize="10" fill="var(--text-muted)" textAnchor="middle">Apr</text>
              <text x="59%" y="95%" fontSize="10" fill="var(--text-muted)" textAnchor="middle">May</text>
              <text x="79%" y="95%" fontSize="10" fill="var(--text-muted)" textAnchor="middle">Jun</text>
            </svg>
          </div>
        </div>

        {/* Activity feed */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '20px' }}>Recent Activities</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {recentActivities.length > 0 ? (
              recentActivities.map(act => (
                <div key={act.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div 
                    style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      backgroundColor: 'var(--primary-color)',
                      marginTop: '6px'
                    }} 
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{act.text}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{act.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No recent activities logged.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmployeeDashboard = () => (
    <div className="fade-in">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="glass-card stat-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', justify: 'space-between' }}>
          <div className="stat-info">
            <h3>Attendance Rate</h3>
            <p>{empStats.attendanceRate}%</p>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current Month</span>
          </div>
          <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--success-color)' }}>
            <UserCheck size={24} />
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', justify: 'space-between' }}>
          <div className="stat-info">
            <h3>Leave Balances</h3>
            <p>{empStats.leaveBalance} Days</p>
            <span style={{ fontSize: '0.8rem', color: 'var(--info-color)' }}>{empStats.pendingLeaves} Pending</span>
          </div>
          <div className="stat-icon" style={{ backgroundColor: 'rgba(14, 165, 233, 0.15)', color: 'var(--info-color)' }}>
            <CalendarRange size={24} />
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', justify: 'space-between' }}>
          <div className="stat-info">
            <h3>Advance Balance</h3>
            <p>₹{empStats.advanceBalance.toLocaleString()}</p>
            <span style={{ fontSize: '0.8rem', color: 'var(--danger-color)' }}>To be deducted</span>
          </div>
          <div className="stat-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger-color)' }}>
            <Wallet size={24} />
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', justify: 'space-between' }}>
          <div className="stat-info">
            <h3>Available Payslips</h3>
            <p>{empStats.recentPayslipsCount}</p>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Month-wise records</span>
          </div>
          <div className="stat-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-color)' }}>
            <FileText size={24} />
          </div>
        </div>
      </div>

      {/* Helpful details section */}
      <div className="glass-card" style={{ padding: '24px', marginTop: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>Personal Summary</h3>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
          Welcome, <strong>{user?.employee?.fullName || user?.username}</strong>! You are logged in under the <strong>{user?.role}</strong> portal. 
          Use the side menu to log your daily attendance, apply for leaves, view overtime schedules, inspect your salary advances, or download your payslips.
        </p>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
          Hello, {user?.employee?.fullName || user?.username}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Here is your dashboard summary for today, {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
        </p>
      </div>

      {user?.role === 'Employee' ? renderEmployeeDashboard() : renderAdminDashboard()}
    </div>
  );
};

export default Dashboard;
