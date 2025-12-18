import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };
  
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow">
      <div className="container">
        <Link className="navbar-brand fw-bold" to={user.role === 'admin' ? '/admin' : '/employee'}>
          📋 Leave Management System
        </Link>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            {user.role === 'admin' ? (
              <li className="nav-item">
                <Link className="nav-link" to="/admin">
                  Admin Dashboard
                </Link>
              </li>
            ) : (
              <li className="nav-item">
                <Link className="nav-link" to="/employee">
                  Employee Dashboard
                </Link>
              </li>
            )}
          </ul>
          
          <div className="navbar-nav align-items-center">
            <div className="nav-item dropdown">
              <button 
                className="btn btn-outline-light dropdown-toggle" 
                data-bs-toggle="dropdown"
              >
                👤 {user.name}
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <span className="dropdown-item-text">
                    <small className="text-muted">Logged in as</small><br />
                    <strong>{user.name}</strong><br />
                    <small>{user.email} ({user.role})</small>
                  </span>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button className="dropdown-item text-danger" onClick={handleLogout}>
                    🚪 Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;