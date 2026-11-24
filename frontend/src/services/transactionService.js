import api from './api';

export const transactionService = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
};

export const categoryService = {
  getAll: () => api.get('/categories'),
};

export const budgetService = {
  getAll: (params) => api.get('/budgets', { params }),
  create: (data) => api.post('/budgets', data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  delete: (id) => api.delete(`/budgets/${id}`),
};

export const savingsService = {
  getAll: () => api.get('/savings-goals'),
  create: (data) => api.post('/savings-goals', data),
  update: (id, data) => api.put(`/savings-goals/${id}`, data),
  delete: (id) => api.delete(`/savings-goals/${id}`),
};

export const analyticsService = {
  getSummary: () => api.get('/analytics/summary'),
  getCategories: (params) => api.get('/analytics/categories', { params }),
  getTrends: () => api.get('/analytics/trends'),
};

export const financialProfileService = {
  getProfile: () => api.get('/financial-profile/'),
  updateProfile: (data) => api.put('/financial-profile/', data),
  addFixedExpense: (data) => api.post('/financial-profile/fixed-expenses', data),
  updateFixedExpense: (id, data) => api.put(`/financial-profile/fixed-expenses/${id}`, data),
  deleteFixedExpense: (id) => api.delete(`/financial-profile/fixed-expenses/${id}`),
};
