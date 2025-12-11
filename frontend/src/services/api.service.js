import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const TOKEN_KEY = 'auth_token';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

const getToken = () => localStorage.getItem(TOKEN_KEY);

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      localStorage.removeItem(TOKEN_KEY);
    }

    const normalizedError = {
      message: error?.response?.data?.message || error.message || 'حدث خطأ غير متوقع',
      status,
      data: error?.response?.data,
      original: error,
    };

    return Promise.reject(normalizedError);
  },
);

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export default api;
