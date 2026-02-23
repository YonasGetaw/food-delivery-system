import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';
import ChangePasswordModal from '../common/ChangePasswordModal';
import toast from 'react-hot-toast';
import { useWebSocket } from '../../hooks/useWebSocket';
import { notificationsAPI } from '../../api/notifications';
import { Store, Menu, Package, DollarSign, User, Bell, Sun, Moon, ChevronDown, UserCircle, KeyRound } from 'lucide-react';

const VendorLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { messages } = useWebSocket();

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationsRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/vendor', icon: Store, label: 'Dashboard' },
    { to: '/vendor/menu', icon: Menu, label: 'Menu' },
    { to: '/vendor/orders', icon: Package, label: 'Orders' },
    { to: '/vendor/earnings', icon: DollarSign, label: 'Earnings' },
  ];

  const normalizedNotifications = useMemo(() => {
    return (notifications || []).map((n) => {
      const ts = n?.timestamp ?? (n?.created_at ? Math.floor(new Date(n.created_at).getTime() / 1000) : null);
      return {
        id: n?.id ?? `${n?.type || 'notification'}-${ts || Date.now()}`,
        title: n?.title || 'Notification',
        message: n?.message || '',
        timestamp: ts,
        is_read: typeof n?.is_read === 'boolean' ? n.is_read : false,
      };
    });
  }, [notifications]);

  const effectiveUnreadCount = useMemo(() => {
    const localUnread = (normalizedNotifications || []).filter((n) => !n.is_read).length;
    return Math.max(unreadCount || 0, localUnread);
  }, [normalizedNotifications, unreadCount]);

  const formattedUnreadCount = effectiveUnreadCount > 99 ? '99+' : String(effectiveUnreadCount);

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationsAPI.unreadCount();
      const payload = res?.data || res;
      const count = typeof payload?.count === 'number' ? payload.count : 0;
      setUnreadCount(count);
    } catch {
      // best-effort
    }
  };

  const refreshNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const [listRes] = await Promise.all([notificationsAPI.list(20), fetchUnreadCount()]);
      const items = listRes?.data || listRes;
      setNotifications(Array.isArray(items) ? items : []);
    } catch (err) {
      toast.error(err?.error || err?.message || 'Failed to load notifications');
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    const last = messages?.[messages.length - 1];
    if (!last || !last.title || !last.message) return;

    setNotifications((prev) => {
      const existing = prev || [];
      if (typeof last?.id === 'number' && existing.some((n) => n?.id === last.id)) {
        return existing;
      }
      const next = [last, ...existing];
      return next.slice(0, 50);
    });

    setUnreadCount((c) => (typeof c === 'number' ? c + 1 : 1));
  }, [messages]);

  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (!notificationsOpen) return;
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [notificationsOpen]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <aside className="w-64 bg-white dark:bg-gray-900 shadow-md">
        <div className="p-6">
          <Link to="/vendor" className="flex items-center text-xl font-bold text-[#db2777]">
            <Store className="w-6 h-6 mr-2" />
            Vendor Panel
          </Link>
        </div>
        <nav className="mt-4">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center px-6 py-3 text-gray-700 dark:text-gray-200 hover:bg-[#fce7f3] dark:hover:bg-gray-800 hover:text-[#db2777]"
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t dark:border-gray-800">
          <div className="flex items-center mb-4">
            <User className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-300" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.firstName} {user?.lastName}</span>
          </div>
          <Button variant="secondary" size="sm" className="w-full" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b dark:border-gray-800">
          <div className="px-6 py-4 flex items-center justify-end gap-2">
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                onClick={async () => {
                  setProfileMenuOpen(false);
                  setNotificationsOpen((v) => !v);
                  if (!notificationsOpen) {
                    await refreshNotifications();
                  }
                }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-gray-700 dark:text-gray-200" />

                {effectiveUnreadCount > 0 ? (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#db2777] text-white text-[11px] font-semibold leading-[18px] text-center">
                    {formattedUnreadCount}
                  </span>
                ) : null}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-96 rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-800 shadow-xl overflow-hidden">
                  <div className="px-4 py-3 border-b dark:border-gray-800 flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</div>
                    {effectiveUnreadCount > 0 ? (
                      <div className="text-xs text-gray-500 dark:text-gray-400">{formattedUnreadCount} unread</div>
                    ) : null}
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notificationsLoading ? (
                      <div className="px-4 py-8 text-sm text-gray-600 dark:text-gray-300 text-center">Loading...</div>
                    ) : normalizedNotifications.length === 0 ? (
                      <div className="px-4 py-10 text-sm text-gray-600 dark:text-gray-300 text-center">No notifications</div>
                    ) : (
                      normalizedNotifications.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={async () => {
                            try {
                              if (typeof n.id === 'number') {
                                await notificationsAPI.markRead(n.id);
                              }
                            } finally {
                              setNotificationsOpen(false);
                              await refreshNotifications();
                            }
                          }}
                          className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none ${
                            !n.is_read ? 'bg-pink-50/60 dark:bg-gray-800/60' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-start gap-2">
                                {!n.is_read ? <span className="mt-1.5 w-2 h-2 rounded-full bg-[#db2777] shrink-0" /> : null}
                                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">{n.title}</div>
                              </div>
                            </div>
                            {n.timestamp ? (
                              <div className="shrink-0 text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                {new Date(n.timestamp * 1000).toLocaleString()}
                              </div>
                            ) : null}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-snug break-words">{n.message}</div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              )}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Profile menu"
              >
                <User className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.firstName} {user?.lastName}</span>
                <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-800 shadow-lg overflow-hidden">
                  <Link
                    to="/vendor/profile"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <UserCircle className="w-4 h-4" />
                    Profile
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      setChangePasswordOpen(true);
                    }}
                    className="w-full text-left flex items-center gap-2 px-4 py-3 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <KeyRound className="w-4 h-4" />
                    Change Password
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-6">{children}</div>
      </main>

      <ChangePasswordModal open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
    </div>
  );
};

export default VendorLayout;