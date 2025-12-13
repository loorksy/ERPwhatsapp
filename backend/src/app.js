require('express-async-errors');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const env = require('./config/env');
const { apiLimiter } = require('./middleware/rateLimit.middleware');
const sanitizeRequest = require('./middleware/sanitize.middleware');
const logger = require('./utils/logger');

const app = express();

// Respect proxy headers for secure cookies and logging behind Nginx
if (env.trustProxy) {
  app.set('trust proxy', 1);
}

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https:'],
        styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", ...env.corsOrigins],
        frameAncestors: ["'none'"],
      },
    },
    hsts: env.nodeEnv === 'production',
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'no-referrer' },
  })
);

const allowedOrigins = new Set(env.corsOrigins);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(cookieParser(env.sessionSecret));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeRequest);

if (env.nodeEnv !== 'test') {
  app.use(morgan('combined', { stream: logger.stream }));
}

app.use('/api', apiLimiter);

app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  logger.error('Unhandled error', err);
  res.status(500).json({ message: 'Internal server error' });
});

module.exports = app;
