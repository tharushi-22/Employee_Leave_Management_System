const AuditLog = require('../models/AuditLog');

const auditLogger = async (req, action, targetId = null, description, user = null) => {
  try {
    // Get user from parameter or request
    const userToLog = user || (req.user ? req.user : null);
    
    if (!userToLog || !userToLog.id) {
      console.log('⚠️  Audit logging skipped: No user info available');
      return;
    }
    
    console.log(`📝 Creating audit log for user: ${userToLog.email}`);
    
    const auditLog = new AuditLog({
      action: action,
      user: userToLog.id,
      target: targetId,
      description: description,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Unknown',
      userAgent: req.headers['user-agent'] || 'Unknown'
    });
    
    await auditLog.save();
    console.log(`✅ Audit Log Saved: ${description}`);
  } catch (error) {
    console.error('❌ Failed to save audit log:', error.message);
  }
};

module.exports = auditLogger;