import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import useAuthStore from '../../store/authStore';
import { notificationsAPI } from '../../api/services';
import { formatDateTime } from '../../utils/helpers';

function Topbar({ onMenuClick }) {
  const { user } = useAuthStore();
  const [notifs, setNotifs] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const unread = notifs.filter((n) => !n.is_read).length;

  const loadNotifs = () => {
    notificationsAPI.getAll().then((r) => setNotifs(r.data.data || [])).catch(() => {});
  };

  useEffect(() => {
    loadNotifs();
    const t = setInterval(loadNotifs, 60000);
    return () => clearInterval(t);
  }, []);

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-10">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 text-xl"
        aria-label="Open menu"
      >
        ☰
      </button>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative">
          <button
            onClick={() => setShowNotifs((v) => !v)}
            className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600 text-xl"
            aria-label="Notifications"
          >
            🔔
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center leading-none">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          {showNotifs && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
              <div className="absolute right-0 top-12 w-72 sm:w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <span className="font-semibold text-sm">Notifications</span>
                  {unread > 0 && (
                    <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifs.length === 0 ? (
                    <p className="text-center text-sm text-gray-400 py-8">No notifications</p>
                  ) : (
                    notifs.map((n) => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 border-b border-gray-50 ${!n.is_read ? 'bg-blue-50' : ''}`}
                      >
                        <p className="text-sm font-medium text-gray-800">{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.created_at)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm shrink-0">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
          {user?.name}
        </span>
      </div>
    </header>
  );
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col lg:ml-64 min-w-0 overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
