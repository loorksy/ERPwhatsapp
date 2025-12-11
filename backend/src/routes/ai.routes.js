const { Router } = require('express');
const { body, query } = require('express-validator');
const aiController = require('../controllers/ai.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = Router();

router.get('/settings', verifyToken, [query('provider').optional().isString().trim()], aiController.getAISettings);

router.put(
  '/settings',
  verifyToken,
  [
    body('provider').isIn(['openai', 'claude', 'gemini']).withMessage('Unsupported provider'),
    body('model').isString().trim().notEmpty(),
    body('temperature').optional().isFloat({ min: 0, max: 2 }),
    body('maxTokens').optional().isInt({ min: 1 }),
    body('systemPrompt').optional().isString(),
    body('settings').optional().isObject(),
    body('apiKey').optional().isString().notEmpty(),
  ],
  aiController.updateAISettings
);

router.post(
  '/test',
  verifyToken,
  [
    body('provider').optional().isIn(['openai', 'claude', 'gemini']),
    body('prompt').optional().isString(),
    body('model').optional().isString(),
    body('temperature').optional().isFloat({ min: 0, max: 2 }),
    body('maxTokens').optional().isInt({ min: 1 }),
    body('systemPrompt').optional().isString(),
    body('settings').optional().isObject(),
    body('context').optional().isArray(),
  ],
  aiController.testAIConnection
);

router.get('/providers', verifyToken, aiController.getAvailableProviders);

router.post(
  '/switch',
  verifyToken,
  [body('provider').isIn(['openai', 'claude', 'gemini']).withMessage('Unsupported provider')],
  aiController.switchProvider
);

module.exports = router;
