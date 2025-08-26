const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4028',
  credentials: true
}));
app.use(express.json());

// Create Gmail SMTP transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Email server is running', timestamp: new Date().toISOString() });
});

// Send email endpoint
app.post('/send-email', async (req, res) => {
  try {
    const { to, subject, body, cc, bcc, from } = req.body;
    
    // Validate required fields
    if (!to || !subject || !body) {
      return res.status(400).json({ 
        error: 'Missing required fields: to, subject, and body are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if Gmail credentials are configured
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return res.status(500).json({ 
        error: 'Gmail SMTP not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD environment variables.' 
      });
    }

    const transporter = createTransporter();

    // Prepare mail options
    const mailOptions = {
      from: from || `"CRM System" <${process.env.GMAIL_USER}>`,
      to: to,
      subject: subject,
      html: body,
      ...(cc && { cc: cc }),
      ...(bcc && { bcc: bcc })
    };

    console.log('Sending email to:', to);
    console.log('Subject:', subject);

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', info.messageId);
    
    res.json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('Email sending error:', error);
    
    // Handle specific Gmail errors
    if (error.code === 'EAUTH') {
      return res.status(401).json({ 
        error: 'Gmail authentication failed. Please check your email and app password.' 
      });
    }
    
    if (error.code === 'ECONNECTION') {
      return res.status(503).json({ 
        error: 'Could not connect to Gmail SMTP server. Please check your internet connection.' 
      });
    }

    res.status(500).json({ 
      error: error.message || 'Failed to send email',
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
});

// Test email endpoint
app.post('/test-email', async (req, res) => {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return res.status(500).json({ 
        error: 'Gmail SMTP not configured' 
      });
    }

    const transporter = createTransporter();
    
    // Verify SMTP connection
    await transporter.verify();
    
    res.json({ 
      success: true, 
      message: 'Gmail SMTP connection verified successfully' 
    });
    
  } catch (error) {
    console.error('SMTP verification error:', error);
    res.status(500).json({ 
      error: 'Gmail SMTP connection failed: ' + error.message 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`📧 Email server running on port ${PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:4028'}`);
  console.log(`✉️  Gmail User: ${process.env.GMAIL_USER || 'Not configured'}`);
  console.log(`🔑 Gmail App Password: ${process.env.GMAIL_APP_PASSWORD ? 'Configured' : 'Not configured'}`);
  
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log('⚠️  Warning: Gmail SMTP not fully configured. Please set environment variables.');
  }
});
