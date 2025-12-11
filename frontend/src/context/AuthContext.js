import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import api, { setAuthToken } from '../services/api.service';
import { parseApiError } from '../utils/error';
import { loadFromStorage, persistToStorage } from '../utils/storage';

const AuthContext = createContext();

const AUTH_USER_KEY = 'auth_user';
const AUTH_TOKEN_KEY = 'auth_token';

const parseStoredValue = (storageKey, persistent) =>
  loadFromStorage(storageKey, { persistent, fallback: false });

const getInitialAuth = () => {
  const localToken = parseStoredValue(AUTH_TOKEN_KEY, true);
  const sessionToken = parseStoredValue(AUTH_TOKEN_KEY, false);
  const persistent = Boolean(localToken) || (!localToken && !sessionToken);
  const token = localToken ?? sessionToken ?? null;
  const userFromPrimary = parseStoredValue(AUTH_USER_KEY, persistent);
  const userFallback = parseStoredValue(AUTH_USER_KEY, !persistent);

  return {
    token,
    user: userFromPrimary ?? userFallback ?? null,
    remember: persistent,
  };
};

export function AuthProvider({ children }) {
  const { token: initialToken, user: initialUser, remember: initialRemember } = getInitialAuth();
  const [remember, setRemember] = useState(initialRemember);
  const [user, setUser] = useState(initialUser);
  const [token, setToken] = useState(initialToken);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      setAuthToken(token);
    }
  }, [token]);

  const handleAuthSuccess = (payload, options = {}) => {
    const { persistent = true } = options;
    const { user: userPayload, token: accessToken } = payload || {};
    if (!accessToken) return;

    persistToStorage(AUTH_USER_KEY, userPayload || {}, { persistent });
    persistToStorage(AUTH_TOKEN_KEY, accessToken, { persistent });
    setUser(userPayload || {});
    setToken(accessToken);
    setRemember(persistent);
    setAuthToken(accessToken);
  };

  const login = async (credentials) => {
    const { rememberMe = true, ...payload } = credentials || {};
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', payload);
      handleAuthSuccess(data, { persistent: rememberMe });
      return data;
    } catch (error) {
      throw new Error(parseApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    const { rememberMe = true, ...body } = payload || {};
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', body);
      handleAuthSuccess(data, { persistent: rememberMe });
      return data;
    } catch (error) {
      throw new Error(parseApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Logout request failed, clearing local session', error);
    } finally {
      setUser(null);
      setToken(null);
      setAuthToken(null);
      persistToStorage(AUTH_USER_KEY, null);
      persistToStorage(AUTH_TOKEN_KEY, null);
    }
  };

  const value = useMemo(
    () => ({
      user,
      token,
      remember,
      loading,
      isAuthenticated: Boolean(token),
      login,
      logout,
      register,
      setUser,
      setRemember,
    }),
    [user, token, remember, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => useContext(AuthContext);
