import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);

  // Check if first-time setup is required
  const checkSetupStatus = async () => {
    try {
      const res = await fetch('/api/auth/setup-check');
      const data = await res.json();
      setSetupRequired(data.setupRequired);
    } catch (err) {
      console.error('Error checking setup status:', err);
    }
  };

  // Verify stored JWT and fetch user info
  const checkAuthToken = async (savedToken) => {
    if (!savedToken) {
      setLoading(false);
      return;
    }

    try {
      // We can use a request to employees/me or check validity.
      // Wait, we can fetch all details by logging in, but since we already have token, we can get user info.
      // Let's decode or simply query an auth endpoint. Since we don't have a "/me" route, we can write a quick endpoint,
      // or we can store user profile in localStorage. 
      // Let's store user profile in localStorage and verify validity by checking endpoints when loading.
      // Wait, it is safer to save user details to localStorage as well, but when an API fails with 401, we logout.
      // Let's load the user profile from localStorage and check setup status too.
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (err) {
      console.error('Failed to load user details', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      await checkSetupStatus();
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        await checkAuthToken(storedToken);
      } else {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        _id: data._id,
        username: data.username,
        role: data.role,
        employee: data.employee
      }));

      setToken(data.token);
      setUser({
        _id: data._id,
        username: data.username,
        role: data.role,
        employee: data.employee
      });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const setupAdmin = async (username, password) => {
    try {
      const res = await fetch('/api/auth/setup-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Setup failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        _id: data._id,
        username: data.username,
        role: data.role,
        employee: null
      }));

      setToken(data.token);
      setUser({
        _id: data._id,
        username: data.username,
        role: data.role,
        employee: null
      });
      setSetupRequired(false);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
  };

  const refreshUser = (updatedEmployee) => {
    if (user && user.employee && user.employee._id === updatedEmployee._id) {
      const updatedUser = { ...user, employee: updatedEmployee };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      setupRequired,
      login,
      logout,
      setupAdmin,
      checkSetupStatus,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
