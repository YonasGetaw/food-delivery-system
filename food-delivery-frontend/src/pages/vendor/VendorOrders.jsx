import { useState, useEffect } from 'react';
import { vendorsAPI } from '../../api/vendors';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { ORDER_STATUS_LABELS } from '../../utils/constants';
import { Check, X, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const VendorOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [statusFilter, page]);

  const loadOrders = async () => {
    try {
      const response = await vendorsAPI.getOrders(statusFilter, page, 10);
      const data = response.data || response;
      setOrders(Array.isArray(data) ? data : []);
      setTotalPages(response.pagination?.total_pages || 1);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (orderId) => {
    setActionLoading(true);
    try {
      await vendorsAPI.acceptOrder(orderId);
      toast.success('Order accepted');
      loadOrders();
      setSelectedOrder(null);
    } catch (error) {
      toast.error(error.error || 'Failed to accept order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartPreparing = async (orderId) => {
    setActionLoading(true);
    try {
      // Update order status to "preparing"
      await vendorsAPI.updateOrderStatus(orderId, 'preparing');
      toast.success('Order status updated to preparing');
      loadOrders();
    } catch (error) {
      toast.error(error.error || 'Failed to update order status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (orderId) => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    setActionLoading(true);
    try {
      await vendorsAPI.rejectOrder(orderId, rejectReason);
      toast.success('Order rejected');
      loadOrders();
      setSelectedOrder(null);
      setRejectReason('');
    } catch (error) {
      toast.error(error.error || 'Failed to reject order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkReady = async (orderId) => {
    setActionLoading(true);
    try {
      await vendorsAPI.markOrderReady(orderId);
      toast.success('Order marked as ready');
      loadOrders();
      setSelectedOrder(null);
    } catch (error) {
      toast.error(error.error || 'Failed to update');
    } finally {
      setActionLoading(false);
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
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 dark:text-gray-100 dark:border-gray-800"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="picked_up">Picked Up</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Order #{order.order_number}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {ORDER_STATUS_LABELS[order.status] || order.status}
              </span>
            </div>

            <div className="mb-4">
              <p className="text-gray-700 dark:text-gray-200">
                <strong>Delivery:</strong> {order.delivery_address}
              </p>
              <p className="text-gray-700 dark:text-gray-200 mt-1">
                <strong>Phone:</strong> {order.customer_phone || order.student?.user?.phone || 'N/A'}
              </p>
              {order.special_instructions && (
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                  <strong>Notes:</strong> {order.special_instructions}
                </p>
              )}
            </div>

            <div className="mb-4">
              <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">Items:</p>
              <ul className="list-disc list-inside space-y-1">
                {order.order_items?.map((item) => (
                  <li key={item.id} className="text-gray-800 dark:text-gray-200">
                    {item.menu_item?.name || 'Item'} x {item.quantity} - ETB
                    {(item.unit_price * item.quantity).toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xl font-bold text-pink-600 dark:text-pink-300">
                Total: ETB {order.total_amount?.toFixed(2) || '0.00'}
              </p>
              <div className="flex space-x-2">
                {order.status === 'pending' && (
                  <>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleAccept(order.id)}
                      loading={actionLoading}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setSelectedOrder({ ...order, action: 'reject' })}
                      disabled={actionLoading}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </>
                )}
                {order.status === 'confirmed' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleStartPreparing(order.id)}
                    loading={actionLoading}
                  >
                    Start Preparing
                  </Button>
                )}
                {order.status === 'preparing' && (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleMarkReady(order.id)}
                    loading={actionLoading}
                  >
                    Mark Ready
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedOrder?.action === 'reject' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Reject Order</h3>
            <Input
              label="Reason (required)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason"
            />
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="secondary" onClick={() => setSelectedOrder(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => handleReject(selectedOrder.id)}
                loading={actionLoading}
                disabled={!rejectReason.trim()}
              >
                Reject Order
              </Button>
            </div>
          </div>
        </div>
      )}

      {orders.length === 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-12 text-center border border-gray-100 dark:border-gray-800">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">No orders found</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-6">
          <Button
            variant="secondary"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="px-4 py-2 text-gray-700 dark:text-gray-200">Page {page} of {totalPages}</span>
          <Button
            variant="secondary"
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default VendorOrders;