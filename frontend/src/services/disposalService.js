import api from './api';

export const disposalService = {
  getAll: async (params) => {
    const response = await api.get('/disposal', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/disposal/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/disposal', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/disposal/${id}`, data);
    return response.data;
  },

  approve: async (id) => {
    const response = await api.post(`/disposal/${id}/approve`);
    return response.data;
  },

  complete: async (id, data) => {
    const response = await api.post(`/disposal/${id}/complete`, data);
    return response.data;
  },

  cancel: async (id, data) => {
    const response = await api.post(`/disposal/${id}/cancel`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/disposal/${id}`);
    return response.data;
  },

  getStatistics: async () => {
    const response = await api.get('/disposal/statistics');
    return response.data;
  },

  getAvailableItems: async (search) => {
    const response = await api.get('/disposal/available-items', { 
      params: { search } 
    });
    return response.data;
  },
};

export default disposalService;
