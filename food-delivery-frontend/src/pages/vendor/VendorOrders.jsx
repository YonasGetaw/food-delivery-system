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
  const [modalMode, setModalMode] = useState('details');
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
      setModalMode('details');
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
      setSelectedOrder(null);
      setModalMode('details');
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
      setModalMode('details');
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
      setModalMode('details');
    } catch (error) {
      toast.error(error.error || 'Failed to update');
    } finally {
      setActionLoading(false);
    }
  };

  const openDetails = (order) => {
    setRejectReason('');
    setModalMode('details');
    setSelectedOrder(order);
  };

  const closeDetails = () => {
    setSelectedOrder(null);
    setRejectReason('');
    setModalMode('details');
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

      {orders.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-blue-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 dark:text-gray-200 uppercase">Order #</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 dark:text-gray-200 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 dark:text-gray-200 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 dark:text-gray-200 uppercase">Total</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-blue-700 dark:text-gray-200 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {order.order_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {order.created_at ? format(new Date(order.created_at), 'MMM dd, yyyy HH:mm') : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                        {ORDER_STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-pink-600 dark:text-pink-300">
                      ETB {order.total_amount?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button size="sm" variant="secondary" onClick={() => openDetails(order)}>
                        Show
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {selectedOrder ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-lg">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                  Order #{selectedOrder.order_number}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedOrder.status)}`}>
                    {ORDER_STATUS_LABELS[selectedOrder.status] || selectedOrder.status}
                  </span>
                  {selectedOrder.created_at ? (
                    <span className="text-xs text-gray-600 dark:text-gray-300">
                      {format(new Date(selectedOrder.created_at), 'MMM dd, yyyy HH:mm')}
                    </span>
                  ) : null}
                </div>
              </div>

              <button
                type="button"
                onClick={closeDetails}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div className="space-y-1">
                <div className="text-sm text-gray-700 dark:text-gray-200">
                  <span className="font-semibold">Delivery:</span> {selectedOrder.delivery_address || '—'}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-200">
                  <span className="font-semibold">Phone:</span> {selectedOrder.customer_phone || selectedOrder.student?.user?.phone || 'N/A'}
                </div>
                {selectedOrder.special_instructions ? (
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-semibold">Notes:</span> {selectedOrder.special_instructions}
                  </div>
                ) : null}
              </div>

              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Items</div>
                {Array.isArray(selectedOrder.order_items) && selectedOrder.order_items.length > 0 ? (
                  <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase">Item</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase">Qty</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                        {selectedOrder.order_items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                              {item.menu_item?.name || 'Item'}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 text-right">{item.quantity}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 text-right">
                              ETB {item.unit_price && item.quantity ? (item.unit_price * item.quantity).toFixed(2) : '0.00'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600 dark:text-gray-300">No items</div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                <div className="text-sm text-gray-700 dark:text-gray-200">
                  <span className="font-semibold">Total:</span>{' '}
                  <span className="font-bold text-pink-600 dark:text-pink-300">ETB {selectedOrder.total_amount?.toFixed(2) || '0.00'}</span>
                </div>

                {modalMode === 'details' ? (
                  <div className="flex items-center gap-2">
                    {selectedOrder.status === 'pending' ? (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleAccept(selectedOrder.id)}
                          loading={actionLoading}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setModalMode('reject')}
                          disabled={actionLoading}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    ) : null}

                    {selectedOrder.status === 'confirmed' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleStartPreparing(selectedOrder.id)}
                        loading={actionLoading}
                      >
                        Start Preparing
                      </Button>
                    ) : null}

                    {selectedOrder.status === 'preparing' ? (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleMarkReady(selectedOrder.id)}
                        loading={actionLoading}
                      >
                        Mark Ready
                      </Button>
                    ) : null}

                    <Button variant="secondary" size="sm" onClick={closeDetails} disabled={actionLoading}>
                      Close
                    </Button>
                  </div>
                ) : (
                  <div className="w-full">
                    <Input
                      label="Rejection reason"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Enter rejection reason"
                      required
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setRejectReason('');
                          setModalMode('details');
                        }}
                        disabled={actionLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleReject(selectedOrder.id)}
                        loading={actionLoading}
                        disabled={!rejectReason.trim()}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

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