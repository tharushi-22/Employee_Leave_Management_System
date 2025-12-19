import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  
  // Fetch leaves function wrapped in useCallback
  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/leaves/all', {
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
      setError(err.response?.data?.error || 'Error loading leave requests');
    } finally {
      setLoading(false);
    }
  }, [token]);
  
  // useEffect with fetchLeaves dependency
  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);
  
  const updateStatus = async (id, status) => {
    if (!window.confirm(`Are you sure you want to ${status} this leave request?`)) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.put(`/leaves/${id}/status`, 
        { status: status },
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        // Update local state
        setLeaves(leaves.map(leave => 
          leave._id === id ? { ...leave, status: status } : leave
        ));
        alert(`Leave ${status} successfully!`);
        // Refresh leaves list
        fetchLeaves();
      } else {
        setError(response.data.error || `Failed to ${status} leave`);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.response?.data?.error || `Error ${status}ing leave request`);
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
  
  // Filter leaves by status for better organization
  const pendingLeaves = leaves.filter(leave => leave.status === 'pending');
  const approvedLeaves = leaves.filter(leave => leave.status === 'approved');
  const rejectedLeaves = leaves.filter(leave => leave.status === 'rejected');
  
  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-12">
          <h2 className="mb-3">Admin Dashboard</h2>
          
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Welcome, {user.name}!</h5>
              <p className="card-text">You can manage all employee leave requests here.</p>
              
              {/* Statistics Cards */}
              <div className="row mt-4">
                <div className="col-md-4">
                  <div className="card text-white bg-primary mb-3">
                    <div className="card-body">
                      <h5 className="card-title">Pending</h5>
                      <h2 className="card-text">{pendingLeaves.length}</h2>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card text-white bg-success mb-3">
                    <div className="card-body">
                      <h5 className="card-title">Approved</h5>
                      <h2 className="card-text">{approvedLeaves.length}</h2>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card text-white bg-danger mb-3">
                    <div className="card-body">
                      <h5 className="card-title">Rejected</h5>
                      <h2 className="card-text">{rejectedLeaves.length}</h2>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Audit Logs Card */}
              <div className="row mt-3">
                <div className="col-md-12">
                  <div className="card text-white bg-dark">
                    <div className="card-body">
                      <h5 className="card-title">Audit Logs</h5>
                      <p className="card-text">Track all system activities and admin actions</p>
                      <button 
                        className="btn btn-outline-light"
                        onClick={() => navigate('/admin/audit-logs')}
                      >
                        View Audit Logs
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="alert alert-danger">{error}</div>
          )}
          
          {/* Pending Requests Section */}
          <div className="card mb-4">
            <div className="card-header bg-warning text-dark">
              <h5 className="mb-0">Pending Leave Requests ({pendingLeaves.length})</h5>
            </div>
            <div className="card-body">
              {loading && leaves.length === 0 ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading leave requests...</p>
                </div>
              ) : pendingLeaves.length === 0 ? (
                <div className="text-center py-3">
                  <p className="text-muted">No pending leave requests.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Employee</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Total Days</th>
                        <th>Reason</th>
                        <th>Applied On</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingLeaves.map(leave => (
                        <tr key={leave._id}>
                          <td>
                            <div>
                              <strong>{leave.employee?.name}</strong>
                              <div className="text-muted small">{leave.employee?.email}</div>
                            </div>
                          </td>
                          <td>{formatDate(leave.startDate)}</td>
                          <td>{formatDate(leave.endDate)}</td>
                          <td>
                            <span className="badge bg-info">{leave.totalDays} days</span>
                          </td>
                          <td>{leave.reason}</td>
                          <td>{formatDate(leave.createdAt)}</td>
                          <td>
                            <div className="btn-group" role="group">
                              <button 
                                className="btn btn-success btn-sm me-2"
                                onClick={() => updateStatus(leave._id, 'approved')}
                                disabled={loading}
                              >
                                Approve
                              </button>
                              <button 
                                className="btn btn-danger btn-sm"
                                onClick={() => updateStatus(leave._id, 'rejected')}
                                disabled={loading}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          
          {/* All Requests Section */}
          <div className="card">
            <div className="card-header bg-secondary text-white">
              <h5 className="mb-0">All Leave Requests ({leaves.length})</h5>
            </div>
            <div className="card-body">
              {leaves.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted">No leave requests found.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Employee</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Days</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Applied On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaves.map(leave => (
                        <tr key={leave._id}>
                          <td>{leave.employee?.name}</td>
                          <td>{formatDate(leave.startDate)}</td>
                          <td>{formatDate(leave.endDate)}</td>
                          <td>{leave.totalDays}</td>
                          <td className="text-truncate" style={{maxWidth: '200px'}} title={leave.reason}>
                            {leave.reason}
                          </td>
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

export default AdminDashboard;