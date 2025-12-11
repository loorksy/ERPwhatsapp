const app = require('./app');
const env = require('./config/env');
const pool = require('./config/database');
const redis = require('./config/redis');
const whatsappService = require('./services/whatsapp.service');
const logger = require('./utils/logger');

async function bootstrap() {
  try {
    // Ensure connections are ready before accepting traffic.
    if (env.databaseUrl) {
      await pool.connect();
    } else {
      logger.warn('DATABASE_URL not set. Database features are disabled.');
    }

    if (env.redisUrl) {
      await redis.ping();
    } else {
      logger.warn('REDIS_URL not set. Queue and cache features are disabled.');
    }

    await whatsappService.initialize();

    app.listen(env.port, () => {
      logger.info(`🚀 API server ready on port ${env.port}`);
    });
  } catch (error) {
    logger.error('Failed to bootstrap the application', error);
    process.exit(1);
  }
}

bootstrap();
