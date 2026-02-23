import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';
import { Bike, Package, DollarSign, User } from 'lucide-react';

const RiderLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/rider', icon: Bike, label: 'Dashboard' },
    { to: '/rider/orders', icon: Package, label: 'Orders' },
    { to: '/rider/earnings', icon: DollarSign, label: 'Earnings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white shadow-md">
        <div className="p-6">
          <Link to="/rider" className="flex items-center text-xl font-bold text-blue-600">
            <Bike className="w-6 h-6 mr-2" />
            Rider Dashboard
          </Link>
        </div>
        <nav className="mt-4">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="flex items-center mb-4">
            <User className="w-5 h-5 mr-2 text-gray-600" />
            <span className="text-sm font-medium">{user?.firstName} {user?.lastName}</span>
          </div>
          <Button variant="secondary" size="sm" className="w-full" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};

export default RiderLayout;