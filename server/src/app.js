const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/env');
const routes = require('./routes');
const { apiLimiter } = require('./middleware/rateLimiter');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// 1. Security HTTP Headers
app.use(
  helmet({
    frameguard: { action: 'deny' },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
    hidePoweredBy: true
  })
);

// 2. Cross-Origin Resource Sharing (CORS)
app.use(
  cors({
    origin: (origin, callback) => {
      // In development/test mode, allow requests from localhost dev ports
      const isDevOrTest = config.nodeEnv !== 'production';
      const isLocalhost = origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'));
      const isRenderDomain = origin && origin.endsWith('.onrender.com');

      const normalizedOrigin = origin ? origin.replace(/\/+$/, '') : null;
      const configuredClient = config.clientUrl ? config.clientUrl.replace(/\/+$/, '') : null;

      if (
        !origin ||
        config.clientUrl === '*' ||
        normalizedOrigin === configuredClient ||
        isRenderDomain ||
        (isDevOrTest && isLocalhost)
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS policy'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// 3. Request Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
}

// 4. Body Parsers with payload limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Disable ETag on all dynamic API endpoints to avoid 304 empty responses on browser refresh
app.set('etag', false);

// Prevent caching of all dynamic API responses
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// 5. Global API Rate Limiter
app.use('/api', apiLimiter);

// 6. Root Ping
app.get('/', (req, res) => {
  res.json({
    name: 'Store Rating Platform API',
    version: '1.0.0',
    documentation: '/api/health',
    status: 'online'
  });
});

// 7. Mount Domain API Routes
app.use('/api', routes);

// 8. Handle 404 Undefined Routes
app.use(notFoundHandler);

// 9. Centralized Error Handler
app.use(errorHandler);

module.exports = app;
