const { validationResult } = require('express-validator');
const pool = require('../config/db');
const logger = require('../utils/logger');
const { saveMessageToDB } = require('../handlers/message.handler');

const buildFilters = (userId, query) => {
  const clauses = ['user_id = $1'];
  const values = [userId];
  let idx = values.length;

  if (query.status) {
    idx += 1;
    clauses.push(`status = $${idx}`);
    values.push(query.status);
  }

  if (query.priority) {
    idx += 1;
    clauses.push(`priority = $${idx}`);
    values.push(Number(query.priority));
  }

  if (query.search) {
    idx += 1;
    clauses.push(`(contact_phone ILIKE $${idx} OR contact_name ILIKE $${idx})`);
    values.push(`%${query.search}%`);
  }

  return { clauses, values };
};

const getAllConversations = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const userId = req.user?.id;
  const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
  const pageSize = Number(req.query.pageSize) > 0 ? Math.min(Number(req.query.pageSize), 100) : 20;
  const offset = (page - 1) * pageSize;
  const sort = req.query.sort === 'oldest' ? 'created_at ASC' : 'created_at DESC';

  const { clauses, values } = buildFilters(userId, req.query);
  const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const listQuery = `
    SELECT *
    FROM conversations
    ${whereClause}
    ORDER BY ${sort}
    LIMIT ${pageSize} OFFSET ${offset};
  `;

  const countQuery = `SELECT COUNT(*) FROM conversations ${whereClause};`;

  const client = await pool.connect();
  try {
    const [listResult, countResult] = await Promise.all([
      client.query(listQuery, values),
      client.query(countQuery, values),
    ]);

    return res.json({
      data: listResult.rows,
      page,
      pageSize,
      total: Number(countResult.rows[0]?.count || 0),
    });
  } catch (error) {
    logger.error('[conversations] Failed to fetch conversations', error);
    return res.status(500).json({ message: 'Unable to fetch conversations' });
  } finally {
    client.release();
  }
};

const getConversationById = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const userId = req.user?.id;
  const conversationId = Number(req.params.id);
  const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
  const pageSize = Number(req.query.pageSize) > 0 ? Math.min(Number(req.query.pageSize), 200) : 50;
  const offset = (page - 1) * pageSize;

  const client = await pool.connect();
  try {
    const conversation = await client.query(
      `SELECT * FROM conversations WHERE id = $1 AND user_id = $2`,
      [conversationId, userId]
    );
    if (!conversation.rows[0]) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const messages = await client.query(
      `SELECT * FROM messages WHERE conversation_id = $1 ORDER BY timestamp DESC LIMIT $2 OFFSET $3`,
      [conversationId, pageSize, offset]
    );

    return res.json({
      conversation: conversation.rows[0],
      messages: messages.rows,
      page,
      pageSize,
    });
  } catch (error) {
    logger.error('[conversations] Failed to fetch conversation', error);
    return res.status(500).json({ message: 'Unable to fetch conversation' });
  } finally {
    client.release();
  }
};

const updateConversationStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const userId = req.user?.id;
  const conversationId = Number(req.params.id);
  const { status, priority } = req.body;
  const normalizedPriority =
    typeof priority !== 'undefined' && Number.isFinite(Number(priority)) ? Number(priority) : null;

  try {
    const updated = await pool.query(
      `UPDATE conversations
       SET status = COALESCE($1, status),
           priority = COALESCE($2, priority)
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [status || null, normalizedPriority, conversationId, userId]
    );
    if (!updated.rows[0]) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    return res.json({ conversation: updated.rows[0] });
  } catch (error) {
    logger.error('[conversations] Failed to update status', error);
    return res.status(500).json({ message: 'Unable to update conversation' });
  }
};

const addNote = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const userId = req.user?.id;
  const conversationId = Number(req.params.id);
  const { note } = req.body;

  const conversation = await pool.query(
    `SELECT id FROM conversations WHERE id = $1 AND user_id = $2`,
    [conversationId, userId]
  );
  if (!conversation.rows[0]) {
    return res.status(404).json({ message: 'Conversation not found' });
  }

  try {
    const savedNote = await saveMessageToDB({
      conversationId,
      senderType: 'system',
      messageText: note,
      isFromBot: false,
    });
    return res.status(201).json({ note: savedNote });
  } catch (error) {
    logger.error('[conversations] Failed to add note', error);
    return res.status(500).json({ message: 'Unable to add note' });
  }
};

const transferToOperator = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const userId = req.user?.id;
  const conversationId = Number(req.params.id);
  const { operatorName, note } = req.body;

  const client = await pool.connect();
  try {
    const existing = await client.query(
      `UPDATE conversations SET status = 'pending'
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [conversationId, userId]
    );
    if (!existing.rows[0]) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const transferNote = note || `Conversation transferred to ${operatorName || 'operator'}`;
    const savedNote = await saveMessageToDB({
      conversationId,
      senderType: 'system',
      messageText: transferNote,
      isFromBot: false,
    });

    return res.json({ conversation: existing.rows[0], transferNote: savedNote });
  } catch (error) {
    logger.error('[conversations] Failed to transfer conversation', error);
    return res.status(500).json({ message: 'Unable to transfer conversation' });
  } finally {
    client.release();
  }
};

module.exports = {
  getAllConversations,
  getConversationById,
  updateConversationStatus,
  addNote,
  transferToOperator,
};
