const whatsappService = require('../services/whatsapp.service');
const messageService = require('../services/message.service');

const sendMessage = async (req, res) => {
  const userId = req.user?.id;
  const { phone, message } = req.body;
  if (!phone || !message) {
    return res.status(400).json({ message: 'phone and message are required' });
  }

  const formattedMessage = await messageService.formatOutgoingMessage(message);
  const result = await whatsappService.sendMessage(userId, phone, formattedMessage);
  return res.status(200).json({ message: 'Message queued', result });
};

const handleWebhook = async (req, res) => {
  await messageService.handleIncomingPayload(req.body);
  return res.status(200).json({ received: true });
};

module.exports = {
  sendMessage,
  handleWebhook,
};
