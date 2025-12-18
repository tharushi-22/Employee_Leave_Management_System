const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { auth, isAdmin, isEmployee } = require('../middleware/auth');
const Leave = require('../models/Leave');
const auditLogger = require('../middleware/auditLogger');

// Employee: Create leave request
router.post('/', 
  auth, 
  isEmployee,
  [
    body('startDate')
      .notEmpty().withMessage('Start date is required'),
    
    body('endDate')
      .notEmpty().withMessage('End date is required'),
    
    body('reason')
      .notEmpty().withMessage('Reason is required')
      .trim()
      .isLength({ min: 5 }).withMessage('Reason must be at least 5 characters')
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
      
      // Validate dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD' 
        });
      }
      
      if (end < start) {
        return res.status(400).json({ 
          success: false,
          error: 'End date must be after start date' 
        });
      }
      
      // Calculate total days
      const timeDiff = end.getTime() - start.getTime();
      const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
      
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
      
      // Populate employee data
      const populatedLeave = await Leave.findById(savedLeave._id)
        .populate('employee', 'name email');
      
      // Audit log
      await auditLogger(
        req,
        'leave_created',
        savedLeave._id,
        `Employee ${req.user.name} created a ${totalDays}-day leave request`,
        req.user
      );
      
      res.status(201).json({
        success: true,
        message: 'Leave request submitted successfully',
        leave: populatedLeave
      });
      
    } catch (error) {
      // Check for specific errors
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
      
      console.error('Leave creation error:', error.message);
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
    console.error('Fetch leaves error:', error);
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
      .populate('employee', 'name email role');
    
    // Format for frontend
    const formattedLeaves = leaves.map(leave => {
      const employee = leave.employee || {};
      return {
        _id: leave._id,
        startDate: new Date(leave.startDate).toISOString().split('T')[0],
        endDate: new Date(leave.endDate).toISOString().split('T')[0],
        reason: leave.reason,
        status: leave.status,
        totalDays: leave.totalDays,
        createdAt: new Date(leave.createdAt).toLocaleString(),
        employee: {
          _id: employee._id,
          name: employee.name || 'Unknown',
          email: employee.email || 'No email',
          role: employee.role || 'employee'
        }
      };
    });
    
    res.json({
      success: true,
      count: formattedLeaves.length,
      leaves: formattedLeaves
    });
    
  } catch (error) {
    console.error('Fetch all leaves error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaves'
    });
  }
});

// Admin: Update leave status
router.put('/:id/status', 
  auth, 
  isAdmin,
  [
    body('status')
      .notEmpty().withMessage('Status is required')
      .isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array()
        });
      }
      
      const { status } = req.body;
      const leaveId = req.params.id;
      
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
      
      // Format response
      const formattedLeave = {
        ...leave.toObject(),
        startDate: new Date(leave.startDate).toISOString().split('T')[0],
        endDate: new Date(leave.endDate).toISOString().split('T')[0]
      };
      
      // Audit log
      await auditLogger(
        req,
        `leave_${status}`,
        leaveId,
        `Admin ${req.user.name} ${status} leave request from ${leave.employee.name}`,
        req.user
      );
      
      res.json({
        success: true,
        message: `Leave ${status} successfully`,
        leave: formattedLeave
      });
      
    } catch (error) {
      console.error('Update leave error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update leave status'
      });
    }
  }
);

// Export router
module.exports = router;