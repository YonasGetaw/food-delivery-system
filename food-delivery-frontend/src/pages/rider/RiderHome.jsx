import { useState, useEffect } from 'react';
import { ridersAPI } from '../../api/riders';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import { Package, DollarSign, Bike, Power } from 'lucide-react';
import toast from 'react-hot-toast';

const RiderHome = () => {
  const [rider, setRider] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [riderRes, assignedRes, availableRes] = await Promise.all([
        ridersAPI.getProfile(),
        ridersAPI.getAssignedOrders(''),
        ridersAPI.getAvailableOrders(1, 10),
      ]);
      const riderData = riderRes.data || riderRes;
      setRider(riderData);
      setOrders(assignedRes.data || assignedRes || []);
      setAvailableOrders(availableRes.data || availableRes || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    setToggling(true);
    try {
      const response = await ridersAPI.toggleAvailability();
      setRider({ ...rider, is_available: response.data ?? response });
      toast.success(`You are now ${rider?.is_available ? 'unavailable' : 'available'}`);
    } catch (error) {
      toast.error(error.error || 'Failed to toggle');
    } finally {
      setToggling(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="px-4 py-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <Button
          variant={rider?.is_available ? 'success' : 'secondary'}
          onClick={handleToggleAvailability}
          loading={toggling}
          className="flex items-center"
        >
          <Power className="w-4 h-4 mr-2" />
          {rider?.is_available ? 'Available' : 'Unavailable'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Deliveries</p>
              <p className="text-3xl font-bold text-gray-900">{rider?.total_deliveries || 0}</p>
            </div>
            <Package className="w-12 h-12 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Earnings</p>
              <p className="text-3xl font-bold text-gray-900">
                ${rider?.total_earnings?.toFixed(2) || '0.00'}
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Balance</p>
              <p className="text-3xl font-bold text-gray-900">
                ${rider?.current_balance?.toFixed(2) || '0.00'}
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Assigned Orders</h2>

              <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Orders</h2>
                {availableOrders.length === 0 ? (
                  <p className="text-gray-600">No available orders</p>
                ) : (
                  <div className="space-y-4">
                    {availableOrders.map((order) => (
                      <div key={order.id} className="p-4 border rounded-lg flex justify-between items-start">
                        <div>
                          <p className="font-semibold">Order #{order.order_number}</p>
                          <p className="text-sm text-gray-600">{order.delivery_address}</p>
                          <p className="text-sm text-gray-600">Phone: {order.customer_phone || order.student?.user?.phone || 'N/A'}</p>
                          <p className="text-sm text-gray-500">{order.status}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <p className="font-bold text-blue-600">${order.rider_earnings?.toFixed(2) || '0.00'}</p>
                          <Button onClick={async () => {
                            try {
                              await ridersAPI.claimOrder(order.id);
                              toast.success('Order claimed');
                              // refresh lists
                              loadData();
                              const res = await ridersAPI.getAvailableOrders(1,10);
                              setAvailableOrders(res.data || res || []);
                            } catch (err) {
                              toast.error(err.error || 'Failed to claim order');
                            }
                          }} className="mt-2">Claim</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
        {orders.length === 0 ? (
          <p className="text-gray-600">No assigned orders</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">Order #{order.order_number}</p>
                    <p className="text-sm text-gray-600">{order.delivery_address}</p>
                    <p className="text-sm text-gray-600">Phone: {order.customer_phone || order.student?.user?.phone || 'N/A'}</p>
                    <p className="text-sm text-gray-500">{order.status}</p>
                  </div>
                  <p className="font-bold text-blue-600">
                    ${order.rider_earnings?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RiderHome;