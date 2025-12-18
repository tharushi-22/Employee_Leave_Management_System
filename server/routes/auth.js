const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auditLogger = require('../middleware/auditLogger');

router.post('/login', 
  [
    body('email')
      .isEmail()
      .withMessage('Valid email required')
      .normalizeEmail(),
    
    body('password')
      .notEmpty()
      .withMessage('Password required')
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
      
      const { email, password } = req.body;
      
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid credentials' 
        });
      }
      
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid credentials' 
        });
      }
      
      // Create user object for token and response
      const userData = {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.name
      };
      
      const token = jwt.sign(
        userData,
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );
      
      // Call audit logger with explicit user data
      await auditLogger(
        req,
        'user_logged_in',
        null,
        `User ${user.email} logged in successfully`,
        userData  // Explicitly pass user data
      );
      
      res.json({
        success: true,
        token,
        user: userData
      });
      
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ 
        success: false,
        error: 'Server error' 
      });
    }
});

module.exports = router;