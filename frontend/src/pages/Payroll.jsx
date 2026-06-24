import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calculator, DollarSign, Printer, Check, Eye, ChevronLeft } from 'lucide-react';

const Payroll = () => {
  const { user, token } = useAuth();
  
  // States
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generateMonth, setGenerateMonth] = useState(new Date().getMonth() + 1);
  const [generateYear, setGenerateYear] = useState(new Date().getFullYear());
  const [genSuccess, setGenSuccess] = useState('');
  const [genError, setGenError] = useState('');
  const [processing, setProcessing] = useState(false);

  // Filter lists
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  // Payslip inspection mode
  const [selectedPayroll, setSelectedPayroll] = useState(null);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const url = `/api/payroll?month=${filterMonth}&year=${filterYear}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPayrolls(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, [filterMonth, filterYear, token]);

  const handleGeneratePayroll = async () => {
    setGenError('');
    setGenSuccess('');
    setProcessing(true);

    try {
      const res = await fetch('/api/payroll/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          month: generateMonth,
          year: generateYear
        })
      });

      const data = await res.json();
      if (res.ok) {
        setGenSuccess(data.message || 'Payroll generated successfully.');
        setFilterMonth(generateMonth);
        setFilterYear(generateYear);
        fetchPayrolls();
      } else {
        setGenError(data.message || 'Payroll processing failed.');
      }
    } catch (err) {
      setGenError('Connection issues with server.');
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkAsPaid = async (id) => {
    if (window.confirm('Mark this salary sheet as Paid? This will settle associated Advance Salary deductions.')) {
      try {
        const res = await fetch(`/api/payroll/${id}/pay`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          fetchPayrolls();
          // Update selected payslip view if open
          if (selectedPayroll && selectedPayroll._id === id) {
            const updated = await res.json();
            setSelectedPayroll(updated);
          }
        } else {
          const data = await res.json();
          alert(data.message || 'Payment mark failed.');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (selectedPayroll) {
    const pay = selectedPayroll;
    const emp = pay.employee;
    const att = pay.attendanceSummary || {};
    
    // Derived values
    const dailySalary = pay.basicSalary / 30;
    const payableDays = pay.payableDays || (
      (att.presentCount || 0) + (att.paidLeaveCount || 0) + (att.sickLeaveCount || 0) + (att.casualLeaveCount || 0) + (att.holidayCount || 0) + ((att.halfDayCount || 0) * 0.5)
    );
    const paidLeaveDays = (att.paidLeaveCount || 0) + (att.sickLeaveCount || 0) + (att.casualLeaveCount || 0);
    const attendanceSalary = pay.attendanceSalary || parseFloat((dailySalary * payableDays).toFixed(2));
    const netEarnings = attendanceSalary + pay.overtimePay;
    const netDeductions = pay.advanceDeduction;

    return (
      <div className="fade-in">
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => setSelectedPayroll(null)}
          >
            <ChevronLeft size={18} />
            Back to Payroll Master List
          </button>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            {pay.status === 'Unpaid' && user?.role !== 'Employee' && (
              <button className="btn btn-success" onClick={() => handleMarkAsPaid(pay._id)}>
                <Check size={18} />
                Mark as Paid
              </button>
            )}
            <button className="btn btn-primary" onClick={handlePrint}>
              <Printer size={18} />
              Print Payslip
            </button>
          </div>
        </div>

        {/* Payslip sheet */}
        <div 
          className="glass-card payslip-container" 
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: '40px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-md)'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--border-color)', paddingBottom: '20px', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700 }}>FINE WORK INDUSTRIES</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Salary statement / Payslip receipt</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className={`badge ${pay.status === 'Paid' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.9rem', padding: '6px 16px' }}>
                {pay.status}
              </span>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                For {new Date(0, pay.month - 1).toLocaleString(undefined, { month: 'long' })} {pay.year}
              </p>
            </div>
          </div>

          {/* Details sections */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '32px' }}>
            <div>
              <h4 style={{ color: 'var(--primary-color)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '10px' }}>Employee Details</h4>
              <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '6px 0', color: 'var(--text-muted)', width: '130px' }}>Full Name:</td>
                    <td style={{ padding: '6px 0', fontWeight: 600 }}>{emp?.fullName}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 0', color: 'var(--text-muted)' }}>Employee ID:</td>
                    <td style={{ padding: '6px 0', fontWeight: 600, color: 'var(--primary-color)' }}>{emp?.employeeId}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 0', color: 'var(--text-muted)' }}>Department:</td>
                    <td style={{ padding: '6px 0' }}>{emp?.department}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 0', color: 'var(--text-muted)' }}>Joining Date:</td>
                    <td style={{ padding: '6px 0' }}>{emp?.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h4 style={{ color: 'var(--primary-color)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '10px' }}>Bank Information</h4>
              <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '6px 0', color: 'var(--text-muted)', width: '130px' }}>Bank Name:</td>
                    <td style={{ padding: '6px 0', fontWeight: 600 }}>{emp?.bankName}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 0', color: 'var(--text-muted)' }}>Account Number:</td>
                    <td style={{ padding: '6px 0' }}>{emp?.accountNumber}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 0', color: 'var(--text-muted)' }}>IFSC Code:</td>
                    <td style={{ padding: '6px 0' }}>{emp?.ifscCode}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 0', color: 'var(--text-muted)' }}>UPI ID:</td>
                    <td style={{ padding: '6px 0' }}>{emp?.upiId || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Attendance Stats Summary */}
          <div style={{ backgroundColor: 'var(--gray-bg)', padding: '16px', borderRadius: '8px', marginBottom: '32px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>Attendance Log Summary</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', textAlign: 'center' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Present Days</p>
                <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{att.presentCount + (att.halfDayCount * 0.5)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Paid Leaves</p>
                <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{paidLeaveDays}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unpaid Absents</p>
                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: att.absentCount > 0 ? 'var(--danger-color)' : 'inherit' }}>{att.absentCount + (att.halfDayCount * 0.5)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Overtime Hours</p>
                <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{att.overtimeHours} hrs</p>
              </div>
            </div>
          </div>

          {/* Salary Breakdown grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '32px' }}>
            {/* Earnings */}
            <div>
              <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '12px', fontSize: '0.9rem', color: 'var(--success-color)' }}>EARNINGS</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.9rem' }}>
                <span>Monthly Base Salary:</span>
                <span style={{ fontWeight: 500 }}>₹{pay.basicSalary.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.9rem' }}>
                <span>Daily Salary Rate:</span>
                <span style={{ fontWeight: 500 }}>₹{dailySalary.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.9rem' }}>
                <span>Payable Days:</span>
                <span style={{ fontWeight: 600 }}>{payableDays} days</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.9rem', borderTop: '1px dashed var(--border-color)', marginTop: '4px', paddingTop: '4px' }}>
                <span style={{ fontWeight: 600 }}>Attendance Salary:</span>
                <span style={{ fontWeight: 600 }}>₹{attendanceSalary.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.9rem' }}>
                <span>Overtime Earnings:</span>
                <span style={{ fontWeight: 600 }}>₹{pay.overtimePay.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', padding: '12px 0 6px 0', fontSize: '0.95rem', fontWeight: 700 }}>
                <span>Total Earnings (A):</span>
                <span>₹{netEarnings.toLocaleString()}</span>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '12px', fontSize: '0.9rem', color: 'var(--danger-color)' }}>DEDUCTIONS</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.9rem' }}>
                <span>Unpaid Absences:</span>
                <span style={{ fontWeight: 500, color: 'var(--text-light)' }}>{Math.max(0, 30 - payableDays)} days (unpaid)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.9rem' }}>
                <span>Salary Advance Deduction:</span>
                <span style={{ fontWeight: 600 }}>₹{pay.advanceDeduction.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', padding: '12px 0 6px 0', fontSize: '0.95rem', fontWeight: 700 }}>
                <span>Total Deductions (B):</span>
                <span>₹{netDeductions.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Grand Net salary */}
          <div 
            style={{ 
              backgroundColor: 'var(--primary-glow)', 
              border: '1px solid var(--primary-color)',
              padding: '20px', 
              borderRadius: '8px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}
          >
            <div>
              <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--primary-color)', textTransform: 'uppercase' }}>Net Salary Disbursed (A - B)</span>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Calculated salary after adding overtime and subtracting leave and advance logs.</p>
            </div>
            <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-color)' }}>
              ₹{pay.netSalary.toLocaleString()}
            </span>
          </div>

          {/* Footer signature line */}
          <div style={{ marginTop: '64px', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <div style={{ borderTop: '1px solid var(--border-color)', width: '200px', textAlign: 'center', paddingTop: '8px', color: 'var(--text-muted)' }}>
              Employee's Signature
            </div>
            <div style={{ borderTop: '1px solid var(--border-color)', width: '200px', textAlign: 'center', paddingTop: '8px', color: 'var(--text-muted)' }}>
              Manager's Signature
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Payroll Center</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Disburse monthly salaries, inspect payslips, and check overtime/deductions.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* Left Form: generate new payroll (Admin/HR only) */}
        {user?.role !== 'Employee' && (
          <div className="glass-card" style={{ padding: '24px', height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calculator size={18} color="var(--primary-color)" />
              Generate Monthly Payroll
            </h3>

            {genSuccess && (
              <div style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid var(--success-color)', color: 'var(--success-color)', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '16px' }}>
                {genSuccess}
              </div>
            )}
            {genError && (
              <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger-color)', color: 'var(--danger-color)', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '16px' }}>
                {genError}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Target Month</label>
                <select
                  className="form-control"
                  value={generateMonth}
                  onChange={(e) => setGenerateMonth(parseInt(e.target.value))}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(0, i).toLocaleString(undefined, { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Target Year</label>
                <select
                  className="form-control"
                  value={generateYear}
                  onChange={(e) => setGenerateYear(parseInt(e.target.value))}
                >
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '10px' }}
              onClick={handleGeneratePayroll}
              disabled={processing}
            >
              {processing ? 'Processing payroll batches...' : 'Generate Payroll Sheet'}
            </button>
          </div>
        )}

        {/* Right Tab: List generated payroll */}
        <div className="glass-card" style={{ padding: '24px', gridColumn: user?.role === 'Employee' ? 'span 2' : 'span 1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={18} color="var(--primary-color)" />
              {user?.role === 'Employee' ? 'My Payslips History' : 'Payroll Registers'}
            </h3>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                className="form-control"
                style={{ padding: '6px 12px', fontSize: '0.85rem', width: '110px' }}
                value={filterMonth}
                onChange={(e) => setFilterMonth(parseInt(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString(undefined, { month: 'short' })}
                  </option>
                ))}
              </select>
              <select
                className="form-control"
                style={{ padding: '6px 12px', fontSize: '0.85rem', width: '90px' }}
                value={filterYear}
                onChange={(e) => setFilterYear(parseInt(e.target.value))}
              >
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading payroll details...</p>
          ) : (
            <div className="table-container">
              <table className="custom-table" style={{ fontSize: '0.9rem' }}>
                <thead>
                  <tr>
                    {user?.role !== 'Employee' && <th>Employee</th>}
                    <th>Attendance Salary</th>
                    <th>Net Salary</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payrolls.length > 0 ? (
                    payrolls.map(pay => (
                      <tr key={pay._id}>
                        {user?.role !== 'Employee' && (
                          <td style={{ fontWeight: 600 }}>{pay.employee?.fullName}</td>
                        )}
                        <td>₹{(pay.attendanceSalary || (pay.basicSalary - pay.unpaidLeaveDeduction)).toLocaleString()}</td>
                        <td style={{ fontWeight: 600, color: 'var(--primary-color)' }}>₹{pay.netSalary.toLocaleString()}</td>
                        <td>
                          <span className={`badge ${pay.status === 'Paid' ? 'badge-success' : 'badge-danger'}`}>
                            {pay.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px 10px' }}
                              onClick={() => setSelectedPayroll(pay)}
                              title="View Payslip"
                            >
                              <Eye size={14} />
                            </button>
                            {pay.status === 'Unpaid' && user?.role !== 'Employee' && (
                              <button
                                className="btn btn-success"
                                style={{ padding: '6px 10px' }}
                                onClick={() => handleMarkAsPaid(pay._id)}
                                title="Mark as Paid"
                              >
                                <Check size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={user?.role === 'Employee' ? 4 : 5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        No payroll sheets generated for selected month.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Payroll;
