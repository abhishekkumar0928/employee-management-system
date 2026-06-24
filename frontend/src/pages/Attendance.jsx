import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Check, ClipboardList, Calendar, Users, Eye } from 'lucide-react';

const Attendance = () => {
  const { user, token } = useAuth();
  
  // Navigation Tabs for Admin/HR: 'entry' or 'history'
  const [activeTab, setActiveTab] = useState(user?.role === 'Employee' ? 'history' : 'entry');
  
  // Daily entry states
  const [entryDate, setEntryDate] = useState(new Date().toISOString().substring(0, 10));
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({}); // empId -> { status, overtimeHours }
  const [entrySuccess, setEntrySuccess] = useState('');
  const [entryError, setEntryError] = useState('');

  // Calendar / history states
  const [selectedEmp, setSelectedEmp] = useState(user?.employee?._id || '');
  const [selectMonth, setSelectMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [selectYear, setSelectYear] = useState(new Date().getFullYear());
  const [calendarLogs, setCalendarLogs] = useState([]);
  const [historyStats, setHistoryStats] = useState({ Present: 0, Absent: 0, 'Half Day': 0, 'Paid Leave': 0, 'Sick Leave': 0, 'Casual Leave': 0, Holiday: 0 });

  // Fetch employees for daily sheet or dropdown selectors
  useEffect(() => {
    const fetchEmployeesData = async () => {
      if (user?.role !== 'Employee') {
        try {
          const res = await fetch('/api/employees', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            const active = data.filter(e => e.status === 'Active');
            setEmployees(active);
            
            // Set initial selected employee for history
            if (active.length > 0 && !selectedEmp) {
              setSelectedEmp(active[0]._id);
            }
          }
        } catch (err) {
          console.error(err);
        }
      }
    };
    fetchEmployeesData();
  }, [user, token]);

  // Load existing records for chosen Daily Entry date (if any)
  useEffect(() => {
    const fetchDateAttendance = async () => {
      if (user?.role !== 'Employee' && entryDate && employees.length > 0) {
        try {
          const res = await fetch(`/api/attendance/date/${entryDate}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const existingLogs = await res.json();
            
            // Re-hydrate mapping
            const recordMap = {};
            employees.forEach(emp => {
              const matched = existingLogs.find(log => log.employee?._id === emp._id);
              recordMap[emp._id] = {
                status: matched ? matched.status : 'Present',
                overtimeHours: matched ? matched.overtimeHours.toString() : '0'
              };
            });
            setAttendanceRecords(recordMap);
          }
        } catch (err) {
          console.error(err);
        }
      }
    };
    fetchDateAttendance();
  }, [entryDate, employees, user, token]);

  // Fetch calendar logs for selected employee/month/year
  const fetchCalendarHistory = async () => {
    if (!selectedEmp) return;
    try {
      const res = await fetch(`/api/attendance/employee/${selectedEmp}?month=${selectMonth}&year=${selectYear}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCalendarLogs(data);

        // Summarize stats
        const counts = { Present: 0, Absent: 0, 'Half Day': 0, 'Paid Leave': 0, 'Sick Leave': 0, 'Casual Leave': 0, Holiday: 0 };
        data.forEach(log => {
          if (counts[log.status] !== undefined) {
            counts[log.status]++;
          }
        });
        setHistoryStats(counts);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCalendarHistory();
  }, [selectedEmp, selectMonth, selectYear]);

  // Handle single employee daily updates
  const handleRecordChange = (empId, field, value) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        [field]: value
      }
    }));
  };

  // Submit bulk logs
  const handleSaveAttendance = async () => {
    setEntryError('');
    setEntrySuccess('');

    const recordsPayload = Object.keys(attendanceRecords).map(empId => ({
      employeeId: empId,
      status: attendanceRecords[empId].status,
      overtimeHours: parseFloat(attendanceRecords[empId].overtimeHours) || 0
    }));

    try {
      const res = await fetch('/api/attendance/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: entryDate,
          records: recordsPayload
        })
      });

      const data = await res.json();
      if (res.ok) {
        setEntrySuccess('Daily attendance sheets saved successfully!');
        fetchCalendarHistory(); // refresh history if current employee updated
      } else {
        setEntryError(data.message || 'Saving failed.');
      }
    } catch (err) {
      setEntryError('Network error. Check connection.');
      console.error(err);
    }
  };

  // Generate calendar grid
  const getDaysInMonth = (month, year) => {
    return new Date(Date.UTC(year, month, 0)).getDate();
  };

  const getFirstDayOffset = (month, year) => {
    // 0 = Sunday, 1 = Monday, etc.
    return new Date(Date.UTC(year, month - 1, 1)).getDay();
  };

  const renderCalendar = () => {
    const totalDays = getDaysInMonth(selectMonth, selectYear);
    const startOffset = getFirstDayOffset(selectMonth, selectYear);
    const cells = [];

    // Empty cells for offset
    for (let i = 0; i < startOffset; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-day-empty"></div>);
    }

    // Days cells
    for (let day = 1; day <= totalDays; day++) {
      const targetDateStr = new Date(Date.UTC(selectYear, selectMonth - 1, day)).toISOString().substring(0, 10);
      const log = calendarLogs.find(l => new Date(l.date).toISOString().substring(0, 10) === targetDateStr);
      
      let statusColor = 'var(--text-light)';
      let badgeClass = '';
      if (log) {
        if (log.status === 'Present') { statusColor = 'var(--success-color)'; badgeClass = 'badge-success'; }
        else if (log.status === 'Absent') { statusColor = 'var(--danger-color)'; badgeClass = 'badge-danger'; }
        else if (log.status === 'Half Day') { statusColor = 'var(--warning-color)'; badgeClass = 'badge-warning'; }
        else if (['Paid Leave', 'Sick Leave', 'Casual Leave'].includes(log.status)) { statusColor = 'var(--info-color)'; badgeClass = 'badge-info'; }
        else if (log.status === 'Holiday') { statusColor = '#a855f7'; badgeClass = 'badge-success'; } // purple
      }

      cells.push(
        <div key={`day-${day}`} className="calendar-day-cell" style={{ borderTop: log ? `3px solid ${statusColor}` : '1px solid var(--border-color)' }}>
          <span className="calendar-day-num">{day}</span>
          {log && (
            <span className={`calendar-day-status badge ${badgeClass}`} style={{ fontSize: '0.65rem', padding: '2px 4px' }}>
              {log.status}
              {log.overtimeHours > 0 && ` (+${log.overtimeHours}h OT)`}
            </span>
          )}
        </div>
      );
    }

    return (
      <div className="calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="calendar-header-day">{d}</div>
        ))}
        {cells}
      </div>
    );
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Attendance Tracker</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Record daily shifts or audit employee monthly logs.</p>
      </div>

      {/* Tabs */}
      {user?.role !== 'Employee' && (
        <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
          <button
            onClick={() => setActiveTab('entry')}
            style={{
              padding: '12px 20px',
              fontWeight: 600,
              fontSize: '0.95rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'entry' ? '3px solid var(--primary-color)' : '3px solid transparent',
              color: activeTab === 'entry' ? 'var(--primary-color)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <ClipboardList size={18} />
            Daily Sheet Entry
          </button>
          
          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '12px 20px',
              fontWeight: 600,
              fontSize: '0.95rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'history' ? '3px solid var(--primary-color)' : '3px solid transparent',
              color: activeTab === 'history' ? 'var(--primary-color)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Calendar size={18} />
            Monthly Calendars
          </button>
        </div>
      )}

      {/* Tab: Daily sheet entry */}
      {activeTab === 'entry' && user?.role !== 'Employee' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div className="form-group" style={{ marginBottom: 0, width: '220px' }}>
              <label className="form-label">Attendance Log Date</label>
              <input
                type="date"
                className="form-control"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
              />
            </div>
            
            <button className="btn btn-primary" onClick={handleSaveAttendance}>
              <Check size={18} />
              Save Attendance Sheet
            </button>
          </div>

          {entrySuccess && (
            <div style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid var(--success-color)', color: 'var(--success-color)', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
              {entrySuccess}
            </div>
          )}
          {entryError && (
            <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger-color)', color: 'var(--danger-color)', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
              {entryError}
            </div>
          )}

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>ID</th>
                  <th>Department</th>
                  <th>Attendance Status</th>
                  <th>Overtime Hours</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => {
                  const record = attendanceRecords[emp._id] || { status: 'Present', overtimeHours: '0' };
                  return (
                    <tr key={emp._id}>
                      <td style={{ fontWeight: 600 }}>{emp.fullName}</td>
                      <td><span style={{ color: 'var(--primary-color)', fontWeight: 500 }}>{emp.employeeId}</span></td>
                      <td>{emp.department}</td>
                      <td>
                        <select
                          className="form-control"
                          style={{ width: '160px', padding: '6px 12px' }}
                          value={record.status}
                          onChange={(e) => handleRecordChange(emp._id, 'status', e.target.value)}
                        >
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                          <option value="Half Day">Half Day</option>
                          <option value="Paid Leave">Paid Leave</option>
                          <option value="Sick Leave">Sick Leave</option>
                          <option value="Casual Leave">Casual Leave</option>
                          <option value="Holiday">Holiday</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="8"
                          className="form-control"
                          style={{ width: '90px', padding: '6px 12px' }}
                          value={record.overtimeHours}
                          onChange={(e) => handleRecordChange(emp._id, 'overtimeHours', e.target.value)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Monthly history calendar */}
      {activeTab === 'history' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          
          {/* Calendar Selectors */}
          <div className="glass-card" style={{ padding: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {user?.role !== 'Employee' && (
              <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '220px' }}>
                <label className="form-label">Select Employee</label>
                <select
                  className="form-control"
                  value={selectedEmp}
                  onChange={(e) => setSelectedEmp(e.target.value)}
                >
                  <option value="">Choose Employee</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.fullName} ({emp.employeeId})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 0, width: '150px' }}>
              <label className="form-label">Month</label>
              <select
                className="form-control"
                value={selectMonth}
                onChange={(e) => setSelectMonth(parseInt(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString(undefined, { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0, width: '130px' }}>
              <label className="form-label">Year</label>
              <select
                className="form-control"
                value={selectYear}
                onChange={(e) => setSelectYear(parseInt(e.target.value))}
              >
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
          </div>

          {selectedEmp ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              
              {/* Actual calendar */}
              <div className="glass-card" style={{ padding: '24px', gridColumn: 'span 2' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>
                  {new Date(0, selectMonth - 1).toLocaleString(undefined, { month: 'long' })} {selectYear} Schedule
                </h3>
                {renderCalendar()}
              </div>

              {/* Sidebar metrics summary */}
              <div className="glass-card" style={{ padding: '24px', height: 'fit-content' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '20px' }}>Month Summary Metrics</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justify: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: 500 }}>Present Days</span>
                    <span className="badge badge-success">{historyStats.Present}</span>
                  </div>
                  <div style={{ display: 'flex', justify: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: 500 }}>Half Days</span>
                    <span className="badge badge-warning">{historyStats['Half Day']}</span>
                  </div>
                  <div style={{ display: 'flex', justify: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: 500 }}>Absent Days</span>
                    <span className="badge badge-danger">{historyStats.Absent}</span>
                  </div>
                  <div style={{ display: 'flex', justify: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: 500 }}>Paid Leaves Taken</span>
                    <span className="badge badge-info">{historyStats['Paid Leave'] + historyStats['Sick Leave'] + historyStats['Casual Leave']}</span>
                  </div>
                  <div style={{ display: 'flex', justify: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: 500 }}>Holidays</span>
                    <span className="badge badge-success" style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>{historyStats.Holiday}</span>
                  </div>
                </div>
              </div>

              {/* Detailed logs table */}
              <div className="glass-card" style={{ padding: '24px', gridColumn: 'span 3', marginTop: '12px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Detailed Attendance Logs List</h3>
                <div className="table-container">
                  <table className="custom-table" style={{ fontSize: '0.9rem' }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Day</th>
                        <th>Logged Status</th>
                        <th>Overtime Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calendarLogs.length > 0 ? (
                        calendarLogs.map(log => {
                          const logDate = new Date(log.date);
                          const formattedDate = logDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
                          const weekday = logDate.toLocaleDateString(undefined, { weekday: 'long', timeZone: 'UTC' });
                          
                          let badgeClass = 'badge-success';
                          if (log.status === 'Absent') badgeClass = 'badge-danger';
                          else if (log.status === 'Half Day') badgeClass = 'badge-warning';
                          else if (['Paid Leave', 'Sick Leave', 'Casual Leave'].includes(log.status)) badgeClass = 'badge-info';
                          else if (log.status === 'Holiday') badgeClass = 'badge-success';
                          
                          return (
                            <tr key={log._id}>
                              <td style={{ fontWeight: 600 }}>{formattedDate}</td>
                              <td>{weekday}</td>
                              <td>
                                <span className={`badge ${badgeClass}`} style={log.status === 'Holiday' ? { backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' } : {}}>
                                  {log.status}
                                </span>
                              </td>
                              <td style={{ fontWeight: 600 }}>{log.overtimeHours > 0 ? `${log.overtimeHours} hrs` : '0'}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                            No attendance records logged for the selected employee during this period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '20px' }}>Please select an employee to audit history.</p>
          )}

        </div>
      )}
    </div>
  );
};

export default Attendance;
