import api from './api';

export const borrowService = {
  getAll: async (params) => {
    const response = await api.get('/borrow', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/borrow/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/borrow', data);
    return response.data;
  },

  processReturn: async (id, data) => {
    const response = await api.put(`/borrow/${id}/return`, data);
    return response.data;
  },

  extendBorrowPeriod: async (id, data) => {
    const response = await api.put(`/borrow/${id}/extend`, data);
    return response.data;
  },

  getOverdueItems: async () => {
    const response = await api.get('/borrow/overdue');
    return response.data;
  },

  getUpcomingReturns: async (days = 7) => {
    const response = await api.get('/borrow/upcoming', { params: { days } });
    return response.data;
  },

  getStatistics: async () => {
    const response = await api.get('/borrow/statistics');
    return response.data;
  },

  sendReminders: async (days = 3) => {
    const response = await api.post('/borrow/send-reminders', { days });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/borrow/${id}`);
    return response.data;
  },
};

export default borrowService;
