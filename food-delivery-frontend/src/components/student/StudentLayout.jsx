import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ChangePasswordModal from '../common/ChangePasswordModal';
import { useCart } from '../../hooks/useCart';
import {
  Store,
  Package,
  ShoppingCart,
  Settings,
  KeyRound,
  LogOut,
  Home,
} from 'lucide-react';

const StudentLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { itemCount } = useCart();

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = useMemo(
    () => [
      { to: '/student', icon: Home, label: 'Home' },
      { to: '/student/vendors', icon: Store, label: 'Vendors' },
      { to: '/student/orders', icon: Package, label: 'My Orders' },
      { to: '/student/cart', icon: ShoppingCart, label: 'Cart' },
    ],
    []
  );

  const displayName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
  const initial = (user?.firstName || user?.email || 'U').trim().charAt(0).toUpperCase();

  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (!profileMenuOpen) return;
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [profileMenuOpen]);

  return (
    <div className="min-h-screen bg-pink-50 dark:bg-gray-950">
      <header className="shrink-0 w-full z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-6">
            <Link to="/student" className="flex items-center gap-3 select-none">
              <Store className="w-8 h-8 text-pink-600 dark:text-pink-300" />
              <span className="text-xl font-bold text-pink-600 dark:text-pink-300">Student Panel</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const active = location.pathname === item.to;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${
                      active
                        ? 'bg-pink-100 text-pink-700 dark:bg-gray-800 dark:text-pink-200'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-pink-700 dark:text-gray-200 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {item.to === '/student/cart' && itemCount > 0 ? (
                      <span className="ml-1 min-w-[20px] h-5 px-1 rounded-full bg-pink-600 dark:bg-pink-500/80 text-white text-[12px] font-bold leading-5 text-center">
                        {itemCount > 99 ? '99+' : itemCount}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/student/cart"
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Cart"
              title="Cart"
            >
              <ShoppingCart className="w-5 h-5 text-pink-600 dark:text-pink-300" />
              {itemCount > 0 ? (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-pink-600 dark:bg-pink-500/80 text-white text-[11px] font-semibold leading-[18px] text-center">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              ) : null}
            </Link>

            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Profile menu"
              >
                <div className="w-8 h-8 rounded-full bg-pink-600 dark:bg-pink-500/80 text-white flex items-center justify-center font-semibold overflow-hidden">
                  <span>{initial}</span>
                </div>
                <span className="hidden sm:inline text-sm font-medium text-pink-600 dark:text-pink-300">
                  {displayName || user?.email}
                </span>
                <span
                  aria-hidden="true"
                  className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-pink-600 dark:border-t-pink-300"
                />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-800 shadow-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="text-sm font-semibold text-pink-600 dark:text-pink-300 text-center truncate">
                      {displayName || user?.email || 'Student'}
                    </div>
                  </div>

                  <Link
                    to="/student/profile"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <Settings className="w-4 h-4 text-pink-600 dark:text-pink-300" />
                    Account Settings
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      setChangePasswordOpen(true);
                    }}
                    className="w-full text-left flex items-center gap-2 px-4 py-3 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <KeyRound className="w-4 h-4 text-pink-600 dark:text-pink-300" />
                    Change Password
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      setProfileMenuOpen(false);
                      await handleLogout();
                    }}
                    className="w-full text-left flex items-center gap-2 px-4 py-3 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <LogOut className="w-4 h-4 text-pink-600 dark:text-pink-300" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">{children}</main>

      <ChangePasswordModal open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
    </div>
  );
};

export default StudentLayout;