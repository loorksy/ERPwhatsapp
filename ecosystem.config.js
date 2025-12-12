module.exports = {
  apps: [
    {
      name: 'erpwhatsapp-backend',
      script: './backend/src/index.js',
      cwd: '/opt/erpwhatsapp',
      instances: process.env.PM2_INSTANCES || 'max',
      exec_mode: 'cluster',
      max_memory_restart: process.env.PM2_MAX_MEMORY || '512M',
      env: {
        NODE_ENV: process.env.NODE_ENV || 'production',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      autorestart: true,
      watch: false,
      error_file: process.env.PM2_ERROR_LOG || '/var/log/erpwhatsapp/error.log',
      out_file: process.env.PM2_OUT_LOG || '/var/log/erpwhatsapp/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      merge_logs: true,
    },
  ],
};
