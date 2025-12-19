const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

// Get all audit logs (Admin only)
router.get('/logs', auth, isAdmin, async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .sort({ timestamp: -1 }) // Newest first
      .populate('admin', 'name email')
      .populate('employee', 'name email')
      .populate('leave', 'startDate endDate reason');
    
    res.json({
      success: true,
      count: logs.length,
      logs: logs
    });
    
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit logs'
    });
  }
});

// Get audit logs for specific employee
router.get('/employee/:employeeId', auth, isAdmin, async (req, res) => {
  try {
    const logs = await AuditLog.find({ employee: req.params.employeeId })
      .sort({ timestamp: -1 })
      .populate('admin', 'name email')
      .populate('employee', 'name email')
      .populate('leave', 'startDate endDate reason');
    
    res.json({
      success: true,
      count: logs.length,
      logs: logs
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

module.exports = router;