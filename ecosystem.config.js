module.exports = {
  apps: [
    {
      name: 'whatsapp-ai-bot-new',
      script: './backend/src/index.js',
      cwd: process.env.PWD || __dirname,
      instances: process.env.PM2_INSTANCES || 1,
      exec_mode: 'cluster',
      max_memory_restart: process.env.PM2_MAX_MEMORY || '512M',
      env: {
        NODE_ENV: process.env.NODE_ENV || 'production',
        PORT: process.env.PORT || 5001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 5001,
      },
      autorestart: true,
      watch: false,
      error_file: process.env.PM2_ERROR_LOG || '/var/log/erpwhatsapp/error.log',
      out_file: process.env.PM2_OUT_LOG || '/var/log/erpwhatsapp/out.log',
      log_file: process.env.PM2_COMBINED_LOG || '/var/log/erpwhatsapp/combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      merge_logs: true,
      env_file: './backend/.env',
    },
  ],
};
