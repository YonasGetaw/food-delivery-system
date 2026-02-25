import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ordersAPI } from '../../api/orders';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ORDER_STATUS_LABELS } from '../../utils/constants';
import { CheckCircle, Circle, MapPin, Package } from 'lucide-react';
import { format } from 'date-fns';
import { useWebSocket } from '../../hooks/useWebSocket';

const OrderTracking = () => {
  const { id } = useParams();
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const { messages } = useWebSocket();

  useEffect(() => {
    loadTracking();
  }, [id]);

  useEffect(() => {
    // Update tracking when WebSocket messages arrive
    const orderMessages = messages.filter(
      (msg) => msg.reference === id && msg.type === 'order_update'
    );
    if (orderMessages.length > 0) {
      loadTracking();
    }
  }, [messages, id]);

  const loadTracking = async () => {
    try {
      const response = await ordersAPI.track(id);
      setTracking(response.data || response);
    } catch (error) {
      console.error('Failed to load tracking:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIndex = (status) => {
    const statuses = [
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'picked_up',
      'delivered',
    ];
    return statuses.indexOf(status);
  };

  if (loading) return <LoadingSpinner />;
  if (!tracking) return <div>Order not found</div>;

  const currentIndex = getStatusIndex(tracking.status);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/student/orders" className="text-pink-600 hover:text-pink-700">
          ← Back to Orders
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Tracking Order #{tracking.order_number}
      </h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-semibold">Status</span>
          <span
            className={`px-4 py-2 rounded-full font-medium ${
              tracking.status === 'delivered'
                ? 'bg-green-100 text-green-800'
                : tracking.status === 'cancelled' || tracking.status === 'rejected'
                ? 'bg-red-100 text-red-800'
                : 'bg-pink-100 text-pink-800'
            }`}
          >
            {ORDER_STATUS_LABELS[tracking.status] || tracking.status}
          </span>
        </div>

        {tracking.estimated_delivery && (
          <p className="text-gray-600">
            Estimated Delivery: {format(new Date(tracking.estimated_delivery), 'MMM dd, yyyy HH:mm')}
          </p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <MapPin className="w-5 h-5 mr-2" />
          Vendor Location
        </h2>
        <p className="text-gray-700">{tracking.vendor.name}</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Information</h2>
        <p className="text-gray-700">
          <span className="font-medium">Phone:</span> {tracking.customer_phone || tracking.student?.user?.phone || 'N/A'}
        </p>
        <p className="text-gray-700">
          <span className="font-medium">Delivery Address:</span> {tracking.delivery_address}
        </p>
        {tracking.delivery_block && (
          <p className="text-gray-700"> <span className="font-medium">Block:</span> {tracking.delivery_block} </p>
        )}
        {tracking.delivery_dorm && (
          <p className="text-gray-700"> <span className="font-medium">Dorm:</span> {tracking.delivery_dorm} </p>
        )}
      </div>

      {tracking.rider && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Rider Information
          </h2>
          <p className="text-gray-700">
            <span className="font-medium">Name:</span> {tracking.rider.name}
          </p>
          <p className="text-gray-700">
            <span className="font-medium">Phone:</span> {tracking.rider.phone}
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Timeline</h2>
        <div className="space-y-4">
          {[
            { status: 'pending', label: 'Order Placed' },
            { status: 'confirmed', label: 'Order Confirmed' },
            { status: 'preparing', label: 'Preparing Food' },
            { status: 'ready', label: 'Ready for Pickup' },
            { status: 'picked_up', label: 'Picked Up' },
            { status: 'delivered', label: 'Delivered' },
          ].map((step, index) => {
            const stepIndex = getStatusIndex(step.status);
            const isCompleted = stepIndex <= currentIndex;
            const timelineItem = tracking.timeline?.find((t) => t.status === step.status);

            return (
              <div key={step.status} className="flex items-start">
                <div className="flex-shrink-0 mr-4">
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      isCompleted ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </p>
                  {timelineItem && (
                    <p className="text-sm text-gray-600">
                      {format(new Date(timelineItem.timestamp), 'MMM dd, yyyy HH:mm')}
                    </p>
                  )}
                  {timelineItem?.note && (
                    <p className="text-sm text-gray-500 mt-1">{timelineItem.note}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;