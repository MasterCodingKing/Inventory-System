import { create } from 'zustand';

export const useDisposalStore = create((set, get) => ({
  disposals: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {
    search: '',
    status: '',
    disposalMethod: '',
    startDate: '',
    endDate: '',
  },
  statistics: null,

  setDisposals: (disposals) => set({ disposals }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
  
  setPagination: (pagination) => set({ pagination }),
  
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),
  
  resetFilters: () => set({
    filters: {
      search: '',
      status: '',
      disposalMethod: '',
      startDate: '',
      endDate: '',
    }
  }),

  setStatistics: (statistics) => set({ statistics }),

  addDisposal: (disposal) => set((state) => ({
    disposals: [disposal, ...state.disposals],
  })),

  updateDisposal: (id, updatedDisposal) => set((state) => ({
    disposals: state.disposals.map((item) =>
      item.id === id ? { ...item, ...updatedDisposal } : item
    ),
  })),

  removeDisposal: (id) => set((state) => ({
    disposals: state.disposals.filter((item) => item.id !== id),
  })),
}));
