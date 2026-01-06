import api from './api';

export const reportService = {
  getDashboard: async () => {
    const response = await api.get('/reports/dashboard');
    return response.data;
  },

  getInventoryReport: async (params) => {
    const response = await api.get('/reports/inventory', { params });
    return response.data;
  },

  getBorrowReport: async (params) => {
    const response = await api.get('/reports/borrow', { params });
    return response.data;
  },

  getDepartmentReport: async () => {
    const response = await api.get('/reports/department');
    return response.data;
  },

  getActivityReport: async (days = 30) => {
    const response = await api.get('/reports/activity', { params: { days } });
    return response.data;
  },

  // Export reports as CSV
  exportInventoryCSV: async (params) => {
    const response = await api.get('/reports/inventory', { 
      params: { ...params, format: 'csv' },
      responseType: 'blob'
    });
    return response;
  },

  exportBorrowCSV: async (params) => {
    const response = await api.get('/reports/borrow', { 
      params: { ...params, format: 'csv' },
      responseType: 'blob'
    });
    return response;
  },
};

export default reportService;
