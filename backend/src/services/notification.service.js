const pool = require('../config/db');
const logger = require('../utils/logger');

const ALLOWED_TYPES = new Set(['info', 'success', 'warning', 'error']);

class NotificationService {
  constructor() {
    this.io = null;
  }

  attachSocket(io) {
    this.io = io;
  }

  emitToUser(userId, event, payload) {
    if (!this.io || !userId) return;
    this.io.to(`user:${userId}`).emit(event, payload);
  }

  sanitizeType(type) {
    if (!type || !ALLOWED_TYPES.has(type)) return 'info';
    return type;
  }

  async createNotification({ userId, title, message, type = 'info', metadata = {} }) {
    if (!userId || !title) return null;
    const normalizedType = this.sanitizeType(type);

    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, normalizedType, title, message || null, metadata || {}],
    );

    const notification = result.rows[0];
    this.emitToUser(userId, 'notification:new', notification);
    return notification;
  }

  async getNotifications(userId, { limit = 50, offset = 0 } = {}) {
    if (!userId) return [];
    const safeLimit = Math.min(Number(limit) || 50, 200);
    const safeOffset = Number(offset) || 0;

    const result = await pool.query(
      `SELECT *
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, safeLimit, safeOffset],
    );
    return result.rows || [];
  }

  async markAsRead(userId, notificationId) {
    if (!userId || !notificationId) return null;
    const result = await pool.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId],
    );

    const notification = result.rows[0];
    if (notification) {
      this.emitToUser(userId, 'notification:read', { id: notification.id });
    }
    return notification;
  }

  async markAllAsRead(userId) {
    if (!userId) return 0;
    const result = await pool.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId],
    );

    if (result.rowCount > 0) {
      this.emitToUser(userId, 'notification:read-all');
    }
    return result.rowCount;
  }

  async deleteNotification(userId, notificationId) {
    if (!userId || !notificationId) return 0;
    const result = await pool.query(
      `DELETE FROM notifications
       WHERE id = $1 AND user_id = $2`,
      [notificationId, userId],
    );

    if (result.rowCount > 0) {
      this.emitToUser(userId, 'notification:deleted', { id: notificationId });
    }
    return result.rowCount;
  }

  async notifySystemError(userId, title, message, metadata = {}) {
    try {
      await this.createNotification({
        userId,
        title: title || 'خطأ في النظام',
        message,
        type: 'error',
        metadata,
      });
    } catch (error) {
      logger.error('[notification] Failed to send system error notification', error);
    }
  }
}

module.exports = new NotificationService();
