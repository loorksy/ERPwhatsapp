const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  databaseUrl: process.env.DATABASE_URL || '',
  redisUrl: process.env.REDIS_URL || '',
  sessionSecret: process.env.SESSION_SECRET || 'change-me',
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  resetTokenExpiresMinutes: Number(process.env.RESET_TOKEN_EXPIRES_MINUTES) || 60,
  whatsappSessionPath:
    process.env.WHATSAPP_SESSION_PATH || path.join(process.cwd(), '.whatsapp-session'),
  whatsappHeadless: process.env.WHATSAPP_HEADLESS !== 'false',
};

module.exports = env;
