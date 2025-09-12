const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const crypto = require('crypto');

dotenv.config();

const errorHandler = require('./middleware/errorHandler');

const logger = {
  info: console.log,
  warn: console.warn,
  error: console.error
};

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/securedUserRoutes');
const twoFactorAuthRoutes = require('./routes/twoFactorAuthRoutes');
const campaignTypeRoutes = require('./routes/campaignTypeRoutes');
const campaignDataRoutes = require('./routes/campaignDataRoutes');
const adsRoutes = require('./routes/adsRoutes');
const reportRoutes = require('./routes/reportRoutes');
const cardsRoutes = require('./routes/cardsRoutes');
const cardUsersRoutes = require('./routes/cardUsersRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const permissionsRoutes = require('./routes/permissionsRoutes');
const modulesRoutes = require('./routes/modulesRoutes');

const app = express();

// Trust proxy; adjust hop count per your deployment (e.g., CDN->Nginx->app = 2)
app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS || 1)); // [OK]

// Non-fatal env check
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_NAME'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  logger.warn('Warning: Missing environment variables:', missingEnvVars);
  logger.info('Server will continue but some features may not work properly');
}

// Security headers
app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(helmet.contentSecurityPolicy({
  useDefaults: true,
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "https:", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https:"]
  }
})); // [13]

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) }
  }));
}

// CORS
const dev = process.env.NODE_ENV !== 'production';
const corsOptions = {
  origin: dev ? true : (origin, cb) => {
    const allowlist = (process.env.CORS_ALLOWLIST || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!origin || allowlist.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS policy'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['X-Total-Count', 'X-Current-Page', 'X-Total-Pages']
};
app.use(cors(corsOptions));
// Optional but useful for explicit preflight handling and debugging
// app.options('*', cors(corsOptions)); // disabled due to path-to-regexp issue [12]

// Body parsers
app.use(express.json({
  limit: process.env.JSON_LIMIT || '10mb',
  verify: (req, res, buf) => { req.rawBody = buf; }
}));
app.use(express.urlencoded({ extended: true, limit: process.env.URLENCODED_LIMIT || '10mb' }));

// Global rate limiting
const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: dev ? 1000 : 500,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  // If you see proxy-local IPs, verify trust proxy. If still needed, normalize:
  // keyGenerator: (req) => (req.ip || req.socket.remoteAddress || 'unknown').replace(/:\d+[^:]*$/, '')
});
app.use(globalRateLimit);

// Request ID
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Request timing
app.use((req, res, next) => {
  req.startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    if (duration > 5000) {
      logger.warn(`Slow request: ${req.method} ${req.originalUrl} - ${duration}ms`);
    }
  });
  next();
});

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0',
  setHeaders: (res, filePath) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', 'inline');
  }
}));

// Serve analytics dashboard
app.use('/analytics', express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1h' : '0'
}));

// Diagnostics (remove or protect in prod)
app.get('/ip', (req, res) => res.send({ ip: req.ip }));
app.get('/x-forwarded-for', (req, res) => res.send({ xff: req.headers['x-forwarded-for'] }));

// API docs
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Ads Reporting API Documentation',
    version: '1.0.0',
    description: 'Complete API documentation for the Ads Reporting System',
    baseUrl: `${req.protocol}://${req.get('host')}/api`
  });
});

// Health check
app.get('/api/health', async (req, res) => {
  const healthCheck = {
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    system: {
      uptime: process.uptime(),
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
        external: Math.round((process.memoryUsage().external / 1024 / 1024) * 100) / 100
      },
      environment: process.env.NODE_ENV,
      version: process.version,
      platform: process.platform
    }
  };

  try {
    const { pool } = require('./config/database');
    await pool.query('SELECT 1');
    healthCheck.database = { status: 'connected' };
  } catch (error) {
    healthCheck.database = { status: 'disconnected', error: error.message };
    healthCheck.success = false;
    return res.status(503).json(healthCheck);
  }

  res.status(200).json(healthCheck);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/2fa', twoFactorAuthRoutes);
app.use('/api/campaign-types', campaignTypeRoutes);
app.use('/api/campaign-data', campaignDataRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/cards', cardsRoutes);
app.use('/api/card-users', cardUsersRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/permissions', permissionsRoutes);
app.use('/api/modules', modulesRoutes);
// Root
app.get('/', (req, res) => {
  res.json({
    name: 'Ads Reporting API',
    version: '1.0.0',
    description: 'RESTful API for Ads Reporting and Campaign Management System',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    documentation: `${req.protocol}://${req.get('host')}/api/docs`,
    health: `${req.protocol}://${req.get('host')}/api/health`,
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      campaignTypes: '/api/campaign-types',
      campaignData: '/api/campaign-data',
      ads: '/api/ads',
      reports: '/api/reports',
      cards: '/api/cards',
      cardUsers: '/api/card-users'
    },
    support: {
      documentation: '/api/docs',
      health: '/api/health',
      contact: process.env.SUPPORT_EMAIL || 'support@company.com'
    }
  });
});

// Favicon
app.get('/favicon.ico', (req, res) => res.status(204).end());

// 404
app.use((req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl} from IP: ${req.ip}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableRoutes: {
      documentation: '/api/docs',
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users'
    }
  });
});

// Error handler (last)
app.use((err, req, res, next) => {
  logger.error(`Error in ${req.method} ${req.originalUrl}:`, {
    error: err.message,
    stack: err.stack,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.id
  });

  if (err.message === 'Not allowed by CORS policy') {
    if (!dev) {
      return res.status(403).json({
        success: false,
        message: 'CORS policy violation',
        timestamp: new Date().toISOString()
      });
    }
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Request entity too large',
      timestamp: new Date().toISOString()
    });
  }

  if (typeof errorHandler === 'function') {
    return errorHandler(err, req, res, next);
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    timestamp: new Date().toISOString(),
    ...(dev && { error: err.message })
  });
});

module.exports = app;
