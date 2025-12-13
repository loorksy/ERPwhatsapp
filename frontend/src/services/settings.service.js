import api from './api.service';

export async function fetchAdvancedSettings() {
  const { data } = await api.get('/settings/advanced');
  return data;
}

export async function updateAdvancedSettings(payload) {
  const { data } = await api.put('/settings/advanced', payload);
  return data;
}
