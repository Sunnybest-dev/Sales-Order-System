export const formatCurrency = (amount, currency = '₦') =>
  `${currency}${parseFloat(amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const formatDateTime = (date) =>
  date ? new Date(date).toLocaleString('en-NG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export const statusColors = {
  pending: 'badge-yellow',
  confirmed: 'badge-blue',
  paid: 'badge-green',
  delivered: 'badge-green',
  cancelled: 'badge-gray',
  draft: 'badge-yellow',
  sent: 'badge-blue',
  overdue: 'badge-red',
};

export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  MANAGER: 'manager',
  ACCOUNTANT: 'accountant',
  SALES_STAFF: 'sales_staff',
};

export const canAccess = (userRole, allowedRoles) => allowedRoles.includes(userRole);
