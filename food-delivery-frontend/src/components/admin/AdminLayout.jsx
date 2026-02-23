import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  Shield,
  Users,
  Store,
  Bike,
  ShoppingBag,
  Truck,
  LineChart,
  LayoutDashboard,
  Bell,
  Sun,
  Moon,
  Settings,
  UserCircle,
  DoorOpen,
  Menu,
} from 'lucide-react';
import { getAssetUrl } from '../../utils/helpers';

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  const displayName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
  const initial = (user?.firstName || user?.email || 'U').trim().charAt(0).toUpperCase();
  const avatarSrc = user?.profileImageUrl ? getAssetUrl(user.profileImageUrl) : '';

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/vendors', icon: Store, label: 'Vendors' },
    { to: '/admin/riders', icon: Bike, label: 'Riders' },
    { to: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
    { to: '/admin/reports', icon: LineChart, label: 'Reports' },
    { to: '/admin/profile', icon: UserCircle, label: 'Profile' },
  ];

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="h-screen overflow-hidden bg-pink-50 dark:bg-gray-950 flex flex-col">
      <header className="shrink-0 w-full z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b dark:border-gray-800 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-5">
            <Link to="/admin" className="flex items-center gap-3 select-none">
              <Truck className="w-9 h-9 text-[#db2777]" />
              <span className="text-2xl font-bold text-[#db2777]">Food Delivery</span>
            </Link>
            <button
              type="button"
              onClick={() => setSidebarCollapsed((v) => !v)}
              className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-7 h-7 text-pink-700 dark:text-gray-200" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => toast.success('No new notifications')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-[#db2777] dark:text-pink-400" />
            </button>

            <button
              type="button"
              onClick={handleToggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-[#db2777] dark:text-pink-400" />
              ) : (
                <Moon className="w-5 h-5 text-[#db2777] dark:text-pink-400" />
              )}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Profile menu"
              >
                <div className="w-8 h-8 rounded-full bg-[#db2777] text-white flex items-center justify-center font-semibold overflow-hidden">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span>{initial}</span>
                  )}
                </div>
                <span className="text-sm font-medium text-[#db2777] dark:text-pink-400">{displayName || user?.email}</span>
                <span
                  aria-hidden="true"
                  className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-[#db2777]"
                />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-800 shadow-lg overflow-hidden">
                  <Link
                    to="/admin/profile"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <Settings className="w-4 h-4 text-[#db2777]" />
                    Account Settings
                  </Link>
				  <button
					type="button"
					onClick={async () => {
					  setProfileMenuOpen(false);
					  await handleLogout();
					}}
					className="w-full text-left flex items-center gap-2 px-4 py-3 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
				  >
          <DoorOpen className="w-4 h-4 text-[#db2777]" />
          Sign Out
				  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`${sidebarCollapsed ? 'w-20' : 'w-64'} h-full shrink-0 bg-white dark:bg-gray-900 shadow-md transition-[width] duration-200`}
        >
          <nav className="pt-4">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                title={sidebarCollapsed ? item.label : undefined}
                className={`flex items-center text-[#db2777] dark:text-pink-400 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  sidebarCollapsed ? 'justify-center px-3 py-3' : 'px-6 py-3'
                }`}
              >
                <item.icon className={`w-5 h-5 ${sidebarCollapsed ? '' : 'mr-3'}`} />
                {!sidebarCollapsed && item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 h-full overflow-y-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>

    </div>
  );
};

export default AdminLayout;