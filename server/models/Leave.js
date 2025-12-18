const mongoose = require('mongoose');

const LeaveSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: true,
    set: function(date) {
      // Accept string or Date object
      return new Date(date);
    }
  },
  endDate: {
    type: Date,
    required: true,
    set: function(date) {
      // Accept string or Date object
      return new Date(date);
    }
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  totalDays: {
    type: Number,
    default: 1,
    min: 1
  }
}, {
  timestamps: true
});

// Remove any pre-save hooks that might cause issues
// Keep it simple

module.exports = mongoose.model('Leave', LeaveSchema);