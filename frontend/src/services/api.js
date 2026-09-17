import axios from 'axios';
import toast from 'react-hot-toast';

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.API_URL;

  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
  }

  return 'https://compassion-api.onrender.com/api';
};

const API_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const message = error.response.data?.message || 'Something went wrong';
      toast.error(message);
      
      // Handle unauthorized
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  activatePremium: (plan) => api.post('/auth/premium', { plan }),
};

export const adminService = {
  getUsers: () => api.get('/admin/users'),
  getMedia: () => api.get('/admin/media'),
  createUser: (data) => api.post('/admin/users', data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};

// Video Services
export const videoService = {
  create: (data) => api.post('/videos', data),
  getAll: (params) => api.get('/videos', { params }),
  getById: (id) => api.get(`/videos/${id}`),
  update: (id, data) => api.put(`/videos/${id}`, data),
  delete: (id) => api.delete(`/videos/${id}`),
};

// Firebase Storage media services
export const mediaService = {
  upload: (file, data = {}, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(data).forEach(([key, value]) => formData.append(key, value ?? ''));
    return api.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
  },
  getAll: () => api.get('/media'),
  getById: (id) => api.get(`/media/${id}`),
  update: (id, data) => api.put(`/media/${id}`, data),
  delete: (id) => api.delete(`/media/${id}`),
};

export const pageService = {
  getAll: (section) => api.get(`/pages/${section}`),
  create: (section, data) => api.post(`/pages/${section}`, data),
  update: (id, data) => api.put(`/pages/${id}`, data),
  delete: (id) => api.delete(`/pages/${id}`),
};

// Watch Services
export const watchService = {
  track: (data) => api.post('/watch/track', data),
  getHistory: () => api.get('/watch/history'),
  getEarnings: () => api.get('/watch/earnings'),
};

// Wallet Services
export const walletService = {
  get: () => api.get('/wallet'),
  updateDetails: (data) => api.put('/wallet/details', data),
  deposit: (data) => api.post('/wallet/deposit', data),
  withdraw: (data) => api.post('/wallet/withdraw', data),
};

export default api;