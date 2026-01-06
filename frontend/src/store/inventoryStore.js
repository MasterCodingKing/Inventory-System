import { create } from 'zustand';

export const useInventoryStore = create((set, get) => ({
  inventory: [],
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
    department: '',
    status: '',
    pcType: '',
  },
  statistics: null,

  setInventory: (inventory) => set({ inventory }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
  
  setPagination: (pagination) => set({ pagination }),
  
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),
  
  resetFilters: () => set({
    filters: {
      search: '',
      department: '',
      status: '',
      pcType: '',
    }
  }),

  setStatistics: (statistics) => set({ statistics }),

  addItem: (item) => set((state) => ({
    inventory: [item, ...state.inventory],
  })),

  updateItem: (id, updatedItem) => set((state) => ({
    inventory: state.inventory.map((item) =>
      item.id === id ? { ...item, ...updatedItem } : item
    ),
  })),

  removeItem: (id) => set((state) => ({
    inventory: state.inventory.filter((item) => item.id !== id),
  })),
}));
