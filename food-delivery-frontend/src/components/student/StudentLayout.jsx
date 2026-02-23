import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';
import { ShoppingCart, User, Package, Store } from 'lucide-react';

const StudentLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/student" className="flex items-center px-2 py-2 text-xl font-bold text-blue-600">
                FoodDelivery
              </Link>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/student"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
                >
                  <Store className="w-4 h-4 mr-1" />
                  Vendors
                </Link>
                <Link
                  to="/student/orders"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
                >
                  <Package className="w-4 h-4 mr-1" />
                  My Orders
                </Link>
                <Link
                  to="/student/cart"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
                >
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  Cart
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/student/profile"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                <User className="w-4 h-4 mr-1" />
                {user?.firstName} {user?.lastName}
              </Link>
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
};

export default StudentLayout;