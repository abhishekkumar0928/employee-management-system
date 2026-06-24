import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, Check, X, Plus } from 'lucide-react';
import Modal from '../components/Modal';

const Overtime = () => {
  const { user, token } = useAuth();
  
  const [otLogs, setOtLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().substring(0, 10),
    hours: '',
    reason: ''
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchOtLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/overtime', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOtLogs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    if (user?.role !== 'Employee') {
      try {
        const res = await fetch('/api/employees', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const active = data.filter(e => e.status === 'Active');
          setEmployees(active);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    fetchOtLogs();
    fetchEmployees();
  }, [user, token]);

  const handleOpenModal = () => {
    setFormError('');
    setFormSuccess('');
    setFormData({
      employeeId: user?.role === 'Employee' ? user?.employee?._id : '',
      date: new Date().toISOString().substring(0, 10),
      hours: '',
      reason: ''
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (user?.role !== 'Employee' && !formData.employeeId) {
      setFormError('Please select an employee.');
      return;
    }

    if (!formData.hours || parseFloat(formData.hours) <= 0) {
      setFormError('Please specify valid overtime hours (greater than 0).');
      return;
    }

    if (!formData.reason.trim()) {
      setFormError('Please input a short description / reason.');
      return;
    }

    try {
      const res = await fetch('/api/overtime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (res.ok) {
        setFormSuccess('Overtime hours recorded successfully!');
        fetchOtLogs();
        setTimeout(() => {
          setIsOpen(false);
        }, 1500);
      } else {
        setFormError(data.message || 'Submission failed.');
      }
    } catch (err) {
      setFormError('Network connection issue.');
      console.error(err);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    if (window.confirm(`Are you sure you want to set overtime status to ${status}?`)) {
      try {
        const res = await fetch(`/api/overtime/${id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status })
        });
        if (res.ok) {
          fetchOtLogs();
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Overtime Tracker</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Log overtime hours. Approved records are integrated directly into monthly payroll payouts.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenModal}>
          <Plus size={18} />
          <span>Log Overtime Hours</span>
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading overtime registers...</p>
      ) : (
        <div className="glass-card" style={{ padding: '8px' }}>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  {user?.role !== 'Employee' && <th>Employee</th>}
                  <th>Date</th>
                  <th>Overtime Hours</th>
                  <th>Hourly Rate</th>
                  <th>Projected Pay</th>
                  <th>Reason</th>
                  <th>Status</th>
                  {user?.role !== 'Employee' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {otLogs.length > 0 ? (
                  otLogs.map(log => {
                    const date = new Date(log.date).toLocaleDateString();
                    const totalPay = log.hours * (log.employee?.overtimeRate || 0);
                    
                    let badgeClass = 'badge-warning';
                    if (log.status === 'Approved') badgeClass = 'badge-success';
                    else if (log.status === 'Rejected') badgeClass = 'badge-danger';

                    return (
                      <tr key={log._id}>
                        {user?.role !== 'Employee' && (
                          <td style={{ fontWeight: 600 }}>{log.employee?.fullName}</td>
                        )}
                        <td>{date}</td>
                        <td style={{ fontWeight: 600 }}>{log.hours} hrs</td>
                        <td>₹{log.employee?.overtimeRate || 0} / hr</td>
                        <td style={{ fontWeight: 600, color: 'var(--success-color)' }}>₹{totalPay.toLocaleString()}</td>
                        <td>{log.reason}</td>
                        <td>
                          <span className={`badge ${badgeClass}`}>{log.status}</span>
                        </td>
                        {user?.role !== 'Employee' && (
                          <td>
                            {log.status === 'Pending' ? (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  className="btn btn-success"
                                  style={{ padding: '6px 10px' }}
                                  onClick={() => handleStatusUpdate(log._id, 'Approved')}
                                  title="Approve"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  className="btn btn-danger"
                                  style={{ padding: '6px 10px' }}
                                  onClick={() => handleStatusUpdate(log._id, 'Rejected')}
                                  title="Reject"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Finished</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={user?.role === 'Employee' ? 7 : 8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No overtime sheets registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Overtime Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Log Overtime Working Hours"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formError && (
            <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger-color)', color: 'var(--danger-color)', padding: '10px', borderRadius: '6px', fontSize: '0.85rem' }}>
              {formError}
            </div>
          )}
          {formSuccess && (
            <div style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid var(--success-color)', color: 'var(--success-color)', padding: '10px', borderRadius: '6px', fontSize: '0.85rem' }}>
              {formSuccess}
            </div>
          )}

          {user?.role !== 'Employee' && (
            <div className="form-group">
              <label className="form-label">Employee</label>
              <select
                className="form-control"
                value={formData.employeeId}
                onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
              >
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>{emp.fullName} ({emp.employeeId})</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date Worked</label>
              <input
                type="date"
                className="form-control"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Hours</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="12"
                className="form-control"
                value={formData.hours}
                onChange={(e) => setFormData(prev => ({ ...prev, hours: e.target.value }))}
                placeholder="Worked hrs"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reason / Work Details</label>
            <input
              type="text"
              className="form-control"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="e.g. Critical database maintenance migration"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Overtime</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Overtime;
