import { forwardRef } from 'react';

export function Button({ children, variant = 'primary', size = 'md', loading, className = '', ...props }) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    ghost: 'btn-ghost',
  };
  const sizes = { sm: 'text-xs px-3 py-1.5', md: '', lg: 'text-base px-6 py-3' };
  return (
    <button
      className={`btn ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}

export function Spinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <div
      className={`${sizes[size]} border-2 border-gray-200 border-t-primary-600 rounded-full animate-spin shrink-0`}
    />
  );
}

export const Input = forwardRef(function Input({ label, error, className = '', ...props }, ref) {
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <input
        ref={ref}
        className={`input ${error ? 'border-red-400 focus:ring-red-400' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
});

export const Select = forwardRef(function Select({ label, error, children, className = '', ...props }, ref) {
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <select
        ref={ref}
        className={`input ${error ? 'border-red-400' : ''} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea({ label, error, className = '', ...props }, ref) {
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <textarea
        ref={ref}
        className={`input resize-none ${error ? 'border-red-400' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
});

export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null;
  const sizes = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative bg-white w-full ${sizes[size]} sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[95vh] flex flex-col`}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b shrink-0">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 pr-4">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none shrink-0"
          >
            &times;
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function Badge({ status }) {
  const map = {
    pending: 'badge-yellow',
    confirmed: 'badge-blue',
    paid: 'badge-green',
    delivered: 'badge-green',
    cancelled: 'badge-gray',
    draft: 'badge-yellow',
    sent: 'badge-blue',
    overdue: 'badge-red',
    active: 'badge-green',
    inactive: 'badge-gray',
  };
  return <span className={map[status] || 'badge-gray'}>{status}</span>;
}

export function Pagination({ meta, onPageChange }) {
  if (!meta || meta.pages <= 1) return null;

  const totalPages = meta.pages;
  const current = meta.page;

  const getPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = new Set([1, totalPages, current]);
    if (current > 1) pages.add(current - 1);
    if (current < totalPages) pages.add(current + 1);
    return Array.from(pages).sort((a, b) => a - b);
  };

  const pages = getPages();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t border-gray-100">
      <p className="text-xs sm:text-sm text-gray-500 order-2 sm:order-1">
        {(current - 1) * (meta.limit || 20) + 1}–{Math.min(current * (meta.limit || 20), meta.total)} of{' '}
        {meta.total}
      </p>
      <div className="flex gap-1 flex-wrap justify-center order-1 sm:order-2">
        <button
          onClick={() => onPageChange(current - 1)}
          disabled={current === 1}
          className="w-8 h-8 text-sm rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40"
        >
          ‹
        </button>
        {pages.map((p, i) => (
          <span key={p} className="flex items-center">
            {i > 0 && pages[i - 1] !== p - 1 && (
              <span className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">…</span>
            )}
            <button
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 text-sm rounded-lg ${
                p === current ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          </span>
        ))}
        <button
          onClick={() => onPageChange(current + 1)}
          disabled={current === totalPages}
          className="w-8 h-8 text-sm rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40"
        >
          ›
        </button>
      </div>
    </div>
  );
}

export function EmptyState({ icon = '📭', title = 'No data found', description = '' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
      <div className="text-5xl mb-3">{icon}</div>
      <h3 className="text-base font-semibold text-gray-700">{title}</h3>
      {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
    </div>
  );
}

export function KPICard({ title, value, icon, color = 'blue', subtitle }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-gray-500 font-medium truncate">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 truncate">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>}
        </div>
        <div
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg sm:text-xl shrink-0 ${colors[color]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4 sm:mb-6">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-gray-600 mb-6 text-sm">{message}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>
          Confirm
        </Button>
      </div>
    </Modal>
  );
}
