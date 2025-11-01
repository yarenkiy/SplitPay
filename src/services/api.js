import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Production backend URL (Railway)
const PRODUCTION_API_URL = 'https://splitpay-production.up.railway.app/api';

// Local development URL
const DEV_API_URL = 'http://192.168.1.100:3001/api';

// Use production URL by default, dev URL only in development mode
const API_BASE_URL = __DEV__ ? DEV_API_URL : PRODUCTION_API_URL;

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

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // If we get a 401 Unauthorized error, the token might be expired
    if (error.response?.status === 401) {
      // Only clear storage if we actually had a token
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        console.log('Token expired or invalid, logging out...');
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userData');
        // The AuthContext will automatically redirect to login
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyResetCode: (email, verificationCode) => api.post('/auth/verify-reset-code', { email, verificationCode }),
  resetPassword: (email, newPassword) => api.post('/auth/reset-password', { email, newPassword }),
  changePassword: (currentPassword, newPassword) => api.post('/auth/change-password', { currentPassword, newPassword }),
};

export const groupAPI = {
  getGroups: () => api.get('/groups'),
  createGroup: (groupData) => api.post('/groups', groupData),
  getGroupById: (id) => api.get(`/groups/${id}`),
  getGroupDetails: (groupId) => api.get(`/groups/${groupId}/details`),
  updateGroup: (id, groupData) => api.put(`/groups/${id}`, groupData),
  deleteGroup: (id) => api.delete(`/groups/${id}`),
  deleteExpense: (expenseId) => api.delete(`/groups/expenses/${expenseId}`),
  getGroupMembers: (groupId) => api.get(`/groups/${groupId}/members`),
  addExpense: (groupId, payload) => api.post(`/groups/${groupId}/expenses`, payload),
  searchUsers: (query) => api.get(`/groups/search/users`, { params: { q: query } }),
  joinGroupByCode: (inviteCode) => api.post('/groups/join', { inviteCode }),
};

export const dashboardAPI = {
  getDashboardData: () => api.get('/dashboard'),
  getSummary: () => api.get('/dashboard/summary'),
  getRecentActivities: () => api.get('/dashboard/activities'),
  getUserGroups: () => api.get('/dashboard/groups'),
};

export const notesAPI = {
  getGroupNotes: (groupId) => api.get(`/notes/group/${groupId}`),
  createNote: (groupId, text) => api.post(`/notes/group/${groupId}`, { text }),
  updateNote: (noteId, data) => api.put(`/notes/${noteId}`, data),
  deleteNote: (noteId) => api.delete(`/notes/${noteId}`),
  toggleNoteCompletion: (noteId) => api.patch(`/notes/${noteId}/toggle`),
};

export default api; 