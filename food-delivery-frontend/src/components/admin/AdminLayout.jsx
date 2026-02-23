import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';
import Input from '../common/Input';
import toast from 'react-hot-toast';
import { Shield, Users, Store, Bike, Package, BarChart2, Bell, Sun, Moon, ChevronDown, KeyRound, UserCircle, LogOut } from 'lucide-react';
import { getAssetUrl } from '../../utils/helpers';

const AdminLayout = ({ children }) => {
  const { user, logout, changePassword } = useAuth();
  const navigate = useNavigate();

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

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
    { to: '/admin', icon: Shield, label: 'Dashboard' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/vendors', icon: Store, label: 'Vendors' },
    { to: '/admin/riders', icon: Bike, label: 'Riders' },
    { to: '/admin/orders', icon: Package, label: 'Orders' },
    { to: '/admin/reports', icon: BarChart2, label: 'Reports' },
    { to: '/admin/profile', icon: UserCircle, label: 'Profile' },
  ];

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleSubmitChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }
    try {
      await changePassword(passwordForm.oldPassword, passwordForm.newPassword);
      setChangePasswordOpen(false);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      // toast handled in context
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gray-50 dark:bg-gray-950 flex">
      <aside className="w-64 h-screen shrink-0 bg-white dark:bg-gray-900 shadow-md">
        <div className="p-6">
          <Link to="/admin" className="flex items-center text-xl font-bold text-[#db2777]">
            <Shield className="w-6 h-6 mr-2" />
            Admin Panel
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
      </aside>
      <main className="flex-1 h-screen overflow-y-auto">
        <header className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b dark:border-gray-800">
          <div className="px-6 py-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => toast.success('No new notifications')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-700 dark:text-gray-200" />
            </button>

            <button
              type="button"
              onClick={handleToggleTheme}
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
                <div className="w-8 h-8 rounded-full bg-[#db2777] text-white flex items-center justify-center font-semibold overflow-hidden">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span>{initial}</span>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{displayName || user?.email}</span>
                <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-800 shadow-lg overflow-hidden">
                  <Link
                    to="/admin/profile"
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

				  <button
					type="button"
					onClick={async () => {
					  setProfileMenuOpen(false);
					  await handleLogout();
					}}
					className="w-full text-left flex items-center gap-2 px-4 py-3 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
				  >
					<LogOut className="w-4 h-4" />
					Logout
				  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-6">{children}</div>
      </main>

      {changePasswordOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full border dark:border-gray-800">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Change Password</h3>
            <form onSubmit={handleSubmitChangePassword} className="space-y-3">
              <Input
                label="Current Password"
                type="password"
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                required
              />
              <Input
                label="New Password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setChangePasswordOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Update
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;