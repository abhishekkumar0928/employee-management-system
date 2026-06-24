import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DollarSign, Plus, Info } from 'lucide-react';
import Modal from '../components/Modal';

const AdvanceSalary = () => {
  const { user, token } = useAuth();
  
  const [logs, setLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    amount: '',
    date: new Date().toISOString().substring(0, 10),
    reason: ''
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/advance', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
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
    fetchLogs();
    fetchEmployees();
  }, [user, token]);

  const handleOpenModal = () => {
    setFormError('');
    setFormSuccess('');
    setFormData({
      employeeId: '',
      amount: '',
      date: new Date().toISOString().substring(0, 10),
      reason: ''
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.employeeId) {
      setFormError('Please select an employee.');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setFormError('Please specify a valid advance amount.');
      return;
    }

    if (!formData.reason.trim()) {
      setFormError('Please specify reason.');
      return;
    }

    try {
      const res = await fetch('/api/advance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (res.ok) {
        setFormSuccess('Salary advance recorded successfully!');
        fetchLogs();
        setTimeout(() => {
          setIsOpen(false);
        }, 1500);
      } else {
        setFormError(data.message || 'Saving failed.');
      }
    } catch (err) {
      setFormError('Network connection issue.');
      console.error(err);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Advance Salary Ledger</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Issue short-term cash advances. Outstanding balances are automatically deducted in subsequent payroll runs.</p>
        </div>
        {user?.role !== 'Employee' && (
          <button className="btn btn-primary" onClick={handleOpenModal}>
            <Plus size={18} />
            <span>Grant Cash Advance</span>
          </button>
        )}
      </div>

      {/* Info notice about deduction logic */}
      <div 
        className="glass-card" 
        style={{ 
          padding: '16px', 
          marginBottom: '24px', 
          display: 'flex', 
          gap: '12px', 
          alignItems: 'center',
          borderLeft: '4px solid var(--primary-color)' 
        }}
      >
        <Info size={20} color="var(--primary-color)" />
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          <strong>Auto-deduction policy:</strong> Any outstanding salary advance balance will be automatically subtracted from the employee's net earnings during the monthly payroll generation process.
        </span>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading advance ledgers...</p>
      ) : (
        <div className="glass-card" style={{ padding: '8px' }}>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  {user?.role !== 'Employee' && <th>Employee</th>}
                  <th>Issue Date</th>
                  <th>Advance Amount</th>
                  <th>Remaining Balance</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.length > 0 ? (
                  logs.map(log => {
                    const date = new Date(log.date).toLocaleDateString();
                    
                    let statusBadge = 'badge-success';
                    let statusText = 'Fully Settled';
                    if (log.remainingBalance > 0) {
                      statusBadge = 'badge-danger';
                      statusText = `Unpaid (₹${log.remainingBalance.toLocaleString()})`;
                    }

                    return (
                      <tr key={log._id}>
                        {user?.role !== 'Employee' && (
                          <td style={{ fontWeight: 600 }}>{log.employee?.fullName}</td>
                        )}
                        <td>{date}</td>
                        <td style={{ fontWeight: 600 }}>₹{log.amount.toLocaleString()}</td>
                        <td style={{ fontWeight: 600, color: log.remainingBalance > 0 ? 'var(--danger-color)' : 'var(--success-color)' }}>
                          ₹{log.remainingBalance.toLocaleString()}
                        </td>
                        <td>{log.reason}</td>
                        <td>
                          <span className={`badge ${statusBadge}`}>{statusText}</span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={user?.role === 'Employee' ? 5 : 6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No advances have been logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grant Advance Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Grant Employee Cash Advance"
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

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input
                type="number"
                className="form-control"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="e.g. 5000"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Issue Date</label>
              <input
                type="date"
                className="form-control"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reason / Reference notes</label>
            <input
              type="text"
              className="form-control"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="e.g. Personal medical emergency request"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Log Advance</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdvanceSalary;
