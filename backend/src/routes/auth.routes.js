const { Router } = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { loginLimiter } = require('../middleware/rateLimit.middleware');

const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('phone').optional({ nullable: true }).isMobilePhone('any').withMessage('Phone must be valid'),
    body('companyName').optional({ nullable: true }).isLength({ min: 2 }).withMessage('Company name must be at least 2 characters'),
  ],
  authController.register
);

router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  authController.login
);

router.post('/logout', authController.logout);

router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Valid email is required').normalizeEmail()],
  authController.forgotPassword
);

router.post(
  '/reset-password',
  [
    body('token').isLength({ min: 1 }).withMessage('Reset token is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  authController.resetPassword
);

module.exports = router;
