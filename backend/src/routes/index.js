const { Router } = require('express');
const healthController = require('../controllers/health.controller');
const messageController = require('../controllers/message.controller');

const router = Router();

router.get('/health', healthController.status);
router.post('/messages/send', messageController.sendMessage);
router.post('/webhook', messageController.handleWebhook);

module.exports = router;
