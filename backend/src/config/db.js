const { Pool } = require('pg');
const env = require('./env');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: env.databaseUrl || undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  ssl: env.nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('connect', () => {
  logger.info('[database] connection established');
});

pool.on('error', (error) => {
  logger.error('[database] Unexpected error on idle client', error);
});

module.exports = pool;
