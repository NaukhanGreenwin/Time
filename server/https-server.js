// HTTPS Server for mobile testing
const https = require('https');
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Create Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      scriptSrc: ["'self'", "https://unpkg.com", "https://cdnjs.cloudflare.com", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:", "https://*.tile.openstreetmap.org", "blob:"],
      connectSrc: ["'self'", "https://*.tile.openstreetmap.org", "https://nominatim.openstreetmap.org"],
      objectSrc: ["'none'"],
      workerSrc: ["'self'", "blob:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : true,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static('public'));

// API Routes
app.use('/api', require('./routes/api'));

// Basic route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Capital Fire and Security Sign-In App (HTTPS)',
    protocol: 'HTTPS'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Simple self-signed certificate generation for development
const selfsigned = require('selfsigned');

// Generate self-signed certificate
const attrs = [{ name: 'commonName', value: 'localhost' }];
const pems = selfsigned.generate(attrs, { 
    keySize: 2048,
    days: 365,
    algorithm: 'sha256',
    extensions: [{
        name: 'basicConstraints',
        cA: true
    }, {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true
    }, {
        name: 'subjectAltName',
        altNames: [{
            type: 2, // DNS
            value: 'localhost'
        }, {
            type: 7, // IP
            ip: '127.0.0.1'
        }, {
            type: 7, // IP
            ip: '192.168.7.239'
        }]
    }]
});

const httpsOptions = {
    key: pems.private,
    cert: pems.cert
};

const PORT = process.env.HTTPS_PORT || 8443;

// Create HTTPS server
const server = https.createServer(httpsOptions, app);

server.listen(PORT, '0.0.0.0', () => {
    console.log(`HTTPS Server running on port ${PORT}`);
    console.log(`Local HTTPS access: https://localhost:${PORT}`);
    console.log(`Network HTTPS access: https://192.168.7.239:${PORT}`);
    console.log('');
    console.log('⚠️  IMPORTANT FOR MOBILE TESTING:');
    console.log(`1. On your iPhone, go to: https://192.168.7.239:${PORT}`);
    console.log('2. You will see a security warning - tap "Advanced" then "Proceed to 192.168.7.239 (unsafe)"');
    console.log('3. This is normal for self-signed certificates in development');
    console.log('4. Location services will now work on mobile!');
});

module.exports = server;