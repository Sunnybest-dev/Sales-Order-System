import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard', roles: ['super_admin', 'manager', 'accountant', 'sales_staff'] },
  { to: '/orders', icon: '🛒', label: 'Sales Orders', roles: ['super_admin', 'manager', 'accountant', 'sales_staff'] },
  { to: '/invoices', icon: '🧾', label: 'Invoices', roles: ['super_admin', 'manager', 'accountant', 'sales_staff'] },
  { to: '/customers', icon: '👥', label: 'Customers', roles: ['super_admin', 'manager', 'accountant', 'sales_staff'] },
  { to: '/products', icon: '📦', label: 'Products', roles: ['super_admin', 'manager', 'accountant', 'sales_staff'] },
  { to: '/expenses', icon: '💸', label: 'Expenses', roles: ['super_admin', 'manager', 'accountant'] },
  { to: '/reports', icon: '📈', label: 'Reports', roles: ['super_admin', 'manager', 'accountant'] },
  { to: '/settings', icon: '⚙️', label: 'Settings', roles: ['super_admin', 'manager'] },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const allowed = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <>
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={onClose} />}

      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-30 flex flex-col transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">S</div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">SalesOrder</p>
            <p className="text-xs text-gray-400">Management System</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {allowed.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} onClick={onClose}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <span className="text-base">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
            <button onClick={handleLogout} title="Logout" className="text-gray-400 hover:text-red-500 transition-colors text-lg">⏻</button>
          </div>
        </div>
      </aside>
    </>
  );
}
