// Button
export function Button({ children, variant = 'primary', size = 'md', loading, className = '', ...props }) {
  const variants = {
    primary: 'btn-primary', secondary: 'btn-secondary',
    danger: 'btn-danger', ghost: 'btn-ghost',
  };
  const sizes = { sm: 'text-xs px-3 py-1.5', md: '', lg: 'text-base px-6 py-3' };
  return (
    <button className={`btn ${variants[variant]} ${sizes[size]} ${className}`} disabled={loading} {...props}>
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}

// Spinner
export function Spinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <div className={`${sizes[size]} border-2 border-gray-200 border-t-primary-600 rounded-full animate-spin`} />
  );
}

// Input
export function Input({ label, error, className = '', ...props }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <input className={`input ${error ? 'border-red-400 focus:ring-red-400' : ''} ${className}`} {...props} />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// Select
export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <select className={`input ${error ? 'border-red-400' : ''} ${className}`} {...props}>
        {children}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// Textarea
export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <textarea className={`input resize-none ${error ? 'border-red-400' : ''} ${className}`} {...props} />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// Modal
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// Badge
export function Badge({ status }) {
  const map = {
    pending: 'badge-yellow', confirmed: 'badge-blue', paid: 'badge-green',
    delivered: 'badge-green', cancelled: 'badge-gray', draft: 'badge-yellow',
    sent: 'badge-blue', overdue: 'badge-red', active: 'badge-green', inactive: 'badge-gray',
  };
  return <span className={map[status] || 'badge-gray'}>{status}</span>;
}

// Pagination
export function Pagination({ meta, onPageChange }) {
  if (!meta || meta.pages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
      <p className="text-sm text-gray-500">
        Showing {((meta.page - 1) * meta.limit) + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
      </p>
      <div className="flex gap-1">
        {Array.from({ length: meta.pages }, (_, i) => i + 1).map((p) => (
          <button key={p} onClick={() => onPageChange(p)}
            className={`w-8 h-8 text-sm rounded-lg ${p === meta.page ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

// EmptyState
export function EmptyState({ icon = '📭', title = 'No data found', description = '' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
    </div>
  );
}

// KPI Card
export function KPICard({ title, value, icon, color = 'blue', change, subtitle }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600', green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600', red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          {change !== undefined && (
            <p className={`text-xs mt-1 font-medium ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% vs last month
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${colors[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// PageHeader
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

// LoadingPage
export function LoadingPage() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  );
}

// ConfirmDialog
export function ConfirmDialog({ open, onClose, onConfirm, title, message, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>Confirm</Button>
      </div>
    </Modal>
  );
}
