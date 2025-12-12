const path = require('path');
const dotenvSafe = require('dotenv-safe');

dotenvSafe.config({
  allowEmptyValues: false,
  example: path.join(process.cwd(), '.env.example'),
});

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  databaseUrl: process.env.DATABASE_URL || '',
  redisUrl: process.env.REDIS_URL || '',
  clientUrl: process.env.CLIENT_URL || '*',
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
};

module.exports = env;
