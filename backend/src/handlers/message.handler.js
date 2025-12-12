const pool = require('../config/db');
const logger = require('../utils/logger');
const env = require('../config/env');
const notificationService = require('../services/notification.service');

const normalizePhone = (phone) => (phone ? phone.replace(/\D/g, '') : null);

const checkOperatingHours = () => {
  if (!env.operatingHoursStart || !env.operatingHoursEnd) return true;
  const now = new Date();
  const [startHour, startMinute] = env.operatingHoursStart.split(':').map(Number);
  const [endHour, endMinute] = env.operatingHoursEnd.split(':').map(Number);

  const start = new Date(now);
  start.setHours(startHour, startMinute || 0, 0, 0);
  const end = new Date(now);
  end.setHours(endHour, endMinute || 0, 0, 0);

  if (end <= start) {
    // Overnight window (e.g., 22:00 - 06:00)
    return now >= start || now <= end;
  }
  return now >= start && now <= end;
};

const getOrCreateConversation = async (userId, contactPhone, contactName) => {
  const client = await pool.connect();
  try {
    const existing = await client.query(
      `SELECT * FROM conversations WHERE user_id = $1 AND contact_phone = $2 ORDER BY created_at DESC LIMIT 1`,
      [userId, contactPhone]
    );
    if (existing.rows[0]) {
      if (contactName && !existing.rows[0].contact_name) {
        await client.query(`UPDATE conversations SET contact_name = $1 WHERE id = $2`, [contactName, existing.rows[0].id]);
        existing.rows[0].contact_name = contactName;
      }
      return existing.rows[0];
    }

    const inserted = await client.query(
      `INSERT INTO conversations (user_id, contact_phone, contact_name)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, contactPhone, contactName || null]
    );
    return inserted.rows[0];
  } finally {
    client.release();
  }
};

const saveMessageToDB = async ({ conversationId, senderType, messageText, mediaUrl = null, timestamp = new Date(), isFromBot = false }) => {
  const result = await pool.query(
    `INSERT INTO messages (conversation_id, sender_type, message_text, media_url, timestamp, is_from_bot)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [conversationId, senderType, messageText || null, mediaUrl, timestamp, isFromBot]
  );
  return result.rows[0];
};

const detectIntent = async (text = '') => {
  const lowered = text.toLowerCase();
  if (!lowered.trim()) return { intent: 'unknown', confidence: 0 };

  const intents = [
    { key: 'greeting', keywords: ['hello', 'hi', 'hey', 'مرحبا', 'السلام'], confidence: 0.65 },
    { key: 'support', keywords: ['help', 'issue', 'problem', 'support', 'مشكلة', 'دعم'], confidence: 0.7 },
    { key: 'pricing', keywords: ['price', 'cost', 'plan', 'subscription', 'سعر', 'تكلفة'], confidence: 0.72 },
    { key: 'handoff', keywords: ['agent', 'human', 'representative', 'بشري', 'موظف'], confidence: 0.8 },
  ];

  for (const intent of intents) {
    if (intent.keywords.some((kw) => lowered.includes(kw))) {
      return { intent: intent.key, confidence: intent.confidence };
    }
  }
  return { intent: 'unknown', confidence: 0.3 };
};

const shouldBotRespond = async (conversation, incomingMessage) => {
  if (!conversation) return false;
  if (['closed', 'archived'].includes(conversation.status)) return false;
  if (!checkOperatingHours()) return false;
  if (!incomingMessage?.message_text && !incomingMessage?.media_url) return false;
  return true;
};

const persistMedia = async (message) => {
  try {
    const media = await message.downloadMedia();
    if (!media) return null;
    const prefix = media.mimetype ? `data:${media.mimetype};base64,` : 'data:application/octet-stream;base64,';
    return `${prefix}${media.data}`;
  } catch (error) {
    logger.error('[message] Failed to persist media payload', error);
    return null;
  }
};

const processIncomingMessage = async (userId, waMessage) => {
  const contactPhone = normalizePhone(waMessage.fromMe ? waMessage.to : waMessage.from);
  if (!contactPhone) {
    logger.warn(`[message] Unable to normalize phone for message id ${waMessage.id?.id}`);
    return null;
  }

  const contactName = waMessage._data?.notifyName || waMessage._data?.pushname || null;
  const conversation = await getOrCreateConversation(userId, contactPhone, contactName);
  const mediaUrl = waMessage.hasMedia ? await persistMedia(waMessage) : null;
  const timestamp = waMessage.timestamp ? new Date(waMessage.timestamp * 1000) : new Date();

  const savedMessage = await saveMessageToDB({
    conversationId: conversation.id,
    senderType: waMessage.fromMe ? 'user' : 'contact',
    messageText: waMessage.body,
    mediaUrl,
    timestamp,
    isFromBot: false,
  });

  const shouldRespond = await shouldBotRespond(conversation, savedMessage);
  const intent = await detectIntent(waMessage.body || '');

  if (!waMessage.fromMe) {
    try {
      await notificationService.createNotification({
        userId,
        type: 'info',
        title: 'رسالة جديدة',
        message: `رسالة جديدة من ${contactName || contactPhone}`,
        metadata: { conversationId: conversation.id, messageId: savedMessage.id },
      });
    } catch (error) {
      logger.error('[notification] Failed to push new message notification', error);
    }
  }

  if (intent.intent === 'handoff') {
    try {
      await notificationService.createNotification({
        userId,
        type: 'warning',
        title: 'محادثة تحتاج تدخل',
        message: `يحتاج ${contactName || contactPhone} إلى تدخل بشري`,
        metadata: { conversationId: conversation.id, intent },
      });
    } catch (error) {
      logger.error('[notification] Failed to push escalation notification', error);
    }
  }

  return { conversation, message: savedMessage, shouldRespond, intent };
};

module.exports = {
  processIncomingMessage,
  saveMessageToDB,
  getOrCreateConversation,
  shouldBotRespond,
  checkOperatingHours,
  detectIntent,
};
