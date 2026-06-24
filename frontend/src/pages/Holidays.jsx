import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CalendarDays, Plus, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';

const Holidays = () => {
  const { user, token } = useAuth();
  
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date: new Date().toISOString().substring(0, 10)
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/holidays', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHolidays(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [token]);

  const handleOpenModal = () => {
    setFormError('');
    setFormSuccess('');
    setFormData({
      name: '',
      date: new Date().toISOString().substring(0, 10)
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.name.trim() || !formData.date) {
      setFormError('Please fill in both name and date.');
      return;
    }

    try {
      const res = await fetch('/api/holidays', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (res.ok) {
        setFormSuccess('Custom holiday scheduled successfully!');
        fetchHolidays();
        setTimeout(() => {
          setIsOpen(false);
        }, 1500);
      } else {
        setFormError(data.message || 'Saving failed.');
      }
    } catch (err) {
      setFormError('Network error.');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this custom holiday event?')) {
      try {
        const res = await fetch(`/api/holidays/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          fetchHolidays();
        } else {
          const data = await res.json();
          alert(data.message || 'Deletion failed.');
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
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Company & National Holidays</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Schedule custom events or review default calendar dates.</p>
        </div>
        {user?.role !== 'Employee' && (
          <button className="btn btn-primary" onClick={handleOpenModal}>
            <Plus size={18} />
            <span>Add Holiday Event</span>
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* Left Side: beautiful list of upcoming holidays */}
        <div className="glass-card" style={{ padding: '24px', gridColumn: 'span 2' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarDays size={18} color="var(--primary-color)" />
            Schedule Registry
          </h3>

          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading holidays...</p>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Holiday Event</th>
                    <th>Date Scheduled</th>
                    <th>Category</th>
                    {user?.role !== 'Employee' && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {holidays.length > 0 ? (
                    holidays.map(hol => {
                      const date = new Date(hol.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                      return (
                        <tr key={hol._id}>
                          <td style={{ fontWeight: 600 }}>{hol.name}</td>
                          <td>{date}</td>
                          <td>
                            <span className={`badge ${hol.isCustom ? 'badge-info' : 'badge-success'}`} style={{ backgroundColor: hol.isCustom ? 'rgba(14, 165, 233, 0.15)' : 'rgba(168, 85, 247, 0.15)', color: hol.isCustom ? 'var(--info-color)' : '#a855f7' }}>
                              {hol.isCustom ? 'Custom Event' : 'National Holiday'}
                            </span>
                          </td>
                          {user?.role !== 'Employee' && (
                            <td>
                              {hol.isCustom ? (
                                <button 
                                  className="btn btn-danger" 
                                  style={{ padding: '6px 10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', border: 'none' }}
                                  onClick={() => handleDelete(hol._id)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              ) : (
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Fixed</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={user?.role === 'Employee' ? 3 : 4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        No holiday dates scheduled.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Holiday Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Schedule Company/Custom Holiday"
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
            <label className="form-label">Holiday / Event Title</label>
            <input
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Annual Founder's Day Celebrations"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Calendar Date</label>
            <input
              type="date"
              className="form-control"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Schedule Holiday</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Holidays;
