import { createContext, useContext, useEffect, useState } from "react";

import * as api from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("vexor_token"));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("vexor_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("vexor_token");
    const savedUser = localStorage.getItem("vexor_user");
    setToken(savedToken);
    setUser(savedUser ? JSON.parse(savedUser) : null);
    setLoading(false);
  }, []);

  const persistAuth = (nextToken, nextUser) => {
    localStorage.setItem("vexor_token", nextToken);
    localStorage.setItem("vexor_user", JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  };

  const login = async (email, password) => {
    const { data } = await api.login(email, password);
    persistAuth(data.access_token, data.user);
    return data;
  };

  const register = async (email, password, company) => {
    const { data } = await api.register(email, password, company);
    persistAuth(data.access_token, data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("vexor_token");
    localStorage.removeItem("vexor_user");
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        loading,
        isAuthenticated: Boolean(token)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
