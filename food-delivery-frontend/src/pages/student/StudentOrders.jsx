import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ordersAPI } from '../../api/orders';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ORDER_STATUS_LABELS } from '../../utils/constants';
import { Package, Eye } from 'lucide-react';
import { format } from 'date-fns';

const StudentOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadOrders();
  }, [page]);

  const loadOrders = async () => {
    try {
      const response = await ordersAPI.getStudentOrders(page, 10);
      const data = response.data || response;
      setOrders(Array.isArray(data) ? data : []);
      
      if (response.pagination) {
        setTotalPages(response.pagination.total_pages || 1);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      ready: 'bg-indigo-100 text-indigo-800',
      picked_up: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h2>
          <p className="text-gray-600">Start ordering to see your orders here!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order #{order.order_number}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    order.status
                  )}`}
                >
                  {ORDER_STATUS_LABELS[order.status] || order.status}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-gray-700">
                  <span className="font-medium">Vendor:</span> {order.vendor?.business_name}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Delivery Address:</span> {order.delivery_address}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Phone:</span> {order.customer_phone || order.student?.user?.phone || 'N/A'}
                </p>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-xl font-bold text-pink-600">
                    ${order.total_amount?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <Link
                  to={`/student/orders/${order.id}/track`}
                  className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Track Order
                </Link>
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex justify-center space-x-2 mt-6">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentOrders;