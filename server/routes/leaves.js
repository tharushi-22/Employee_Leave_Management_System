const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { auth, isAdmin, isEmployee } = require('../middleware/auth');
const Leave = require('../models/Leave');
const AuditLog = require('../models/AuditLog');

// Helper function to calculate total days
const calculateTotalDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const timeDiff = end.getTime() - start.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
};

// Employee: Create leave request WITH VALIDATION
router.post('/', 
  auth, 
  isEmployee,
  [
    body('startDate')
      .notEmpty().withMessage('Start date is required')
      .isISO8601().withMessage('Invalid date format (use YYYY-MM-DD)'),
    
    body('endDate')
      .notEmpty().withMessage('End date is required')
      .isISO8601().withMessage('Invalid date format (use YYYY-MM-DD)'),
    
    body('reason')
      .notEmpty().withMessage('Reason is required')
      .trim()
      .isLength({ min: 5 }).withMessage('Reason must be at least 5 characters')
      .isLength({ max: 500 }).withMessage('Reason too long (max 500 characters)')
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array()
        });
      }
      
      const { startDate, endDate, reason } = req.body;
      
      // Parse dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Additional date validation
      if (end < start) {
        return res.status(400).json({ 
          success: false,
          error: 'End date must be after start date' 
        });
      }
      
      // Calculate total days
      const totalDays = calculateTotalDays(start, end);
      
      // Create leave object
      const leaveData = {
        employee: req.user.id,
        startDate: start,
        endDate: end,
        reason: reason.trim(),
        totalDays: totalDays,
        status: 'pending'
      };
      
      // Save leave
      const leave = new Leave(leaveData);
      const savedLeave = await leave.save();
      
      // CREATE AUDIT LOG FOR LEAVE CREATION
      const auditLog = new AuditLog({
        action: 'leave_created',
        employee: req.user.id,
        leave: savedLeave._id,
        details: `Employee ${req.user.name} created a ${totalDays}-day leave request`
      });
      await auditLog.save();
      console.log(`📝 Audit Log: Employee ${req.user.name} created leave`);
      
      // Populate employee info for response
      const populatedLeave = await Leave.findById(savedLeave._id)
        .populate('employee', 'name email');
      
      res.status(201).json({
        success: true,
        message: 'Leave request submitted successfully',
        leave: populatedLeave
      });
      
    } catch (error) {
      console.error('Leave creation error:', error.message);
      
      // Handle specific errors
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: 'Validation failed'
        });
      }
      
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          error: 'Duplicate entry'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Server error while creating leave'
      });
    }
  }
);

// Employee: Get own leaves
router.get('/my-leaves', auth, isEmployee, async (req, res) => {
  try {
    const leaves = await Leave.find({ employee: req.user.id })
      .sort({ createdAt: -1 })
      .populate('employee', 'name email');
    
    // Format dates for frontend
    const formattedLeaves = leaves.map(leave => ({
      ...leave.toObject(),
      startDate: new Date(leave.startDate).toISOString().split('T')[0],
      endDate: new Date(leave.endDate).toISOString().split('T')[0],
      createdAt: new Date(leave.createdAt).toLocaleString()
    }));
    
    res.json({
      success: true,
      count: formattedLeaves.length,
      leaves: formattedLeaves
    });
    
  } catch (error) {
    console.error('Fetch leaves error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaves'
    });
  }
});

// Admin: Get all leaves
router.get('/all', auth, isAdmin, async (req, res) => {
  try {
    const leaves = await Leave.find()
      .sort({ createdAt: -1 })
      .populate('employee', 'name email');
    
    // Format for frontend
    const formattedLeaves = leaves.map(leave => ({
      ...leave.toObject(),
      startDate: new Date(leave.startDate).toISOString().split('T')[0],
      endDate: new Date(leave.endDate).toISOString().split('T')[0],
      createdAt: new Date(leave.createdAt).toLocaleString()
    }));
    
    res.json({
      success: true,
      count: formattedLeaves.length,
      leaves: formattedLeaves
    });
    
  } catch (error) {
    console.error('Fetch all leaves error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaves'
    });
  }
});

// Admin: Update leave status WITH VALIDATION
router.put('/:id/status', 
  auth, 
  isAdmin,
  [
    body('status')
      .notEmpty().withMessage('Status is required')
      .isIn(['approved', 'rejected']).withMessage('Status must be "approved" or "rejected"')
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array()
        });
      }
      
      const { status } = req.body;
      const leaveId = req.params.id;
      
      // Validate leave ID format
      if (!leaveId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid leave ID format'
        });
      }
      
      // Find and update leave
      const leave = await Leave.findByIdAndUpdate(
        leaveId,
        { status: status },
        { new: true }
      ).populate('employee', 'name email');
      
      if (!leave) {
        return res.status(404).json({
          success: false,
          error: 'Leave request not found'
        });
      }
      
      // CREATE AUDIT LOG FOR ADMIN ACTION
      const actionType = status === 'approved' ? 'leave_approved' : 'leave_rejected';
      const auditLog = new AuditLog({
        action: actionType,
        admin: req.user.id,
        employee: leave.employee._id,
        leave: leave._id,
        details: `Admin ${req.user.name} ${status} leave request from ${leave.employee.name} at ${new Date().toLocaleString()}`
      });
      await auditLog.save();
      console.log(`📝 Audit Log: Admin ${req.user.name} ${status} leave`);
      
      // Format response
      const formattedLeave = {
        ...leave.toObject(),
        startDate: new Date(leave.startDate).toISOString().split('T')[0],
        endDate: new Date(leave.endDate).toISOString().split('T')[0],
        updatedAt: new Date().toLocaleString()
      };
      
      res.json({
        success: true,
        message: `Leave ${status} successfully`,
        leave: formattedLeave
      });
      
    } catch (error) {
      console.error('Update leave error:', error.message);
      
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid leave ID'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to update leave status'
      });
    }
  }
);

// Get single leave by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate('employee', 'name email');
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        error: 'Leave not found'
      });
    }
    
    // Check permission
    if (req.user.role !== 'admin' && leave.employee._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      leave: leave
    });
    
  } catch (error) {
    console.error('Error fetching leave:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leave'
    });
  }
});

module.exports = router;