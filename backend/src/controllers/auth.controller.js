const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const pool = require('../config/db');
const env = require('../config/env');

const SALT_ROUNDS = 12;

const buildToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

const formatUser = (row) => ({
  id: row.id,
  email: row.email,
  fullName: row.full_name,
  phone: row.phone,
  companyName: row.company_name,
  role: row.role,
});

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  return null;
};

const register = async (req, res) => {
  const validationError = handleValidation(req, res);
  if (validationError) return validationError;

  const { email, password, fullName, phone, companyName } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await pool.query('SELECT id FROM users WHERE lower(email) = $1', [normalizedEmail]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ message: 'Email is already registered' });
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const result = await pool.query(
    `INSERT INTO users (email, password, full_name, phone, company_name)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, full_name, phone, company_name, role, created_at`,
    [normalizedEmail, hashedPassword, fullName, phone || null, companyName || null]
  );

  const user = formatUser(result.rows[0]);
  const token = buildToken(user);
  return res.status(201).json({ user, token });
};

const login = async (req, res) => {
  const validationError = handleValidation(req, res);
  if (validationError) return validationError;

  const { email, password } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  const result = await pool.query(
    'SELECT id, email, password, full_name, phone, company_name, role FROM users WHERE lower(email) = $1',
    [normalizedEmail]
  );

  if (result.rows.length === 0) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const userRow = result.rows[0];
  const passwordMatches = await bcrypt.compare(password, userRow.password);
  if (!passwordMatches) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const user = formatUser(userRow);
  const token = buildToken(user);
  return res.json({ user, token });
};

const logout = async (_req, res) => res.json({ message: 'Logged out successfully' });

const forgotPassword = async (req, res) => {
  const validationError = handleValidation(req, res);
  if (validationError) return validationError;

  const { email } = req.body;
  const normalizedEmail = email.trim().toLowerCase();
  const result = await pool.query('SELECT id FROM users WHERE lower(email) = $1', [normalizedEmail]);

  if (result.rows.length === 0) {
    return res.json({ message: 'If the account exists, a reset link has been sent' });
  }

  const userId = result.rows[0].id;
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expiresAt = new Date(Date.now() + env.resetTokenExpiresMinutes * 60 * 1000);

  await pool.query(
    `UPDATE users
     SET reset_password_token = $1, reset_password_expires_at = $2
     WHERE id = $3`,
    [hashedToken, expiresAt.toISOString(), userId]
  );

  const response = { message: 'If the account exists, a reset link has been sent' };
  if (env.nodeEnv !== 'production') {
    response.resetToken = resetToken;
  }

  return res.json(response);
};

const resetPassword = async (req, res) => {
  const validationError = handleValidation(req, res);
  if (validationError) return validationError;

  const { token, password } = req.body;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const result = await pool.query(
    `SELECT id FROM users
     WHERE reset_password_token = $1
       AND reset_password_expires_at > NOW()`,
    [hashedToken]
  );

  if (result.rows.length === 0) {
    return res.status(400).json({ message: 'Invalid or expired reset token' });
  }

  const userId = result.rows[0].id;
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  await pool.query(
    `UPDATE users
     SET password = $1, reset_password_token = NULL, reset_password_expires_at = NULL
     WHERE id = $2`,
    [hashedPassword, userId]
  );

  return res.json({ message: 'Password has been reset successfully' });
};

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
};
