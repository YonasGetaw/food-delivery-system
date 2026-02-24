import { useState, useEffect } from 'react';
import { vendorsAPI } from '../../api/vendors';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import { Power } from 'lucide-react';
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
      const payload = response?.data ?? response;
      const nextIsOpenRaw =
        typeof payload === 'boolean'
          ? payload
          : payload?.is_open ?? payload?.isOpen ?? payload?.open ?? payload;
      const nextIsOpen = Boolean(nextIsOpenRaw);

      setVendor((prev) => ({ ...(prev || {}), is_open: nextIsOpen }));
      toast.success(nextIsOpen ? 'Shop opened successfully.' : 'Shop closed successfully.');
    } catch (err) {
      toast.error(err?.error || err?.message || 'Unable to update shop status. Please try again.');
    } finally {
      setToggling(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
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

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-300">No recent orders</p>
        ) : (
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-none">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-blue-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 dark:text-gray-200 uppercase">
                    Order #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 dark:text-gray-200 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 dark:text-gray-200 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 dark:text-gray-200 uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      ${order.total_amount?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
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