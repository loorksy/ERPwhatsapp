const { Pool } = require('pg');
const env = require('./env');

const options = env.databaseUrl
  ? {
      connectionString: env.databaseUrl,
      max: 10,
      idleTimeoutMillis: 30000,
    }
  : undefined;

const pool = new Pool(options);

pool.on('error', (error) => {
  // Centralize database errors for observability.
  // eslint-disable-next-line no-console
  console.error('[database] Unexpected error on idle client', error);
});

module.exports = pool;
