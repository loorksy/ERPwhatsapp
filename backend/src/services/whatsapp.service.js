const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const pool = require('../config/db');
const env = require('../config/env');
const logger = require('../utils/logger');
const messageHandler = require('../handlers/message.handler');
const notificationService = require('./notification.service');

class WhatsAppService {
  constructor() {
    this.io = null;
    this.sessions = new Map(); // userId -> { client, status, qrCode, phoneNumber, isReady }
  }

  attachSocket(io) {
    this.io = io;
  }

  async initializeWhatsApp(userId) {
    if (!userId) {
      throw new Error('User id is required to initialize WhatsApp');
    }

    const existing = this.sessions.get(userId);
    if (existing?.client) {
      return existing.client;
    }

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: `user-${userId}`,
        dataPath: env.whatsappSessionPath,
      }),
      webVersionCache: { type: 'local' },
      puppeteer: {
        headless: env.whatsappHeadless,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });

    this.sessions.set(userId, {
      client,
      status: 'initializing',
      qrCode: null,
      phoneNumber: null,
      isReady: false,
    });

    this.registerEventHandlers(userId, client);
    await client.initialize();
    return client;
  }

  registerEventHandlers(userId, client) {
    client.on('qr', async (qr) => {
      logger.info(`[whatsapp][user:${userId}] QR code received`);
      const sessionState = this.sessions.get(userId) || {};
      sessionState.qrCode = qr;
      sessionState.status = 'qr';
      sessionState.isReady = false;
      this.sessions.set(userId, sessionState);

      await this.emitQrCode(userId, qr);
    });

    client.on('ready', async () => {
      const phoneNumber = client.info?.wid?._serialized?.split('@')[0] || null;
      logger.info(`[whatsapp][user:${userId}] Client is ready for ${phoneNumber || 'unknown'}`);
      const sessionState = this.sessions.get(userId) || {};
      sessionState.status = 'ready';
      sessionState.isReady = true;
      sessionState.phoneNumber = phoneNumber;
      sessionState.qrCode = null;
      this.sessions.set(userId, sessionState);

      await this.saveSession(userId, { status: 'ready' }, phoneNumber, true);
    });

    client.on('authenticated', async (sessionData) => {
      logger.info(`[whatsapp][user:${userId}] Authentication successful`);
      await this.saveSession(userId, sessionData || {}, null, true);
    });

    client.on('message', async (message) => {
      await this.receiveMessage(userId, message);
    });

    client.on('disconnected', async (reason) => {
      await this.handleDisconnect(userId, reason);
    });

    client.on('auth_failure', async (msg) => {
      logger.error(`[whatsapp][user:${userId}] Authentication failure`, msg);
      await this.handleDisconnect(userId, 'auth_failure');
    });
  }

  async emitQrCode(userId, qr) {
    if (!qr) return null;
    const qrImage = await QRCode.toDataURL(qr, { margin: 1, scale: 6 });
    if (this.io) {
      this.io.to(this.socketRoom(userId)).emit('whatsapp:qr', { qr, image: qrImage });
    }
    return { qr, image: qrImage };
  }

  async generateQRCode(userId) {
    const sessionState = this.sessions.get(userId);
    if (!sessionState?.qrCode) return null;
    return this.emitQrCode(userId, sessionState.qrCode);
  }

  async sendMessage(userId, phone, message) {
    let sessionState = this.sessions.get(userId);
    if (!sessionState?.client) {
      await this.initializeWhatsApp(userId);
      sessionState = this.sessions.get(userId);
    }

    if (!sessionState?.isReady || !sessionState.client) {
      throw new Error('WhatsApp client not ready');
    }
    const chatId = `${phone}@c.us`;
    return sessionState.client.sendMessage(chatId, message);
  }

  async receiveMessage(userId, message) {
    logger.info(`[whatsapp][user:${userId}] Incoming message from ${message.from}`);
    await messageHandler.processIncomingMessage(userId, message);
  }

  async saveSession(userId, sessionData = {}, phoneNumber = null, isConnected = false) {
    if (!userId) return null;
    const normalizedPhone = phoneNumber || 'unknown';
    const query = `
      INSERT INTO whatsapp_sessions (user_id, session_data, is_connected, phone_number)
      VALUES ($1, $2::jsonb, $3, $4)
      ON CONFLICT (user_id, phone_number)
      DO UPDATE SET session_data = EXCLUDED.session_data, is_connected = EXCLUDED.is_connected, phone_number = EXCLUDED.phone_number
      RETURNING id;
    `;

    try {
      await pool.query(query, [userId, sessionData, isConnected, normalizedPhone]);
    } catch (error) {
      logger.error(`[whatsapp][user:${userId}] Failed to persist session`, error);
    }
  }

  async restoreSession(userId) {
    const query = `
      SELECT session_data, is_connected, phone_number
      FROM whatsapp_sessions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1;
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  async handleDisconnect(userId, reason = 'unknown') {
    logger.warn(`[whatsapp][user:${userId}] Disconnected: ${reason}`);
    const sessionState = this.sessions.get(userId) || {};
    sessionState.status = 'disconnected';
    sessionState.isReady = false;
    this.sessions.set(userId, sessionState);
    await this.saveSession(userId, { status: 'disconnected', reason }, sessionState.phoneNumber, false);

    try {
      await notificationService.createNotification({
        userId,
        type: reason === 'auth_failure' ? 'error' : 'warning',
        title: 'انقطاع اتصال واتساب',
        message: `تم قطع الاتصال بسبب: ${reason}`,
        metadata: { reason },
      });
    } catch (error) {
      logger.error('[notification] Failed to push WhatsApp disconnect alert', error);
    }

    if (sessionState.client) {
      try {
        await sessionState.client.destroy();
      } catch (error) {
        logger.error(`[whatsapp][user:${userId}] Error while destroying client`, error);
      }
    }
  }

  async reconnect(userId) {
    logger.info(`[whatsapp][user:${userId}] Attempting to reconnect WhatsApp client`);
    return this.initializeWhatsApp(userId);
  }

  socketRoom(userId) {
    return `user:${userId}`;
  }

  getConnectionStatus(userId) {
    const sessionState = this.sessions.get(userId);
    if (!sessionState) {
      return { status: 'disconnected', isReady: false };
    }
    return {
      status: sessionState.status,
      isReady: sessionState.isReady,
      phoneNumber: sessionState.phoneNumber,
    };
  }
}

module.exports = new WhatsAppService();
