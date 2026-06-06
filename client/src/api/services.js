import api from './client';

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export const customersAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getOne: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  getTransactions: (id, params) => api.get(`/customers/${id}/transactions`, { params }),
  getAnalytics: (id) => api.get(`/customers/${id}/analytics`),
};

export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getOne: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  adjustStock: (id, data) => api.post(`/products/${id}/adjust-stock`, data),
  getLowStock: () => api.get('/products/low-stock'),
  getCategories: () => api.get('/categories'),
  createCategory: (data) => api.post('/categories', data),
};

export const ordersAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getOne: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  cancel: (id) => api.post(`/orders/${id}/cancel`),
};

export const invoicesAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  getOne: (id) => api.get(`/invoices/${id}`),
  download: (id) => api.get(`/invoices/${id}/download`, { responseType: 'blob' }),
  email: (id) => api.post(`/invoices/${id}/email`),
  markPaid: (id) => api.patch(`/invoices/${id}/mark-paid`),
};

export const reportsAPI = {
  getSales: (params) => api.get('/reports/sales', { params }),
  getInventory: () => api.get('/reports/inventory'),
  getProfitLoss: (params) => api.get('/reports/profit-loss', { params }),
};

export const expensesAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
};

export const usersAPI = {
  getAll: () => api.get('/users'),
  update: (id, data) => api.put(`/users/${id}`, data),
  deactivate: (id) => api.delete(`/users/${id}`),
  register: (data) => api.post('/auth/register', data),
};

export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export const auditAPI = {
  getAll: (params) => api.get('/audit-logs', { params }),
};
