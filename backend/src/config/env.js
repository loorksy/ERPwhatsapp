const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  databaseUrl: process.env.DATABASE_URL || '',
  redisUrl: process.env.REDIS_URL || '',
  sessionSecret: process.env.SESSION_SECRET || 'change-me',
  whatsappSessionPath:
    process.env.WHATSAPP_SESSION_PATH || path.join(process.cwd(), '.whatsapp-session'),
  whatsappHeadless: process.env.WHATSAPP_HEADLESS !== 'false',
};

module.exports = env;
