const pool = require('../config/database');
const redis = require('../config/redis');
const logger = require('../utils/logger');

const formatOutgoingMessage = async (message) => {
  // TODO: enrich message with NLP / templates / personalization.
  return message.trim();
};

const handleIncomingPayload = async (payload) => {
  // TODO: persist inbound payload to PostgreSQL and trigger automation workflows.
  await redis.publish('incoming:messages', JSON.stringify(payload));
  logger.info('[message] Incoming payload queued for processing');
};

const saveConversationEvent = async (event) => {
  const client = await pool.connect();
  try {
    await client.query('INSERT INTO conversation_events(payload) VALUES($1)', [event]);
  } finally {
    client.release();
  }
};

module.exports = {
  formatOutgoingMessage,
  handleIncomingPayload,
  saveConversationEvent,
};
