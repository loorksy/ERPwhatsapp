import api from './api.service';

export const fetchQuickReplies = async ({ search, category } = {}) => {
  const params = {};
  if (search) params.search = search;
  if (category && category !== 'all') params.category = category;
  const { data } = await api.get('/quick-replies', { params });
  return data;
};

export const createQuickReply = async (payload) => {
  const { data } = await api.post('/quick-replies', payload);
  return data?.quickReply;
};

export const updateQuickReply = async (id, payload) => {
  const { data } = await api.put(`/quick-replies/${id}`, payload);
  return data?.quickReply;
};

export const deleteQuickReply = async (id) => api.delete(`/quick-replies/${id}`);

export const reorderQuickReplies = async (orderedIds) =>
  api.post('/quick-replies/reorder', { order: orderedIds });

export default {
  fetchQuickReplies,
  createQuickReply,
  updateQuickReply,
  deleteQuickReply,
  reorderQuickReplies,
};
