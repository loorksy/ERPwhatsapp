const whatsappService = require('../services/whatsapp.service');
const logger = require('../utils/logger');

const connectWhatsApp = async (req, res) => {
  const userId = req.user?.id;
  await whatsappService.initializeWhatsApp(userId);
  return res.status(200).json({ message: 'WhatsApp client initializing' });
};

const getQRCode = async (req, res) => {
  const userId = req.user?.id;
  const qrPayload = await whatsappService.generateQRCode(userId);
  if (!qrPayload) {
    return res.status(404).json({ message: 'No QR code available' });
  }
  return res.status(200).json(qrPayload);
};

const disconnectWhatsApp = async (req, res) => {
  const userId = req.user?.id;
  await whatsappService.handleDisconnect(userId, 'manual_disconnect');
  return res.status(200).json({ message: 'WhatsApp client disconnected' });
};

const getConnectionStatus = async (req, res) => {
  const userId = req.user?.id;
  const status = whatsappService.getConnectionStatus(userId);
  return res.status(200).json(status);
};

const receiveWebhookMessage = async (req, res) => {
  const userId = req.user?.id;
  try {
    await whatsappService.receiveMessage(userId, req.body);
    return res.status(200).json({ message: 'Message received' });
  } catch (error) {
    logger.error('[whatsapp] Failed to handle inbound message', error);
    return res.status(500).json({ message: 'Failed to process message' });
  }
};

module.exports = {
  connectWhatsApp,
  getQRCode,
  disconnectWhatsApp,
  getConnectionStatus,
  receiveWebhookMessage,
};
