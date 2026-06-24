import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileSpreadsheet, Download, AlertCircle } from 'lucide-react';

const Reports = () => {
  const { token } = useAuth();
  const [selectedReport, setSelectedReport] = useState('employees');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form selections for date filtering
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const generateReport = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      let endpoint = '';
      let filename = `report_${selectedReport}.csv`;
      
      switch (selectedReport) {
        case 'employees':
          endpoint = '/api/employees';
          break;
        case 'attendance':
          // fetch all, but we can filter by employee or date. For report, let's fetch for the chosen month/year
          endpoint = `/api/payroll?month=${month}&year=${year}`; // Contains summaries
          filename = `attendance_summary_report_${month}_${year}.csv`;
          break;
        case 'leaves':
          endpoint = '/api/leaves';
          break;
        case 'overtime':
          endpoint = '/api/overtime';
          break;
        case 'advance':
          endpoint = '/api/advance';
          break;
        case 'payroll':
          endpoint = `/api/payroll?month=${month}&year=${year}`;
          filename = `payroll_report_${month}_${year}.csv`;
          break;
        default:
          endpoint = '/api/employees';
      }

      const res = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch report dataset.');
      }

      if (!Array.isArray(data) || data.length === 0) {
        setError('No records found for the selected parameters.');
        setLoading(false);
        return;
      }

      // Convert JSON array to CSV format
      const csvString = convertToCSV(data, selectedReport);
      
      // Trigger download using Blob
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccess(`Successfully exported ${data.length} records!`);
    } catch (err) {
      setError(err.message || 'An error occurred during export.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const convertToCSV = (data, type) => {
    let headers = [];
    let rows = [];

    if (type === 'employees') {
      headers = ['Employee ID', 'Full Name', 'Email', 'Contact Number', 'Department', 'Gender', 'Joining Date', 'Monthly Salary (INR)', 'Overtime Rate (INR)', 'Status'];
      rows = data.map(e => [
        e.employeeId,
        e.fullName,
        e.email,
        e.contactNumber,
        e.department,
        e.gender,
        e.joiningDate ? new Date(e.joiningDate).toLocaleDateString() : '',
        e.monthlySalary,
        e.overtimeRate,
        e.status
      ]);
    } else if (type === 'attendance') {
      // Formatted from payroll summaries
      headers = ['Employee ID', 'Name', 'Department', 'Month', 'Year', 'Presents', 'Absents', 'Half Days', 'Leaves', 'Holidays', 'OT Hours'];
      rows = data.map(p => {
        const sum = p.attendanceSummary || {};
        return [
          p.employee?.employeeId || '',
          p.employee?.fullName || '',
          p.employee?.department || '',
          p.month,
          p.year,
          sum.presentCount || 0,
          sum.absentCount || 0,
          sum.halfDayCount || 0,
          (sum.paidLeaveCount || 0) + (sum.sickLeaveCount || 0) + (sum.casualLeaveCount || 0),
          sum.holidayCount || 0,
          sum.overtimeHours || 0
        ];
      });
    } else if (type === 'leaves') {
      headers = ['Employee ID', 'Name', 'Category', 'Start Date', 'End Date', 'Reason', 'Status'];
      rows = data.map(l => [
        l.employee?.employeeId || '',
        l.employee?.fullName || '',
        l.leaveType,
        l.startDate ? new Date(l.startDate).toLocaleDateString() : '',
        l.endDate ? new Date(l.endDate).toLocaleDateString() : '',
        l.reason,
        l.status
      ]);
    } else if (type === 'overtime') {
      headers = ['Employee ID', 'Name', 'Date Worked', 'Hours', 'Hourly Rate', 'Pay', 'Reason', 'Status'];
      rows = data.map(o => [
        o.employee?.employeeId || '',
        o.employee?.fullName || '',
        o.date ? new Date(o.date).toLocaleDateString() : '',
        o.hours,
        o.employee?.overtimeRate || 0,
        o.hours * (o.employee?.overtimeRate || 0),
        o.reason,
        o.status
      ]);
    } else if (type === 'advance') {
      headers = ['Employee ID', 'Name', 'Date Issued', 'Advance Amount', 'Outstanding Balance', 'Reason'];
      rows = data.map(a => [
        a.employee?.employeeId || '',
        a.employee?.fullName || '',
        a.date ? new Date(a.date).toLocaleDateString() : '',
        a.amount,
        a.remainingBalance,
        a.reason
      ]);
    } else if (type === 'payroll') {
      headers = ['Employee ID', 'Name', 'Month', 'Year', 'Monthly Base Salary', 'Payable Days', 'Attendance Salary', 'Overtime Pay', 'Advance Deductions', 'Net Disbursed', 'Status'];
      rows = data.map(p => {
        const dailySalary = p.basicSalary / 30;
        const payableDays = p.payableDays !== undefined ? p.payableDays : (
          (p.attendanceSummary?.presentCount || 0) + 
          (p.attendanceSummary?.paidLeaveCount || 0) + 
          (p.attendanceSummary?.sickLeaveCount || 0) + 
          (p.attendanceSummary?.casualLeaveCount || 0) + 
          (p.attendanceSummary?.holidayCount || 0) + 
          ((p.attendanceSummary?.halfDayCount || 0) * 0.5)
        );
        const attendanceSalary = p.attendanceSalary !== undefined ? p.attendanceSalary : parseFloat((dailySalary * payableDays).toFixed(2));

        return [
          p.employee?.employeeId || '',
          p.employee?.fullName || '',
          p.month,
          p.year,
          p.basicSalary,
          payableDays,
          attendanceSalary,
          p.overtimePay,
          p.advanceDeduction,
          p.netSalary,
          p.status
        ];
      });
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return csvContent;
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Reports & Data Export</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Export tabular spreadsheets for audit registers.</p>
      </div>

      <div style={{ maxWidth: '600px' }} className="glass-card">
        <div style={{ padding: '30px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet size={20} color="var(--primary-color)" />
            Export Settings Panel
          </h3>

          {error && (
            <div style={{ display: 'flex', gap: '8px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger-color)', color: 'var(--danger-color)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid var(--success-color)', color: 'var(--success-color)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>
              {success}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Select Report Dataset</label>
              <select
                className="form-control"
                value={selectedReport}
                onChange={(e) => {
                  setSelectedReport(e.target.value);
                  setError('');
                  setSuccess('');
                }}
              >
                <option value="employees">Personnel Directory Report</option>
                <option value="attendance">Monthly Attendance Summary</option>
                <option value="leaves">Leave Applications Log</option>
                <option value="overtime">Overtime Accruals Report</option>
                <option value="advance">Salary Advance Ledgers</option>
                <option value="payroll">Payroll Statements Report</option>
              </select>
            </div>

            {/* Render date inputs only if report is month-dependent */}
            {(selectedReport === 'payroll' || selectedReport === 'attendance') && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Month</label>
                  <select
                    className="form-control"
                    value={month}
                    onChange={(e) => setMonth(parseInt(e.target.value))}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(0, i).toLocaleString(undefined, { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Year</label>
                  <select
                    className="form-control"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                  >
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                  </select>
                </div>
              </div>
            )}

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '14px', marginTop: '10px' }}
              onClick={generateReport}
              disabled={loading}
            >
              <Download size={18} />
              {loading ? 'Exporting...' : 'Download CSV Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
