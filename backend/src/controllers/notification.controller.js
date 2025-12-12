const { validationResult } = require('express-validator');
const notificationService = require('../services/notification.service');

const create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const userId = req.user?.id;
  const { title, message, type, metadata } = req.body;
  const notification = await notificationService.createNotification({ userId, title, message, type, metadata });
  return res.status(201).json(notification);
};

const list = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const userId = req.user?.id;
  const { limit, offset } = req.query;
  const notifications = await notificationService.getNotifications(userId, { limit, offset });
  return res.status(200).json(notifications);
};

const markAsRead = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const userId = req.user?.id;
  const notificationId = Number(req.params.id);
  const notification = await notificationService.markAsRead(userId, notificationId);
  if (!notification) return res.status(404).json({ message: 'Notification not found' });
  return res.status(200).json(notification);
};

const markAllAsRead = async (req, res) => {
  const userId = req.user?.id;
  const count = await notificationService.markAllAsRead(userId);
  return res.status(200).json({ updated: count });
};

const remove = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const userId = req.user?.id;
  const notificationId = Number(req.params.id);
  const deleted = await notificationService.deleteNotification(userId, notificationId);
  if (!deleted) return res.status(404).json({ message: 'Notification not found' });
  return res.status(204).send();
};

module.exports = {
  create,
  list,
  markAsRead,
  markAllAsRead,
  remove,
};
