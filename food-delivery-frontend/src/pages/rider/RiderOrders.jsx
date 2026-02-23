import { useState, useEffect } from 'react';
import { ridersAPI } from '../../api/riders';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import { ORDER_STATUS_LABELS } from '../../utils/constants';
import { Package, MapPin, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const RiderOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    try {
      const response = await ridersAPI.getAssignedOrders(statusFilter);
      setOrders(response.data || response || []);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handlePickUp = async (orderId) => {
    setActionLoading(true);
    try {
      await ridersAPI.pickUpOrder(orderId);
      toast.success('Order picked up');
      loadOrders();
    } catch (error) {
      toast.error(error.error || 'Failed to update');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliver = async (orderId) => {
    setActionLoading(true);
    try {
      await ridersAPI.deliverOrder(orderId);
      toast.success('Order delivered');
      loadOrders();
    } catch (error) {
      toast.error(error.error || 'Failed to update');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      ready: 'bg-indigo-100 text-indigo-800',
      picked_up: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Deliveries</h1>

      <div className="mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">All</option>
          <option value="ready">Ready</option>
          <option value="picked_up">Picked Up</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>

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
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {ORDER_STATUS_LABELS[order.status] || order.status}
              </span>
            </div>

            <div className="mb-4 flex items-start">
              <MapPin className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Delivery Address</p>
                <p className="text-gray-600">{order.delivery_address}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="font-medium text-gray-900 mb-2">Vendor: {order.vendor?.business_name}</p>
              <p className="text-sm text-gray-600">{order.vendor?.business_address}</p>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <p className="text-lg font-bold text-green-600">
                Earnings: ${order.rider_earnings?.toFixed(2) || '0.00'}
              </p>
              <div className="flex space-x-2">
                {order.status === 'ready' && (
                  <Button
                    variant="primary"
                    onClick={() => handlePickUp(order.id)}
                    loading={actionLoading}
                  >
                    <Navigation className="w-4 h-4 mr-1" />
                    Pick Up
                  </Button>
                )}
                {order.status === 'picked_up' && (
                  <Button
                    variant="success"
                    onClick={() => handleDeliver(order.id)}
                    loading={actionLoading}
                  >
                    Mark Delivered
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No deliveries assigned</p>
        </div>
      )}
    </div>
  );
};

export default RiderOrders;