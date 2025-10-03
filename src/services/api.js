import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
};

export const groupAPI = {
  getGroups: () => api.get('/groups'),
  createGroup: (groupData) => api.post('/groups', groupData),
  getGroupById: (id) => api.get(`/groups/${id}`),
  updateGroup: (id, groupData) => api.put(`/groups/${id}`, groupData),
  deleteGroup: (id) => api.delete(`/groups/${id}`),
  getGroupMembers: (groupId) => api.get(`/groups/${groupId}/members`),
  addExpense: (groupId, payload) => api.post(`/groups/${groupId}/expenses`, payload),
  searchUsers: (query) => api.get(`/groups/search/users`, { params: { q: query } }),
};

export const dashboardAPI = {
  getDashboardData: () => api.get('/dashboard'),
  getSummary: () => api.get('/dashboard/summary'),
  getRecentActivities: () => api.get('/dashboard/activities'),
  getUserGroups: () => api.get('/dashboard/groups'),
};

export default api; 