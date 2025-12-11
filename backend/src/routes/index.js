const { Router } = require('express');
const healthController = require('../controllers/health.controller');
const messageController = require('../controllers/message.controller');
const authRoutes = require('./auth.routes');
const whatsappRoutes = require('./whatsapp.routes');
const conversationRoutes = require('./conversation.routes');
const aiRoutes = require('./ai.routes');
const { verifyToken } = require('../middleware/auth.middleware');

const router = Router();

router.get('/health', healthController.status);
router.post('/messages/send', verifyToken, messageController.sendMessage);
router.post('/webhook', messageController.handleWebhook);
router.use('/auth', authRoutes);
router.use('/whatsapp', whatsappRoutes);
router.use('/conversations', conversationRoutes);
router.use('/ai', aiRoutes);

module.exports = router;
