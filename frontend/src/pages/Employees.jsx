import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { Plus, Search, Edit2, Trash2, Camera, User, CreditCard, DollarSign } from 'lucide-react';

const Employees = () => {
  const { token } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  
  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    employeeId: '',
    fullName: '',
    gender: 'Male',
    contactNumber: '',
    email: '',
    address: '',
    joiningDate: '',
    department: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
    monthlySalary: '',
    overtimeRate: '',
    photo: '',
    status: 'Active',
    // Login account
    createLogin: false,
    username: '',
    password: '',
    role: 'Employee'
  });

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const url = `/api/employees?search=${search}&department=${department}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search, department]);

  // Handle Photo input (Base64 conversion)
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setFormError('File size is too large (max 2MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setSelectedEmpId(null);
    setFormError('');
    setFormSuccess('');
    setFormData({
      employeeId: '',
      fullName: '',
      gender: 'Male',
      contactNumber: '',
      email: '',
      address: '',
      joiningDate: new Date().toISOString().substring(0,10),
      department: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      upiId: '',
      monthlySalary: '',
      overtimeRate: '',
      photo: '',
      status: 'Active',
      createLogin: false,
      username: '',
      password: '',
      role: 'Employee'
    });
    setIsOpen(true);
  };

  const handleOpenEditModal = (emp) => {
    setIsEditMode(true);
    setSelectedEmpId(emp._id);
    setFormError('');
    setFormSuccess('');
    setFormData({
      employeeId: emp.employeeId,
      fullName: emp.fullName,
      gender: emp.gender,
      contactNumber: emp.contactNumber,
      email: emp.email,
      address: emp.address,
      joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toISOString().substring(0, 10) : '',
      department: emp.department,
      bankName: emp.bankName,
      accountNumber: emp.accountNumber,
      ifscCode: emp.ifscCode,
      upiId: emp.upiId || '',
      monthlySalary: emp.monthlySalary.toString(),
      overtimeRate: emp.overtimeRate.toString(),
      photo: emp.photo || '',
      status: emp.status || 'Active',
      createLogin: emp.username ? true : false,
      username: emp.username || '',
      password: '',
      role: emp.role || 'Employee'
    });
    setIsOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee? All payroll, attendance, and leave histories will be deleted!')) {
      try {
        const res = await fetch(`/api/employees/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          fetchEmployees();
        } else {
          const data = await res.json();
          alert(data.message || 'Deletion failed');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Validations
    if (!formData.employeeId.trim() || !formData.fullName.trim() || !formData.email.trim() || !formData.contactNumber.trim() || !formData.address.trim() || !formData.joiningDate || !formData.department.trim()) {
      setFormError('Please fill all Personal Details fields (including Employee ID).');
      return;
    }

    if (!formData.bankName.trim() || !formData.accountNumber.trim() || !formData.ifscCode.trim()) {
      setFormError('Please fill all Bank Information fields.');
      return;
    }

    if (!formData.monthlySalary || parseFloat(formData.monthlySalary) < 0 || !formData.overtimeRate || parseFloat(formData.overtimeRate) < 0) {
      setFormError('Please specify correct Monthly Salary and Overtime Rates.');
      return;
    }

    if (formData.createLogin && !formData.username.trim()) {
      setFormError('Please specify a username for the login account.');
      return;
    }

    if (formData.createLogin && !isEditMode && !formData.password) {
      setFormError('Please specify a password for the login account.');
      return;
    }

    // Prepare payload
    const payload = {
      ...formData,
      monthlySalary: parseFloat(formData.monthlySalary),
      overtimeRate: parseFloat(formData.overtimeRate),
      username: formData.createLogin ? formData.username.trim() : '',
      password: formData.createLogin && formData.password ? formData.password : undefined,
      role: formData.createLogin ? formData.role : 'Employee'
    };

    try {
      const url = isEditMode ? `/api/employees/${selectedEmpId}` : '/api/employees';
      const method = isEditMode ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        setFormSuccess(`Employee successfully ${isEditMode ? 'updated' : 'created'}!`);
        fetchEmployees();
        setTimeout(() => {
          setIsOpen(false);
        }, 1500);
      } else {
        setFormError(data.message || 'Operation failed. Please try again.');
      }
    } catch (err) {
      setFormError('Network error. Check server log.');
      console.error(err);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Employee Directory</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Maintain details, salary records, and bank information for all personnel.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={18} />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input
            type="text"
            className="form-control"
            style={{ width: '100%', paddingLeft: '38px' }}
            placeholder="Search by ID, name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <select
          className="form-control"
          style={{ width: '200px' }}
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        >
          <option value="">All Departments</option>
          <option value="HR">Human Resources</option>
          <option value="Engineering">Engineering</option>
          <option value="Marketing">Marketing</option>
          <option value="Finance">Finance</option>
          <option value="Operations">Operations</option>
          <option value="Sales">Sales</option>
        </select>
      </div>

      {/* Employees Table */}
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading employee database...</p>
      ) : (
        <div className="glass-card" style={{ padding: '8px' }}>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>ID</th>
                  <th>Department</th>
                  <th>Contact</th>
                  <th>Basic Salary</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.length > 0 ? (
                  employees.map((emp) => (
                    <tr key={emp._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--gray-bg)',
                              overflow: 'hidden',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid var(--border-color)'
                            }}
                          >
                            {emp.photo ? (
                              <img src={emp.photo} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                {emp.fullName.substring(0,2).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{emp.fullName}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span style={{ fontWeight: 500, color: 'var(--primary-color)' }}>{emp.employeeId}</span></td>
                      <td>{emp.department}</td>
                      <td>{emp.contactNumber}</td>
                      <td>₹{emp.monthlySalary.toLocaleString()}</td>
                      <td>
                        <span className={`badge ${emp.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                          {emp.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px' }}
                            onClick={() => handleOpenEditModal(emp)}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ padding: '6px 10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', border: 'none' }}
                            onClick={() => handleDelete(emp._id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No employees found matching criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={isEditMode ? 'Edit Employee Details' : 'Add New Personnel'}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

          {/* Picture base64 */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--gray-bg)',
                border: '2px dashed var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              {formData.photo ? (
                <img src={formData.photo} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Camera size={20} color="var(--text-light)" />
              )}
            </div>
            <div>
              <label className="form-label" style={{ marginBottom: '4px' }}>Profile Photo</label>
              <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }} />
            </div>
          </div>

          {/* Section: Personal Info */}
          <div>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '12px' }}>
              <User size={16} /> Personal Details
            </h4>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Employee ID</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.employeeId} 
                  onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                  disabled={isEditMode}
                  placeholder="e.g. EMP1001"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-control" value={formData.fullName} onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))} placeholder="e.g. Rahul Sharma" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="form-control" value={formData.gender} onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Contact Number</label>
                <input type="text" className="form-control" value={formData.contactNumber} onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))} placeholder="e.g. +91 9876543210" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-control" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="e.g. rahul@company.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Joining Date</label>
                <input type="date" className="form-control" value={formData.joiningDate} onChange={(e) => setFormData(prev => ({ ...prev, joiningDate: e.target.value }))} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Department</label>
                <input 
                  type="text" 
                  className="form-control" 
                  list="departments-datalist"
                  value={formData.department} 
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="e.g. Engineering, Sales, HR..."
                />
                <datalist id="departments-datalist">
                  <option value="HR" />
                  <option value="Engineering" />
                  <option value="Marketing" />
                  <option value="Finance" />
                  <option value="Operations" />
                  <option value="Sales" />
                </datalist>
              </div>
              <div className="form-group">
                <label className="form-label">Full Address</label>
                <input type="text" className="form-control" value={formData.address} onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))} placeholder="City, State, Country" />
              </div>
            </div>
          </div>

          {/* Section: Bank Info */}
          <div>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '12px' }}>
              <CreditCard size={16} /> Bank Details
            </h4>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Bank Name</label>
                <input type="text" className="form-control" value={formData.bankName} onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))} placeholder="e.g. ICICI Bank" />
              </div>
              <div className="form-group">
                <label className="form-label">Account Number</label>
                <input type="text" className="form-control" value={formData.accountNumber} onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))} placeholder="Account digit string" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">IFSC Code</label>
                <input type="text" className="form-control" value={formData.ifscCode} onChange={(e) => setFormData(prev => ({ ...prev, ifscCode: e.target.value }))} placeholder="IFSC string" />
              </div>
              <div className="form-group">
                <label className="form-label">UPI ID (Optional)</label>
                <input type="text" className="form-control" value={formData.upiId} onChange={(e) => setFormData(prev => ({ ...prev, upiId: e.target.value }))} placeholder="upi@bank" />
              </div>
            </div>
          </div>

          {/* Section: Salary Info */}
          <div>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '12px' }}>
              <DollarSign size={16} /> Salary Setup
            </h4>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Monthly Basic Salary (₹)</label>
                <input type="number" className="form-control" value={formData.monthlySalary} onChange={(e) => setFormData(prev => ({ ...prev, monthlySalary: e.target.value }))} placeholder="Monthly rate" />
              </div>
              <div className="form-group">
                <label className="form-label">Overtime Hourly Rate (₹)</label>
                <input type="number" className="form-control" value={formData.overtimeRate} onChange={(e) => setFormData(prev => ({ ...prev, overtimeRate: e.target.value }))} placeholder="Per hour rate" />
              </div>
            </div>
            {isEditMode && (
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={formData.status} onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>

          {/* Section: Portal User Creation */}
          <div style={{ backgroundColor: 'var(--gray-bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={formData.createLogin}
                onChange={(e) => setFormData(prev => ({ ...prev, createLogin: e.target.checked }))}
              />
              Enable Portal User Account
            </label>
            
            {formData.createLogin && (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-row">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Portal Username</label>
                    <input type="text" className="form-control" value={formData.username} onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))} placeholder="Login username" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">{isEditMode ? 'Reset Password (Leave blank to keep same)' : 'Portal Password'}</label>
                    <input type="password" className="form-control" value={formData.password} onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))} placeholder="Enter password" />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Portal Access Role</label>
                  <select className="form-control" value={formData.role} onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}>
                    <option value="Employee">Employee (Standard View)</option>
                    <option value="HR Manager">HR Manager (Full Admin View)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{isEditMode ? 'Save Changes' : 'Register Employee'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Employees;
