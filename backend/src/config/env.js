const fs = require('fs');
const path = require('path');
const dotenvSafe = require('dotenv-safe');

// Deterministic env file resolution (always prefer backend/.env and backend/.env.example)
const projectRoot = path.join(__dirname, '../../');
const backendEnvPath = path.join(projectRoot, 'backend/.env');
const backendExamplePath = path.join(projectRoot, 'backend/.env.example');
const rootEnvPath = path.join(projectRoot, '.env');
const rootExamplePath = path.join(projectRoot, '.env.example');

const envPath = fs.existsSync(backendEnvPath) ? backendEnvPath : rootEnvPath;
const examplePath = fs.existsSync(backendExamplePath) ? backendExamplePath : rootExamplePath;

// Safe production-forward defaults so MissingEnvVarsError does not break PM2 restarts
const defaults = {
  PORT: '5001',
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://postgres:postgres123@localhost:5432/whatsapp_ai_bot_new',
  REDIS_URL: 'redis://localhost:6379',
  SESSION_SECRET: 'super-secret-session-change-in-production-xyz123',
  JWT_SECRET: 'super-secret-jwt-change-in-production-abc456',
  JWT_EXPIRES_IN: '24h',
  RESET_TOKEN_EXPIRES_MINUTES: '60',
  LOGIN_RATE_LIMIT_WINDOW_MINUTES: '15',
  LOGIN_RATE_LIMIT_MAX: '5',
  API_RATE_LIMIT_WINDOW_MINUTES: '1',
  API_RATE_LIMIT_MAX: '100',
  FRONTEND_URL: 'http://72.60.83.140:8080',
  CORS_ORIGINS: 'http://72.60.83.140:8080,http://localhost:5173',
  OPERATING_HOURS_START: '09:00',
  OPERATING_HOURS_END: '18:00',
  WHATSAPP_SESSION_PATH: '.whatsapp-session',
  WHATSAPP_HEADLESS: 'true',
  DEFAULT_AI_PROVIDER: 'openai',
  OPENAI_API_KEY: '',
  ANTHROPIC_API_KEY: '',
  GEMINI_API_KEY: '',
  EMBEDDING_MODEL: 'text-embedding-3-small',
  KNOWLEDGE_UPLOAD_DIR: './uploads',
  MAX_UPLOAD_SIZE_MB: '10',
  LOG_LEVEL: 'info',
  LOG_DIR: './logs',
  CSRF_COOKIE_NAME: 'XSRF-TOKEN',
  CSRF_HEADER_NAME: 'X-CSRF-Token',
  COOKIE_DOMAIN: '',
};

Object.entries(defaults).forEach(([key, value]) => {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
});

dotenvSafe.config({
  allowEmptyValues: true,
  path: envPath,
  example: examplePath,
});

const corsOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || process.env.CLIENT_URL)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5001,
  databaseUrl: process.env.DATABASE_URL || '',
  redisUrl: process.env.REDIS_URL || '',
  clientUrl: corsOrigins[0] || 'http://72.60.83.140:8080',
  corsOrigins: corsOrigins.length ? corsOrigins : ['http://72.60.83.140:8080'],
  sessionSecret: process.env.SESSION_SECRET || 'change-me',
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  resetTokenExpiresMinutes: Number(process.env.RESET_TOKEN_EXPIRES_MINUTES) || 60,
  loginRateLimitWindowMinutes: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MINUTES) || 15,
  loginRateLimitMax: Number(process.env.LOGIN_RATE_LIMIT_MAX) || 5,
  apiRateLimitWindowMinutes: Number(process.env.API_RATE_LIMIT_WINDOW_MINUTES) || 1,
  apiRateLimitMax: Number(process.env.API_RATE_LIMIT_MAX) || 100,
  operatingHoursStart: process.env.OPERATING_HOURS_START || '',
  operatingHoursEnd: process.env.OPERATING_HOURS_END || '',
  whatsappSessionPath:
    process.env.WHATSAPP_SESSION_PATH || path.join(process.cwd(), '.whatsapp-session'),
  whatsappHeadless: process.env.WHATSAPP_HEADLESS !== 'false',
  defaultAIProvider: process.env.DEFAULT_AI_PROVIDER || 'openai',
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
  knowledgeUploadDir: process.env.KNOWLEDGE_UPLOAD_DIR || path.join(process.cwd(), 'uploads'),
  maxUploadSizeMb: Number(process.env.MAX_UPLOAD_SIZE_MB) || 10,
  logLevel: process.env.LOG_LEVEL || 'info',
  logDir: process.env.LOG_DIR || path.join(process.cwd(), 'logs'),
  csrfCookieName: process.env.CSRF_COOKIE_NAME || 'XSRF-TOKEN',
  csrfHeaderName: process.env.CSRF_HEADER_NAME || 'X-CSRF-Token',
  cookieDomain: process.env.COOKIE_DOMAIN || '',
};

env.trustProxy = true;

module.exports = env;
