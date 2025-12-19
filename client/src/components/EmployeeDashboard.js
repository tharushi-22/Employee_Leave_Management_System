import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const EmployeeDashboard = () => {
  const [leaves, setLeaves] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: ''
  });
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  
  // Fetch leaves function wrapped in useCallback
  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/leaves/my-leaves', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        setLeaves(response.data.leaves);
      } else {
        setError('Failed to fetch leaves');
      }
    } catch (err) {
      console.error('Error fetching leaves:', err);
      setError(err.response?.data?.error || 'Error loading leave history');
    } finally {
      setLoading(false);
    }
  }, [token]);
  
  // useEffect with fetchLeaves dependency
  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);
  
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };
  
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  
  // Validate dates
  const today = new Date().toISOString().split('T')[0];
  if (formData.startDate < today) {
    setError('Start date cannot be in the past');
    setLoading(false);
    return;
  }
  
  if (formData.endDate < formData.startDate) {
    setError('End date cannot be before start date');
    setLoading(false);
    return;
  }
  
  // Format dates properly for backend
  const submitData = {
    startDate: formData.startDate,
    endDate: formData.endDate,
    reason: formData.reason
  };
  
  console.log('Submitting leave:', submitData);
  
  try {
    const response = await axios.post('/leaves', submitData, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      // Reset form
      setFormData({ startDate: '', endDate: '', reason: '' });
      setShowForm(false);
      
      // Refresh leaves list
      fetchLeaves();
      
      // Show success message
      alert('✅ Leave request submitted successfully!');
    } else {
      setError(response.data.error || 'Failed to submit leave');
    }
  } catch (err) {
    console.error('Submit error:', err);
    
    if (err.response) {
      // Server responded with error
      const serverError = err.response.data;
      setError(serverError.error || serverError.message || 'Server error');
      console.log('Server error details:', serverError);
    } else if (err.request) {
      // No response received
      setError('No response from server. Check if backend is running.');
    } else {
      // Other errors
      setError(err.message || 'Error submitting leave');
    }
  } finally {
    setLoading(false);
  }
};
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      default: return 'warning';
    }
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-12">
          <h2 className="mb-3">Employee Dashboard</h2>
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Welcome, {user.name}!</h5>
              <p className="card-text">You can apply for leave and view your leave history here.</p>
              <button 
                className="btn btn-primary"
                onClick={() => setShowForm(!showForm)}
                disabled={loading}
              >
                {showForm ? 'Cancel Application' : 'Apply for Leave'}
              </button>
            </div>
          </div>
          
          {showForm && (
            <div className="card mb-4 shadow">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">New Leave Request</h5>
              </div>
              <div className="card-body">
                {error && (
                  <div className="alert alert-danger">{error}</div>
                )}
                
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label fw-bold">Start Date *</label>
                        <input
                          type="date"
                          className="form-control"
                          name="startDate"
                          value={formData.startDate}
                          onChange={handleInputChange}
                          required
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label fw-bold">End Date *</label>
                        <input
                          type="date"
                          className="form-control"
                          name="endDate"
                          value={formData.endDate}
                          onChange={handleInputChange}
                          required
                          min={formData.startDate || new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-bold">Reason *</label>
                    <textarea
                      className="form-control"
                      name="reason"
                      value={formData.reason}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Please provide a reason for your leave..."
                      required
                    />
                  </div>
                  
                  <div className="d-flex justify-content-end">
                    <button 
                      type="button" 
                      className="btn btn-secondary me-2"
                      onClick={() => setShowForm(false)}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-success"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Submitting...
                        </>
                      ) : 'Submit Request'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          
          <div className="card">
            <div className="card-header bg-secondary text-white">
              <h5 className="mb-0">My Leave History</h5>
            </div>
            <div className="card-body">
              {loading && leaves.length === 0 ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading your leave history...</p>
                </div>
              ) : leaves.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted">No leave requests found.</p>
                  <p>Click "Apply for Leave" to create your first request.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Total Days</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Applied On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaves.map(leave => (
                        <tr key={leave._id}>
                          <td>{formatDate(leave.startDate)}</td>
                          <td>{formatDate(leave.endDate)}</td>
                          <td>
                            <span className="badge bg-info">{leave.totalDays} days</span>
                          </td>
                          <td>{leave.reason}</td>
                          <td>
                            <span className={`badge bg-${getStatusColor(leave.status)}`}>
                              {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                            </span>
                          </td>
                          <td>{formatDate(leave.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;