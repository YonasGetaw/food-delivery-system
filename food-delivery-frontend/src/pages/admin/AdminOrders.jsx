import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import { ORDER_STATUS_LABELS } from '../../utils/constants';
import { UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    loadOrders();
    loadRiders();
  }, [page]);

  const loadOrders = async () => {
    try {
      const response = await adminAPI.getOrders({ page, limit: 10 });
      setOrders(response.data || response || []);
      setTotalPages(response.pagination?.total_pages || 1);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const openOrderDetails = async (orderId) => {
    setDetailLoading(true);
    try {
      const response = await adminAPI.getOrder(orderId);
      setSelectedOrder(response.data || response);
      setSelectedRiderId('');
    } catch (error) {
      toast.error(error.error || 'Failed to load order');
    } finally {
      setDetailLoading(false);
    }
  };

  const loadRiders = async () => {
    try {
      const response = await adminAPI.getRiders(1, 100);
      setRiders(response.data || response || []);
    } catch (error) {
      console.error('Failed to load riders:', error);
    }
  };

  const handleAssignRider = async () => {
    if (!selectedOrder || !selectedRiderId) return;
    setAssignLoading(true);
    try {
      await adminAPI.assignRider(selectedOrder.id, parseInt(selectedRiderId));
      toast.success('Rider assigned successfully');
      setSelectedOrder(null);
      setSelectedRiderId('');
      loadOrders();
    } catch (error) {
      toast.error(error.error || 'Failed to assign rider');
    } finally {
      setAssignLoading(false);
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

  const availableRiders = riders.filter((r) => r.is_available);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="mb-4">
        <Link to="/admin" className="text-sm font-semibold text-[#db2777] hover:underline">
          Home
        </Link>
      </div>

      <div className="bg-white rounded-none shadow-md overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase">Order #</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase">Vendor</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase">Customer Phone</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr
                key={order.id}
                onClick={() => openOrderDetails(order.id)}
                className="cursor-pointer hover:bg-pink-50"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.order_number}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.vendor?.business_name || '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.customer_phone || order.student?.user?.phone || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {ORDER_STATUS_LABELS?.[order.status] || order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${order.total_amount?.toFixed(2) || '0.00'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-6">
          <Button variant="secondary" onClick={() => setPage(page - 1)} disabled={page === 1}>
            Previous
          </Button>
          <span className="px-4 py-2">Page {page} of {totalPages}</span>
          <Button variant="secondary" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
            Next
          </Button>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[85vh] overflow-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Order #{selectedOrder.order_number}</h3>
                <p className="text-sm text-gray-600">{format(new Date(selectedOrder.created_at), 'MMM dd, yyyy HH:mm')}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-3 py-2 rounded-lg hover:bg-gray-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {detailLoading ? (
              <div className="py-10"><LoadingSpinner /></div>
            ) : (
              <>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Vendor</p>
                    <p className="font-medium text-gray-900">{selectedOrder.vendor?.business_name || '—'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                      {ORDER_STATUS_LABELS?.[selectedOrder.status] || selectedOrder.status}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Delivery Address</p>
                    <p className="font-medium text-gray-900">{selectedOrder.delivery_address}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Customer Phone</p>
                    <p className="font-medium text-gray-900">{selectedOrder.customer_phone || selectedOrder.student?.user?.phone || 'N/A'}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-2">Items</h4>
                  <div className="overflow-x-auto border border-gray-200 rounded-none">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-blue-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase">Item</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase">Qty</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase">Unit</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(selectedOrder.order_items || []).map((it) => (
                          <tr key={it.id}>
                            <td className="px-4 py-3 text-sm text-gray-900">{it.menu_item?.name || 'Item'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{it.quantity}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{Number(it.unit_price || 0).toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{Number(it.subtotal || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                  <p className="text-lg font-bold text-gray-900">Total: ${selectedOrder.total_amount?.toFixed(2) || '0.00'}</p>

                  {selectedOrder.status === 'ready' && !selectedOrder.assigned_rider_id && (
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedRiderId}
                        onChange={(e) => setSelectedRiderId(e.target.value)}
                        className="px-4 py-2 border rounded-lg"
                      >
                        <option value="">Choose rider...</option>
                        {availableRiders.map((rider) => (
                          <option key={rider.id} value={rider.id}>
                            {rider.user?.first_name} {rider.user?.last_name} - {rider.vehicle_number}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="primary"
                        onClick={handleAssignRider}
                        loading={assignLoading}
                        disabled={!selectedRiderId}
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Assign Rider
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;