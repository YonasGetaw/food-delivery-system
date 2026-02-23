import { useState, useEffect } from 'react';
import { vendorsAPI } from '../../api/vendors';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import { Package, DollarSign, Clock, Power } from 'lucide-react';
import toast from 'react-hot-toast';

const VendorHome = () => {
  const [vendor, setVendor] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [vendorRes, ordersRes] = await Promise.all([
        vendorsAPI.getProfile(),
        vendorsAPI.getOrders('', 1, 5),
      ]);
      setVendor(vendorRes.data || vendorRes);
      setRecentOrders(ordersRes.data || ordersRes || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    setToggling(true);
    try {
      const response = await vendorsAPI.toggleStatus();
      setVendor({ ...vendor, is_open: response.data || response });
      toast.success(`Vendor is now ${vendor?.is_open ? 'closed' : 'open'}`);
    } catch (error) {
      toast.error(error.error || 'Failed to toggle status');
    } finally {
      setToggling(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-br from-pink-50 to-white dark:from-gray-900 dark:to-gray-950 border border-pink-100 dark:border-gray-800 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Vendor Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Overview and recent activity</p>
        </div>
        <Button
          variant={vendor?.is_open ? 'danger' : 'success'}
          onClick={handleToggleStatus}
          loading={toggling}
          className="flex items-center"
        >
          <Power className="w-4 h-4 mr-2" />
          {vendor?.is_open ? 'Close Shop' : 'Open Shop'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{vendor?.total_orders || 0}</p>
            </div>
            <Package className="w-12 h-12 text-pink-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                ${vendor?.total_revenue?.toFixed(2) || '0.00'}
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-pink-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Current Balance</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                ${vendor?.current_balance?.toFixed(2) || '0.00'}
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-pink-600" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-300">No recent orders</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Order #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.order_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          order.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : order.status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-pink-100 text-pink-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${order.total_amount?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorHome;