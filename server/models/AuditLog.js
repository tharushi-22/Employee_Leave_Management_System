const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'leave_created', 
      'leave_approved', 
      'leave_rejected', 
      'user_logged_in'
    ]
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  target: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Leave'
  },
  description: {
    type: String,
    required: true
  },
  ipAddress: String,
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Index for better query performance
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ user: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);