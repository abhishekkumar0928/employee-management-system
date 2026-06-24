import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CalendarRange, Check, X, FileText, Send, UserMinus } from 'lucide-react';

const Leave = () => {
  const { user, token } = useAuth();
  
  // Lists & balances
  const [leaves, setLeaves] = useState([]);
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(true);

  // Apply Form
  const [formData, setFormData] = useState({
    leaveType: 'Paid Leave',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch balances (only if employee)
  const fetchBalances = async () => {
    const empId = user?.employee?._id || user?.employee;
    if (!empId) return;

    try {
      const res = await fetch(`/api/leaves/balances/${empId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBalances(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch leave lists
  const fetchLeavesList = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/leaves', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLeaves(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeavesList();
    if (user?.role === 'Employee') {
      fetchBalances();
    }
  }, [user, token]);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.startDate || !formData.endDate || !formData.reason.trim()) {
      setFormError('Please fill in all dates and reason.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (res.ok) {
        setFormSuccess('Leave request submitted successfully. Awaiting approval.');
        setFormData({
          leaveType: 'Paid Leave',
          startDate: '',
          endDate: '',
          reason: ''
        });
        fetchLeavesList();
        fetchBalances();
      } else {
        setFormError(data.message || 'Failed to submit leave.');
      }
    } catch (err) {
      setFormError('Network connection issue.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    if (window.confirm(`Are you sure you want to set this leave status to ${status}?`)) {
      try {
        const res = await fetch(`/api/leaves/${id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status })
        });
        if (res.ok) {
          fetchLeavesList();
        } else {
          const data = await res.json();
          alert(data.message || 'Status update failed.');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Leave Manager</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Submit leave requests, check allocations, or authorize pending staff absences.</p>
      </div>

      {/* Balances widgets */}
      {user?.role === 'Employee' && balances && (
        <div className="stats-grid" style={{ marginBottom: '24px' }}>
          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--success-color)' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Paid Leaves</h4>
            <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{balances.paidLeave.balance} / {balances.paidLeave.allowed}</p>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{balances.paidLeave.taken} Days Taken</span>
          </div>
          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--info-color)' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Sick Leaves</h4>
            <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{balances.sickLeave.balance} / {balances.sickLeave.allowed}</p>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{balances.sickLeave.taken} Days Taken</span>
          </div>
          <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--warning-color)' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Emergency Leaves</h4>
            <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{balances.emergencyLeave.balance} / {balances.emergencyLeave.allowed}</p>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{balances.emergencyLeave.taken} Days Taken</span>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* Left pane: apply request (Employee only) */}
        {user?.role === 'Employee' && (
          <div className="glass-card" style={{ padding: '24px', height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Send size={18} color="var(--primary-color)" />
              Apply Leave Request
            </h3>
            
            <form onSubmit={handleApplyLeave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {formSuccess && (
                <div style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid var(--success-color)', color: 'var(--success-color)', padding: '10px', borderRadius: '6px', fontSize: '0.85rem' }}>
                  {formSuccess}
                </div>
              )}
              {formError && (
                <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger-color)', color: 'var(--danger-color)', padding: '10px', borderRadius: '6px', fontSize: '0.85rem' }}>
                  {formError}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Leave Category</label>
                <select
                  className="form-control"
                  value={formData.leaveType}
                  onChange={(e) => setFormData(prev => ({ ...prev, leaveType: e.target.value }))}
                >
                  <option value="Paid Leave">Paid Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Emergency Leave">Emergency Leave</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason / Narrative</label>
                <textarea
                  className="form-control"
                  style={{ minHeight: '100px', resize: 'vertical' }}
                  placeholder="Provide details about your leave request..."
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Submitting request...' : 'Send Leave Request'}
              </button>
            </form>
          </div>
        )}

        {/* Right pane: list of logs (All for Admin, Self for Emp) */}
        <div className="glass-card" style={{ padding: '24px', gridColumn: user?.role === 'Employee' ? 'span 1' : 'span 2' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="var(--primary-color)" />
            {user?.role === 'Employee' ? 'My Leave Log History' : 'Employee Leave Request Queue'}
          </h3>

          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading leave listings...</p>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    {user?.role !== 'Employee' && <th>Employee</th>}
                    <th>Leave Type</th>
                    <th>Duration</th>
                    <th>Reason</th>
                    <th>Status</th>
                    {user?.role !== 'Employee' && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {leaves.length > 0 ? (
                    leaves.map(leave => {
                      const start = new Date(leave.startDate).toLocaleDateString();
                      const end = new Date(leave.endDate).toLocaleDateString();
                      
                      let statusBadge = 'badge-warning';
                      if (leave.status === 'Approved') statusBadge = 'badge-success';
                      else if (leave.status === 'Rejected') statusBadge = 'badge-danger';

                      return (
                        <tr key={leave._id}>
                          {user?.role !== 'Employee' && (
                            <td style={{ fontWeight: 600 }}>{leave.employee?.fullName}</td>
                          )}
                          <td>
                            <div style={{ fontWeight: 500 }}>{leave.leaveType}</div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.85rem' }}>{start} to {end}</div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={leave.reason}>
                              {leave.reason}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${statusBadge}`}>{leave.status}</span>
                          </td>
                          {user?.role !== 'Employee' && (
                            <td>
                              {leave.status === 'Pending' ? (
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    className="btn btn-success"
                                    style={{ padding: '6px 10px' }}
                                    onClick={() => handleStatusUpdate(leave._id, 'Approved')}
                                    title="Approve Leave"
                                  >
                                    <Check size={14} />
                                  </button>
                                  <button
                                    className="btn btn-danger"
                                    style={{ padding: '6px 10px' }}
                                    onClick={() => handleStatusUpdate(leave._id, 'Rejected')}
                                    title="Reject Leave"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : (
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Completed</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={user?.role === 'Employee' ? 4 : 6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        No leave records found.
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

export default Leave;
