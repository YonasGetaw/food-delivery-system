import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/auth';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const normalizeUser = (raw) => {
    if (!raw) return null;
    return {
      id: raw.id ?? raw.user_id,
      email: raw.email,
      phone: raw.phone,
      role: raw.role,
      firstName: raw.firstName ?? raw.first_name,
      lastName: raw.lastName ?? raw.last_name,
      profileImageUrl: raw.profileImageUrl ?? raw.profile_image_url,
    };
  };

  useEffect(() => {
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadUser = async () => {
    try {
      const response = await authAPI.getMe();
      const normalized = normalizeUser(response.data || response);
      setUser(normalized);
      localStorage.setItem('user', JSON.stringify(normalized));
    } catch (error) {
      console.error('Failed to load user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

// ... existing code ...

const login = async (phone, password) => {
  try {
    const response = await authAPI.login({ phone, password });
    const authData = response.data || response;
    
    setToken(authData.token);
    const normalized = normalizeUser({
      id: authData.user_id,
      email: authData.email,
      phone: authData.phone,
      first_name: authData.first_name,
      last_name: authData.last_name,
      role: authData.role,
      profile_image_url: authData.profile_image_url,
    });
    setUser(normalized);
    
    localStorage.setItem('token', authData.token);
    localStorage.setItem('user', JSON.stringify(normalized));
    
    toast.success('Login successful!');
    return authData;
  } catch (error) {
    toast.error(error.error || error.message || 'Login failed');
    throw error;
  }
};

const register = async (userData) => {
  try {
    const response = await authAPI.register(userData);
    const authData = response.data || response;
    
    setToken(authData.token);
    const normalized = normalizeUser({
      id: authData.user_id,
      email: authData.email,
      phone: authData.phone,
      first_name: authData.first_name,
      last_name: authData.last_name,
      role: authData.role,
      profile_image_url: authData.profile_image_url,
    });
    setUser(normalized);
    
    localStorage.setItem('token', authData.token);
    localStorage.setItem('user', JSON.stringify(normalized));
    
    toast.success('Registration successful!');
    return authData;
  } catch (error) {
    toast.error(error.error || error.message || 'Registration failed');
    throw error;
  }
};

// ... rest of existing code ...

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.success('Logged out successfully');
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    try {
      await authAPI.changePassword({ old_password: oldPassword, new_password: newPassword });
      toast.success('Password changed successfully');
    } catch (error) {
      toast.error(error.error || error.message || 'Failed to change password');
      throw error;
    }
  };

  const updateUser = (patch) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...(patch || {}) };
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    changePassword,
    updateUser,
    isAuthenticated: !!token,
    isStudent: user?.role === 'student',
    isVendor: user?.role === 'vendor',
    isRider: user?.role === 'rider',
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};