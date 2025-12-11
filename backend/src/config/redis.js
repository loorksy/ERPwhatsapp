const Redis = require('ioredis');
const env = require('./env');

const redis = new Redis(env.redisUrl || undefined);

redis.on('connect', () => {
  // eslint-disable-next-line no-console
  console.info('[redis] Connected');
});

redis.on('error', (error) => {
  // eslint-disable-next-line no-console
  console.error('[redis] Connection error', error);
});

module.exports = redis;
