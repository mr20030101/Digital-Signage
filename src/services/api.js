import axios from 'axios';

// Dynamic API URL configuration
const getApiUrl = () => {
  // Check for environment variable first
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Default to localhost for development
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  
  // If running on localhost/127.0.0.1, use port 8000
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//localhost:8000/api`;
  }
  
  // Otherwise assume API is on same host
  return `${protocol}//${hostname}/api`;
};

const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log('API Base URL:', api.defaults.baseURL);

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const displayAPI = {
  getAll: () => api.get('/displays'),
  getOne: (id) => api.get(`/displays/${id}`),
  create: (data) => api.post('/displays', data),
  update: (id, data) => api.put(`/displays/${id}`, data),
  delete: (id) => api.delete(`/displays/${id}`),
  regenerateToken: (code) => api.post(`/player/${code}/regenerate-token`),
};

export const contentAPI = {
  getAll: () => api.get('/contents'),
  getOne: (id) => api.get(`/contents/${id}`),
  create: (data) => {
    const config = data instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : {};
    return api.post('/contents', data, config);
  },
  update: (id, data) => api.put(`/contents/${id}`, data),
  delete: (id) => api.delete(`/contents/${id}`),
};

export const playlistAPI = {
  getAll: () => api.get('/playlists'),
  getOne: (id) => api.get(`/playlists/${id}`),
  create: (data) => api.post('/playlists', data),
  update: (id, data) => api.put(`/playlists/${id}`, data),
  delete: (id) => api.delete(`/playlists/${id}`),
  addContent: (id, contentId, order) => api.post(`/playlists/${id}/contents`, { content_id: contentId, order }),
  removeContent: (playlistId, contentId) => api.delete(`/playlists/${playlistId}/contents/${contentId}`),
  reorderContents: (id, contents) => api.put(`/playlists/${id}/contents/reorder`, { contents }),
};

export const scheduleAPI = {
  getAll: () => api.get('/schedules'),
  getOne: (id) => api.get(`/schedules/${id}`),
  create: (data) => api.post('/schedules', data),
  update: (id, data) => api.put(`/schedules/${id}`, data),
  delete: (id) => api.delete(`/schedules/${id}`),
};

export const playerAPI = {
  register: (data, token) => {
    const config = token ? {
      headers: { Authorization: `Bearer ${token}` }
    } : {};
    return api.post('/player/register', data, config);
  },
  getContent: (code, token) => {
    const config = token ? {
      headers: { Authorization: `Bearer ${token}` }
    } : {};
    return api.get(`/player/${code}/content`, config);
  },
};

export const layoutAPI = {
  getAll: () => api.get('/layouts'),
  getOne: (id) => api.get(`/layouts/${id}`),
  create: (data) => api.post('/layouts', data),
  update: (id, data) => api.put(`/layouts/${id}`, data),
  delete: (id) => api.delete(`/layouts/${id}`),
};

export const regionAPI = {
  getAll: () => api.get('/regions'),
  getOne: (id) => api.get(`/regions/${id}`),
  create: (data) => api.post('/regions', data),
  update: (id, data) => api.put(`/regions/${id}`, data),
  delete: (id) => api.delete(`/regions/${id}`),
};

export const settingsAPI = {
  getAll: () => api.get('/settings'),
  regeneratePlayerToken: () => api.post('/settings/regenerate-player-token'),
};

export default api;
