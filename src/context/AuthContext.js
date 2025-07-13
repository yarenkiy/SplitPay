import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useEffect, useState } from 'react';
import { authAPI } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) setUserToken(token);
      } catch (error) {
        console.error('Error loading token:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadToken();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      const { token } = response.data;
      await AsyncStorage.setItem('userToken', token);
      setUserToken(token);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { token } = response.data;
      await AsyncStorage.setItem('userToken', token);
      setUserToken(token);
      return { success: true };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: error.response?.data?.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await AsyncStorage.removeItem('userToken');
      setUserToken(null);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      userToken, 
      setUserToken, 
      isLoading,
      login, 
      register, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
