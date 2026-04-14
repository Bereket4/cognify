import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api/config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Fetch fresh profile to ensure all fields (like avatarUrl) are sync'd
      axios.get(`${API_BASE_URL}/users/profile.php`)
        .then(res => {
          if (res.data.status === 'success') {
            const freshUser = { ...parsedUser, ...res.data.data };
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
          }
        })
        .catch(() => {});
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let interval;
    if (user) {
      // Immediate pulse on login/restoration
      axios.post(`${API_BASE_URL}/users/heartbeat.php`).catch(() => {});
      
      // Periodic pulse every 2 minutes
      interval = setInterval(() => {
        axios.post(`${API_BASE_URL}/users/heartbeat.php`).catch(() => {});
      }, 120000);
    }
    return () => clearInterval(interval);
  }, [user]);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login.php`, { email, password });
      if (res.data.status === 'success') {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const register = async (name, email, password, role) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/register.php`, { name, email, password, role });
      return res.data.status === 'success';
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const updateUser = (newData) => {
    const updatedUser = { ...user, ...newData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
