import api from './api.service';

export const fetchNotifications = (params = {}) => api.get('/notifications', { params });

export const markNotificationRead = (id) => api.put(`/notifications/${id}/read`);

export const markAllNotificationsRead = () => api.put('/notifications/read-all');

export const deleteNotification = (id) => api.delete(`/notifications/${id}`);

export const createNotification = (payload) => api.post('/notifications', payload);

export default {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  createNotification,
};
