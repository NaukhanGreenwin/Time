// API Routes for Capital Fire and Security Sign-In App
const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');

// Validation helper
const validateSignInData = (data) => {
  const errors = [];
  
  if (!data.employeeId || typeof data.employeeId !== 'string' || data.employeeId.trim().length === 0) {
    errors.push('Employee ID is required');
  }
  
  if (!data.location || typeof data.location !== 'object') {
    errors.push('Location data is required');
  } else {
    if (typeof data.location.latitude !== 'number' || data.location.latitude < -90 || data.location.latitude > 90) {
      errors.push('Valid latitude is required');
    }
    if (typeof data.location.longitude !== 'number' || data.location.longitude < -180 || data.location.longitude > 180) {
      errors.push('Valid longitude is required');
    }
  }
  
  if (!data.timestamp || !Date.parse(data.timestamp)) {
    errors.push('Valid timestamp is required');
  }
  
  return errors;
};

// POST /api/signin - Handle employee sign-in
router.post('/signin', async (req, res) => {
  try {
    console.log('Sign-in request received:', req.body);
    
    // Validate input data
    const validationErrors = validateSignInData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    }
    
    const { employeeId, location, timestamp } = req.body;
    
    // Create sign-in record with Google Maps link
    const signInRecord = {
      id: Date.now().toString(),
      employeeId: employeeId.trim(),
      employeeName: employeeId.trim(), // For now, using ID as name
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy || null,
        googleMapsUrl: `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
      },
      timestamp: new Date(timestamp).toISOString(),
      emailSent: false,
      emailSentAt: null,
      retryCount: 0
    };
    
    // Send email to head office
    console.log('Sign-in record created:', signInRecord);
    
    try {
      const emailResult = await emailService.sendSignInNotification(signInRecord);
      signInRecord.emailSent = true;
      signInRecord.emailSentAt = new Date().toISOString();
      console.log('Email sent successfully:', emailResult.messageId);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      signInRecord.emailSent = false;
      signInRecord.retryCount = 1;
      // Continue with response even if email fails - we'll implement retry logic later
    }
    
    res.json({
      success: true,
      message: 'Sign-in successful',
      data: {
        id: signInRecord.id,
        employeeId: signInRecord.employeeId,
        timestamp: signInRecord.timestamp,
        emailSent: signInRecord.emailSent
      }
    });
    
  } catch (error) {
    console.error('Sign-in error:', error);
    res.status(500).json({
      error: 'Sign-in failed',
      message: 'An error occurred while processing your sign-in'
    });
  }
});

// POST /api/test-email - Test email configuration
router.post('/test-email', async (req, res) => {
  try {
    console.log('Testing email configuration...');
    
    // Test the email configuration
    const testResult = await emailService.testEmailConfiguration();
    
    // Send a test email
    const testSignInData = {
      id: 'test-' + Date.now(),
      employeeId: 'TEST-USER',
      employeeName: 'Test Employee',
      location: {
        latitude: 45.4215,
        longitude: -75.6972,
        accuracy: 10
      },
      timestamp: new Date().toISOString()
    };
    
    const emailResult = await emailService.sendSignInNotification(testSignInData);
    
    res.json({
      success: true,
      message: 'Test email sent successfully',
      data: {
        configurationValid: testResult.success,
        emailSent: true,
        messageId: emailResult.messageId,
        sentTo: emailResult.sentTo
      }
    });
    
  } catch (error) {
    console.error('Email test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Email test failed',
      message: error.message
    });
  }
});

// GET /api/health - API health check
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    api: 'Capital Fire and Security Sign-In API'
  });
});

module.exports = router;