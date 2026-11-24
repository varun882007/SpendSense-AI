import api from './api';

export const aiService = {
  chat: (message) => api.post('/assistant/chat', { message }),
  getPredictions: () => api.get('/analytics/predictions'),
  getAnomalies: () => api.get('/analytics/anomalies'),
  getHealthScore: () => api.get('/financial-health/score'),
  getExchangeRates: () => api.get('/currency/rates'),
};
