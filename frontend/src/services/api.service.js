import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
const CSRF_HEADER = import.meta.env.VITE_CSRF_HEADER_NAME || 'X-CSRF-Token';
const TOKEN_KEY = 'auth_token';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  xsrfCookieName: import.meta.env.VITE_CSRF_COOKIE_NAME || 'XSRF-TOKEN',
  xsrfHeaderName: CSRF_HEADER,
});

let csrfToken;
let csrfPromise;

const getToken = () => localStorage.getItem(TOKEN_KEY);

const fetchCsrfToken = async () => {
  const response = await axios.get(`${API_BASE_URL}/csrf-token`, {
    withCredentials: true,
  });
  csrfToken = response.data?.csrfToken || response.headers[CSRF_HEADER.toLowerCase()];
  return csrfToken;
};

const ensureCsrfToken = async () => {
  if (csrfToken) return csrfToken;
  if (!csrfPromise) {
    csrfPromise = fetchCsrfToken().finally(() => {
      csrfPromise = null;
    });
  }
  return csrfPromise;
};

api.interceptors.request.use(
  async (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const method = (config.method || 'get').toUpperCase();
    if (!config.headers[CSRF_HEADER] && method !== 'GET' && method !== 'HEAD') {
      const csrf = await ensureCsrfToken();
      if (csrf) {
        config.headers[CSRF_HEADER] = csrf;
      }
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
    if (status === 403) {
      csrfToken = null;
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
