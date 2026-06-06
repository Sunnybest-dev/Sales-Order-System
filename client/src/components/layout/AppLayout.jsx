import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import useAuthStore from '../../store/authStore';
import { notificationsAPI } from '../../api/services';
import { formatDateTime } from '../../utils/helpers';

function Topbar({ onMenuClick }) {
  const { user } = useAuthStore();
  const [notifs, setNotifs] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const unread = notifs.filter(n => !n.is_read).length;

  useEffect(() => {
    notificationsAPI.getAll().then(r => setNotifs(r.data.data)).catch(() => {});
    const interval = setInterval(() => {
      notificationsAPI.getAll().then(r => setNotifs(r.data.data)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAllRead = async () => {
    await notificationsAPI.markAllRead();
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600">☰</button>
      <div className="hidden lg:block" />

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <button onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600 text-xl">
            🔔
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          {showNotifs && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <span className="font-semibold text-sm">Notifications</span>
                {unread > 0 && <button onClick={markAllRead} className="text-xs text-primary-600 hover:underline">Mark all read</button>}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifs.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-8">No notifications</p>
                ) : notifs.map(n => (
                  <div key={n.id} className={`px-4 py-3 border-b border-gray-50 ${!n.is_read ? 'bg-blue-50' : ''}`}>
                    <p className="text-sm font-medium text-gray-800">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.created_at)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm">
          {user?.name?.[0]?.toUpperCase()}
        </div>
      </div>
    </header>
  );
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, fetchProfile } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchProfile();
  }, [isAuthenticated]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col lg:ml-64 min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
