import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import api, { setAuthToken } from '../services/api.service';
import { parseApiError } from '../utils/error';
import { loadFromStorage, persistToStorage } from '../utils/storage';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loadFromStorage('auth_user'));
  const [token, setToken] = useState(() => loadFromStorage('auth_token'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      setAuthToken(token);
    }
  }, [token]);

  const handleAuthSuccess = (payload) => {
    const { user: userPayload, token: accessToken } = payload || {};
    if (!accessToken) return;

    persistToStorage('auth_user', userPayload || {});
    persistToStorage('auth_token', accessToken);
    setUser(userPayload || {});
    setToken(accessToken);
    setAuthToken(accessToken);
  };

  const login = async (credentials) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', credentials);
      handleAuthSuccess(data);
      return data;
    } catch (error) {
      throw new Error(parseApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', payload);
      handleAuthSuccess(data);
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
      persistToStorage('auth_user', null);
      persistToStorage('auth_token', null);
    }
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token),
      login,
      logout,
      register,
      setUser,
    }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => useContext(AuthContext);
