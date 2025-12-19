import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const token = localStorage.getItem('token');
  
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/audit/logs', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        setLogs(response.data.logs);
      } else {
        setError('Failed to fetch audit logs');
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err.response?.data?.error || 'Error loading audit logs');
    } finally {
      setLoading(false);
    }
  }, [token]);
  
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);
  
  const getActionColor = (action) => {
    switch (action) {
      case 'leave_approved': return 'success';
      case 'leave_rejected': return 'danger';
      case 'leave_created': return 'info';
      case 'user_logged_in': return 'primary';
      default: return 'secondary';
    }
  };
  
  const formatAction = (action) => {
    const words = action.split('_');
    return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  // Get user name - show either employee or admin
  const getUserInfo = (log) => {
    // For login actions, show the user who logged in
    if (log.action === 'user_logged_in' && log.employee) {
      return {
        name: log.employee.name,
        email: log.employee.email
      };
    }
    
    // For leave actions, show the employee who created the leave
    if (log.employee) {
      return {
        name: log.employee.name,
        email: log.employee.email
      };
    }
    
    // For admin actions, show the admin who performed the action
    if (log.admin) {
      return {
        name: log.admin.name,
        email: log.admin.email
      };
    }
    
    return null;
  };
  
  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-12">
          <h2 className="mb-3">Audit Logs</h2>
          <p className="text-muted">Track all system activities</p>
          
          <div className="card mb-4">
            <div className="card-header bg-dark text-white">
              <h5 className="mb-0">System Activity Logs</h5>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger">{error}</div>
              )}
              
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading audit logs...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted">No audit logs found.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Timestamp</th>
                        <th>Action</th>
                        <th>User</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(log => {
                        const userInfo = getUserInfo(log);
                        return (
                          <tr key={log._id}>
                            <td>
                              <small className="text-muted">
                                {formatDateTime(log.timestamp)}
                              </small>
                            </td>
                            <td>
                              <span className={`badge bg-${getActionColor(log.action)}`}>
                                {formatAction(log.action)}
                              </span>
                            </td>
                            <td>
                              {userInfo ? (
                                <div>
                                  <strong>{userInfo.name}</strong>
                                  <div className="text-muted small">{userInfo.email}</div>
                                </div>
                              ) : (
                                <span className="text-muted">Unknown</span>
                              )}
                            </td>
                            <td>{log.details}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="mt-3 text-muted small">
                <strong>Total Logs:</strong> {logs.length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;