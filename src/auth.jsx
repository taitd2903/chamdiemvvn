import { createContext, useContext, useEffect, useState } from 'react';
import { api, authStorage } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(authStorage.getToken()));

  useEffect(() => {
    if (!authStorage.getToken()) return;
    api.me().then(setUser).catch(() => authStorage.clear()).finally(() => setLoading(false));
  }, []);

  async function login(username, password) {
    const data = await api.login({ username, password });
    authStorage.setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    try { await api.logout(); } catch { /* Xóa phiên cục bộ ngay cả khi backend không phản hồi. */ }
    authStorage.clear();
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
