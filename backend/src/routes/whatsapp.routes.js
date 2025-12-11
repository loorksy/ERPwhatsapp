const { Router } = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const whatsappController = require('../controllers/whatsapp.controller');

const router = Router();

router.post('/connect', verifyToken, whatsappController.connectWhatsApp);
router.get('/qr', verifyToken, whatsappController.getQRCode);
router.post('/disconnect', verifyToken, whatsappController.disconnectWhatsApp);
router.get('/status', verifyToken, whatsappController.getConnectionStatus);

module.exports = router;
