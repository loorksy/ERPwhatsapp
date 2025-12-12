const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const env = require('./config/env');
const pool = require('./config/db');
const redis = require('./config/redis');
const whatsappService = require('./services/whatsapp.service');
const notificationService = require('./services/notification.service');
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
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: env.clientUrl || '*',
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', (socket) => {
      logger.info(`[socket] client connected ${socket.id}`);
      socket.on('join', ({ userId }) => {
        if (userId) {
          socket.join(`user:${userId}`);
        }
      });

      socket.on('disconnect', (reason) => {
        logger.info(`[socket] client disconnected (${reason}) ${socket.id}`);
      });
    });

    whatsappService.attachSocket(io);
    notificationService.attachSocket(io);

    server.listen(env.port, () => {
      logger.info(`🚀 API server ready on port ${env.port}`);
    });
  } catch (error) {
    logger.error('Failed to bootstrap the application', error);
    process.exit(1);
  }
}

bootstrap();
