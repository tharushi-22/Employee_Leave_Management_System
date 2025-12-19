import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import Login from './components/Login';
import EmployeeDashboard from './components/EmployeeDashboard';
import AdminDashboard from './components/AdminDashboard';
import AuditLogs from './components/AuditLogs';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/employee" element={
            <PrivateRoute>
              <Navbar />
              <EmployeeDashboard />
            </PrivateRoute>
          } />
          
          <Route path="/admin" element={
            <PrivateRoute>
              <Navbar />
              <AdminDashboard />
            </PrivateRoute>
          } />
          
          <Route path="/admin/audit-logs" element={
            <PrivateRoute>
              <Navbar />
              <AuditLogs />
            </PrivateRoute>
          } />
          
          {/* Default redirect based on role */}
          <Route path="/" element={
            <PrivateRoute>
              <NavigateToDashboard />
            </PrivateRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

// Component to redirect based on role
function NavigateToDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  } else {
    return <Navigate to="/employee" replace />;
  }
}

export default App;