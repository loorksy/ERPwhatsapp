const path = require('path');

const appBaseDir = process.env.APP_BASE_DIR || '/var/www/whatsapp-ai-bot-new/backend';

module.exports = {
  apps: [
    {
      name: 'whatsapp-ai-bot-new',
      script: './src/index.js',
      cwd: appBaseDir,
      instances: process.env.PM2_INSTANCES || 1,
      exec_mode: 'fork',
      max_memory_restart: process.env.PM2_MAX_MEMORY || '512M',
      env: {
        NODE_ENV: process.env.NODE_ENV || 'production',
        PORT: process.env.PORT || 5001,
        FRONTEND_URL: process.env.FRONTEND_URL || 'http://72.60.83.140:8080',
        CORS_ORIGINS: process.env.CORS_ORIGINS || 'http://72.60.83.140:8080,http://localhost:5173',
        COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || '',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 5001,
        FRONTEND_URL: process.env.FRONTEND_URL || 'http://72.60.83.140:8080',
        CORS_ORIGINS: process.env.CORS_ORIGINS || 'http://72.60.83.140:8080,http://localhost:5173',
        COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || '',
      },
      autorestart: true,
      watch: false,
      error_file: process.env.PM2_ERROR_LOG || path.join(appBaseDir, 'logs/pm2/error.log'),
      out_file: process.env.PM2_OUT_LOG || path.join(appBaseDir, 'logs/pm2/out.log'),
      log_file: process.env.PM2_COMBINED_LOG || path.join(appBaseDir, 'logs/pm2/combined.log'),
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      merge_logs: true,
      env_file: path.join(appBaseDir, '.env'),
    },
  ],
};
