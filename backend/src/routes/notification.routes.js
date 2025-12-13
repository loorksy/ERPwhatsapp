const { Router } = require('express');
const { body, param, query } = require('express-validator');
const notificationController = require('../controllers/notification.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = Router();

router.get(
  '/',
  verifyToken,
  [query('limit').optional().isInt({ min: 1, max: 200 }), query('offset').optional().isInt({ min: 0 })],
  notificationController.list,
);

router.post(
  '/',
  verifyToken,
  [
    body('title').isString().trim().notEmpty(),
    body('message').optional().isString().trim(),
    body('type').optional().isIn(['info', 'success', 'warning', 'error']),
    body('metadata').optional().isObject(),
  ],
  notificationController.create,
);

router.put(
  '/:id/read',
  verifyToken,
  [param('id').isInt({ min: 1 })],
  notificationController.markAsRead,
);

router.put('/read-all', verifyToken, notificationController.markAllAsRead);

router.delete(
  '/:id',
  verifyToken,
  [param('id').isInt({ min: 1 })],
  notificationController.remove,
);

module.exports = router;
