const { Client, LocalAuth } = require('whatsapp-web.js');
const env = require('../config/env');
const logger = require('../utils/logger');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isReady = false;
  }

  async initialize() {
    if (this.client) return this.client;

    this.client = new Client({
      authStrategy: new LocalAuth({ dataPath: env.whatsappSessionPath }),
      puppeteer: {
        headless: env.whatsappHeadless,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });

    this.client.on('ready', () => {
      this.isReady = true;
      logger.info('[whatsapp] Client is ready');
    });

    this.client.on('auth_failure', (msg) => {
      logger.error('[whatsapp] Authentication failure', msg);
    });

    this.client.on('message', async (message) => {
      logger.info('[whatsapp] Incoming message', message.from);
      // TODO: push to queue / NLP pipeline.
    });

    await this.client.initialize();
    return this.client;
  }

  async sendTextMessage(phone, message) {
    if (!this.isReady) {
      throw new Error('WhatsApp client not ready');
    }
    const chatId = `${phone}@c.us`;
    return this.client.sendMessage(chatId, message);
  }
}

module.exports = new WhatsAppService();
