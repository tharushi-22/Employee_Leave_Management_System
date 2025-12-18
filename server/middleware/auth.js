const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({ 
        success: false,
        error: 'No token provided' 
      });
    }
    
    // Extract token
    let token;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      token = authHeader;
    }
    
    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token' 
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    // Attach user to request
    req.user = decoded;
    
    next();
    
  } catch (err) {
    console.error('Auth error:', err.message);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token' 
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Token expired' 
      });
    }
    
    return res.status(500).json({ 
      success: false,
      error: 'Authentication error' 
    });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      error: 'Admin access required' 
    });
  }
  next();
};

const isEmployee = (req, res, next) => {
  if (req.user.role !== 'employee') {
    return res.status(403).json({ 
      success: false,
      error: 'Employee access only' 
    });
  }
  next();
};

module.exports = { auth, isAdmin, isEmployee };