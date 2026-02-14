import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

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
};

export const scheduleAPI = {
  getAll: () => api.get('/schedules'),
  getOne: (id) => api.get(`/schedules/${id}`),
  create: (data) => api.post('/schedules', data),
  update: (id, data) => api.put(`/schedules/${id}`, data),
  delete: (id) => api.delete(`/schedules/${id}`),
};

export const playerAPI = {
  register: (data) => api.post('/player/register', data),
  getContent: (code) => api.get(`/player/${code}/content`),
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

export default api;
