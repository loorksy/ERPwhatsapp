import api from './api.service';

export const fetchAISettings = (provider) =>
  api.get('/ai/settings', { params: provider ? { provider } : undefined }).then((res) => res.data.settings);

export const updateAISettings = (payload) => api.put('/ai/settings', payload).then((res) => res.data.settings);

export const testAIConnection = (payload) => api.post('/ai/test', payload).then((res) => res.data);

export const fetchProviders = () => api.get('/ai/providers').then((res) => res.data.providers || []);

export const switchAIProvider = (provider) => api.post('/ai/switch', { provider }).then((res) => res.data);

export default {
  fetchAISettings,
  updateAISettings,
  testAIConnection,
  fetchProviders,
  switchAIProvider,
};
