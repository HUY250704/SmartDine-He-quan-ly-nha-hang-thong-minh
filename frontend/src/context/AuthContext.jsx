import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "@/lib/api.js";

const AuthContext = createContext(null);

const TOKEN_KEY = "smartdine_token";
const USER_KEY = "smartdine_user";

function getStoredAuth() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const userRaw = localStorage.getItem(USER_KEY);
    if (token && userRaw) {
      return { token, user: JSON.parse(userRaw) };
    }
  } catch {
    // corrupted storage
  }
  return { token: null, user: null };
}

function persistAuth(token, user) {
  if (token && user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredAuth().token);
  const [user, setUser] = useState(() => getStoredAuth().user);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredAuth();
    if (stored.token) {
      api
        .get("/auth/profile")
        .then((res) => {
          setToken(stored.token);
          setUser(res.data.user);
          persistAuth(stored.token, res.data.user);
        })
        .catch(() => {
          setToken(null);
          setUser(null);
          persistAuth(null, null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username, password) => {
    const res = await api.post("/auth/login", { username, password });
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    persistAuth(newToken, newUser);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    persistAuth(null, null);
  }, []);

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ token, user, loading, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
