const { Router } = require('express');
const { body, param, query } = require('express-validator');
const conversationController = require('../controllers/conversation.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = Router();

router.get(
  '/',
  verifyToken,
  [
    query('page').optional().isInt({ min: 1 }),
    query('pageSize').optional().isInt({ min: 1, max: 200 }),
    query('status').optional().isIn(['open', 'pending', 'closed', 'archived']),
    query('priority').optional().isInt({ min: 0, max: 5 }),
    query('search').optional().isString().trim(),
    query('sort').optional().isIn(['latest', 'oldest']),
  ],
  conversationController.getAllConversations
);

router.get(
  '/:id',
  verifyToken,
  [
    param('id').isInt({ min: 1 }),
    query('page').optional().isInt({ min: 1 }),
    query('pageSize').optional().isInt({ min: 1, max: 500 }),
  ],
  conversationController.getConversationById
);

router.put(
  '/:id/status',
  verifyToken,
  [
    param('id').isInt({ min: 1 }),
    body('status').optional().isIn(['open', 'pending', 'closed', 'archived']),
    body('priority').optional().isInt({ min: 0, max: 5 }),
  ],
  conversationController.updateConversationStatus
);

router.post(
  '/:id/notes',
  verifyToken,
  [param('id').isInt({ min: 1 }), body('note').isString().trim().notEmpty()],
  conversationController.addNote
);

router.post(
  '/:id/transfer',
  verifyToken,
  [
    param('id').isInt({ min: 1 }),
    body('operatorName').optional().isString().trim(),
    body('note').optional().isString().trim(),
  ],
  conversationController.transferToOperator
);

module.exports = router;
