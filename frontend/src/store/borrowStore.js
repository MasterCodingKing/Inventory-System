import { create } from 'zustand';

export const useBorrowStore = create((set, get) => ({
  records: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {
    status: '',
    search: '',
    startDate: '',
    endDate: '',
  },
  statistics: null,
  overdueItems: [],
  upcomingReturns: [],

  setRecords: (records) => set({ records }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
  
  setPagination: (pagination) => set({ pagination }),
  
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),
  
  resetFilters: () => set({
    filters: {
      status: '',
      search: '',
      startDate: '',
      endDate: '',
    }
  }),

  setStatistics: (statistics) => set({ statistics }),
  
  setOverdueItems: (overdueItems) => set({ overdueItems }),
  
  setUpcomingReturns: (upcomingReturns) => set({ upcomingReturns }),

  addRecord: (record) => set((state) => ({
    records: [record, ...state.records],
  })),

  updateRecord: (id, updatedRecord) => set((state) => ({
    records: state.records.map((record) =>
      record.id === id ? { ...record, ...updatedRecord } : record
    ),
  })),

  removeRecord: (id) => set((state) => ({
    records: state.records.filter((record) => record.id !== id),
  })),
}));
