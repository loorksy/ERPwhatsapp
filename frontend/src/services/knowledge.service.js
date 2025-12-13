import api from './api.service';

export const fetchKnowledge = async ({ page = 1, pageSize = 10, category, search } = {}) => {
  const params = { page, pageSize };
  if (category) params.category = category;
  if (search) params.search = search;
  const { data } = await api.get('/knowledge', { params });
  return data;
};

export const createKnowledge = async (payload) => {
  const { data } = await api.post('/knowledge', payload);
  return data?.knowledge;
};

export const updateKnowledge = async (id, payload) => {
  const { data } = await api.put(`/knowledge/${id}`, payload);
  return data?.knowledge;
};

export const deleteKnowledge = async (id) => api.delete(`/knowledge/${id}`);

export const uploadKnowledgeDocument = async (formData, onUploadProgress) => {
  const { data } = await api.post('/knowledge/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
  return data;
};

export default {
  fetchKnowledge,
  createKnowledge,
  updateKnowledge,
  deleteKnowledge,
  uploadKnowledgeDocument,
};
