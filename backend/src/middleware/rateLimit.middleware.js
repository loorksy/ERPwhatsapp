const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const apiLimiter = rateLimit({
  windowMs: env.apiRateLimitWindowMinutes * 60 * 1000,
  max: env.apiRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.',
});

const loginLimiter = rateLimit({
  windowMs: env.loginRateLimitWindowMinutes * 60 * 1000,
  max: env.loginRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts. Please try again later.',
  skipSuccessfulRequests: false,
});

module.exports = {
  apiLimiter,
  loginLimiter,
};
