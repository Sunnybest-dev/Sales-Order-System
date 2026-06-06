const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');
const customerCtrl = require('../controllers/customerController');
const productCtrl = require('../controllers/productController');
const orderCtrl = require('../controllers/orderController');
const invoiceCtrl = require('../controllers/invoiceController');
const dashCtrl = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');

// Auth
router.post('/auth/login', [
  body('email').isEmail(), body('password').notEmpty(),
], validate, authCtrl.login);
router.post('/auth/register', authenticate, authorize('super_admin'), [
  body('name').notEmpty(), body('email').isEmail(), body('password').isLength({ min: 8 }),
  body('role').isIn(['super_admin', 'manager', 'accountant', 'sales_staff']),
], validate, authCtrl.register);
router.post('/auth/refresh', authCtrl.refreshToken);
router.post('/auth/logout', authenticate, authCtrl.logout);
router.post('/auth/forgot-password', authCtrl.forgotPassword);
router.post('/auth/reset-password', authCtrl.resetPassword);
router.get('/auth/profile', authenticate, authCtrl.getProfile);
router.put('/auth/profile', authenticate, authCtrl.updateProfile);

// Dashboard
router.get('/dashboard/stats', authenticate, dashCtrl.getDashboardStats);
router.get('/reports/sales', authenticate, dashCtrl.getSalesReport);
router.get('/reports/inventory', authenticate, dashCtrl.getInventoryReport);
router.get('/reports/profit-loss', authenticate, authorize('super_admin', 'manager', 'accountant'), dashCtrl.getProfitLossReport);

// Customers
router.get('/customers', authenticate, customerCtrl.getAll);
router.post('/customers', authenticate, authorize('super_admin', 'manager', 'sales_staff'), customerCtrl.create);
router.get('/customers/:id', authenticate, customerCtrl.getOne);
router.put('/customers/:id', authenticate, authorize('super_admin', 'manager', 'sales_staff'), customerCtrl.update);
router.delete('/customers/:id', authenticate, authorize('super_admin', 'manager'), customerCtrl.delete);
router.get('/customers/:id/transactions', authenticate, customerCtrl.getTransactionHistory);
router.get('/customers/:id/analytics', authenticate, customerCtrl.getAnalytics);

// Products
router.get('/products', authenticate, productCtrl.getAllProducts);
router.post('/products', authenticate, authorize('super_admin', 'manager'), productCtrl.createProduct);
router.get('/products/low-stock', authenticate, productCtrl.getLowStockProducts);
router.get('/products/:id', authenticate, productCtrl.getProduct);
router.put('/products/:id', authenticate, authorize('super_admin', 'manager'), productCtrl.updateProduct);
router.delete('/products/:id', authenticate, authorize('super_admin', 'manager'), productCtrl.deleteProduct);
router.post('/products/:id/adjust-stock', authenticate, authorize('super_admin', 'manager'), productCtrl.adjustStock);

// Categories
router.get('/categories', authenticate, productCtrl.getCategories);
router.post('/categories', authenticate, authorize('super_admin', 'manager'), productCtrl.createCategory);

// Orders
router.get('/orders', authenticate, orderCtrl.getOrders);
router.post('/orders', authenticate, orderCtrl.createOrder);
router.get('/orders/:id', authenticate, orderCtrl.getOrder);
router.patch('/orders/:id/status', authenticate, authorize('super_admin', 'manager', 'accountant'), orderCtrl.updateOrderStatus);
router.post('/orders/:id/cancel', authenticate, authorize('super_admin', 'manager'), orderCtrl.cancelOrder);

// Invoices
router.get('/invoices', authenticate, invoiceCtrl.getInvoices);
router.get('/invoices/:id', authenticate, invoiceCtrl.getInvoice);
router.get('/invoices/:id/download', authenticate, invoiceCtrl.downloadInvoice);
router.post('/invoices/:id/email', authenticate, invoiceCtrl.emailInvoice);
router.patch('/invoices/:id/mark-paid', authenticate, authorize('super_admin', 'manager', 'accountant'), invoiceCtrl.markAsPaid);

// Users (admin)
const userCtrl = require('../controllers/userController');
router.get('/users', authenticate, authorize('super_admin', 'manager'), userCtrl.getAll);
router.put('/users/:id', authenticate, authorize('super_admin'), userCtrl.update);
router.delete('/users/:id', authenticate, authorize('super_admin'), userCtrl.deactivate);

// Notifications
const notifCtrl = require('../controllers/notificationController');
router.get('/notifications', authenticate, notifCtrl.getAll);
router.patch('/notifications/:id/read', authenticate, notifCtrl.markRead);
router.patch('/notifications/read-all', authenticate, notifCtrl.markAllRead);

// Expenses
const expCtrl = require('../controllers/expenseController');
router.get('/expenses', authenticate, authorize('super_admin', 'manager', 'accountant'), expCtrl.getAll);
router.post('/expenses', authenticate, authorize('super_admin', 'manager', 'accountant'), expCtrl.create);
router.put('/expenses/:id', authenticate, authorize('super_admin', 'manager', 'accountant'), expCtrl.update);
router.delete('/expenses/:id', authenticate, authorize('super_admin', 'manager'), expCtrl.delete);

// Audit logs
router.get('/audit-logs', authenticate, authorize('super_admin'), require('../controllers/auditController').getAll);

module.exports = router;
