import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { usersAPI } from '../../api/users';
import { ordersAPI } from '../../api/orders';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { MapPin, CreditCard, Wallet, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getTotal, clearCart, vendorId } = useCart();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [blockNumber, setBlockNumber] = useState('');
  const [dormNumber, setDormNumber] = useState('');
  const [deliveryLat, setDeliveryLat] = useState(null);
  const [deliveryLng, setDeliveryLng] = useState(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [saveAddress, setSaveAddress] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const savedHashRef = useRef(null);
  const LOCAL_KEY = 'checkout_address_form_v1';
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  useEffect(() => {
    loadAddresses();
    // load persisted form state from localStorage
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.deliveryAddress) setDeliveryAddress(parsed.deliveryAddress);
        if (parsed.blockNumber) setBlockNumber(parsed.blockNumber);
        if (parsed.dormNumber) setDormNumber(parsed.dormNumber);
        if (parsed.deliveryLat) setDeliveryLat(parsed.deliveryLat);
        if (parsed.deliveryLng) setDeliveryLng(parsed.deliveryLng);
        if (typeof parsed.saveAddress === 'boolean') setSaveAddress(parsed.saveAddress);
      }
    } catch (err) {
      console.warn('Failed to load checkout form from localStorage', err);
    }
  }, []);

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    toast.loading('Requesting location...', { id: 'location' });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDeliveryLat(position.coords.latitude);
        setDeliveryLng(position.coords.longitude);
        setLocationPermission(true);
        toast.success('Location fetched successfully', { id: 'location' });
        // persist to localStorage
        try {
          const payload = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
          payload.deliveryLat = position.coords.latitude;
          payload.deliveryLng = position.coords.longitude;
          localStorage.setItem(LOCAL_KEY, JSON.stringify(payload));
        } catch (err) { console.warn(err); }
        // If user wants to save addresses, try saving this fetched location to server
        (async () => {
          if (!saveAddress) return;
          try {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            // build a readable address_line1 from any known pieces
            let shortAddr = deliveryAddress && deliveryAddress.trim() ? deliveryAddress.trim() : `Current location (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
            if (blockNumber && dormNumber) {
              shortAddr = `${shortAddr}, Block ${blockNumber}, Dorm ${dormNumber}`;
            }
            // if user hasn't provided a deliveryAddress yet, set it to the fetched shortAddr
            if (!deliveryAddress) setDeliveryAddress(shortAddr);
            const hash = `${shortAddr}|${lat}|${lng}`;
            if (savedHashRef.current === hash) return;

            await usersAPI.addAddress({
              address_line1: shortAddr,
              address_line2: '',
              city: '',
              state: '',
              postal_code: '',
              country: '',
              latitude: lat,
              longitude: lng,
              is_default: true,
              address_type: 'home'
            });
            savedHashRef.current = hash;
            try { await loadAddresses(); } catch (e) { /* ignore */ }
          } catch (err) {
            console.warn('Failed to save fetched location:', err);
          }
        })();
      },
      (error) => {
        toast.error('Please enable location access in your browser settings', { id: 'location' });
        console.error('Location error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // auto-save to server when user enables saveAddress and required fields present
  useEffect(() => {
    const shouldSave = saveAddress && deliveryAddress && deliveryLat && deliveryLng && blockNumber && dormNumber;
    if (!shouldSave) return;

    const fullAddress = `${deliveryAddress}, Block ${blockNumber}, Dorm ${dormNumber}`;
    const hash = `${fullAddress}|${deliveryLat}|${deliveryLng}`;
    if (savedHashRef.current === hash) return; // already saved

    const doSave = async () => {
      try {
        await usersAPI.addAddress({
          address_line1: fullAddress,
          address_line2: '',
          city: '',
          state: '',
          postal_code: '',
          country: '',
          latitude: deliveryLat || 0,
          longitude: deliveryLng || 0,
          is_default: true,
          address_type: 'home'
        });
        savedHashRef.current = hash;
        // refresh addresses list
        try { await loadAddresses(); } catch (e) { /* ignore */ }
      } catch (err) {
        console.warn('Auto-save address failed', err);
      }
    };

    doSave();
  }, [saveAddress, deliveryAddress, deliveryLat, deliveryLng, blockNumber, dormNumber]);

  // persist form to localStorage on changes
  useEffect(() => {
    try {
      const payload = {
        deliveryAddress,
        blockNumber,
        dormNumber,
        deliveryLat,
        deliveryLng,
        saveAddress,
      };
      localStorage.setItem(LOCAL_KEY, JSON.stringify(payload));
    } catch (err) { console.warn('Failed to persist checkout form', err); }
  }, [deliveryAddress, blockNumber, dormNumber, deliveryLat, deliveryLng, saveAddress]);

  const loadAddresses = async () => {
    try {
      const response = await usersAPI.getAddresses();
      const addressList = response.data || response;
      setAddresses(addressList);
      const defaultAddr = addressList.find((a) => a.is_default) || addressList[0];
      if (defaultAddr) {
        setSelectedAddress(defaultAddr);
        setDeliveryAddress(
          `${defaultAddr.address_line1}, ${defaultAddr.city}, ${defaultAddr.state}`
        );
        setDeliveryLat(defaultAddr.latitude);
        setDeliveryLng(defaultAddr.longitude);
      }
    } catch (error) {
      console.error('Failed to load addresses:', error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // allow placing order without a pre-selected delivery address; fallback to block/dorm

    if (!blockNumber.trim() || !dormNumber.trim()) {
      toast.error('Please enter block and dorm number');
      return;
    }

    if (!phoneNumber.trim() || !idNumber.trim()) {
      toast.error('Please enter phone number and ID number');
      return;
    }

    if (!locationPermission || !deliveryLat || !deliveryLng) {
      toast.error('Please enable and fetch your location');
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!vendorId) {
      toast.error('No vendor selected for this order');
      return;
    }

    // Validate that all items have menuItemId
    const invalidItems = items.filter(item => !item.menuItemId);
    if (invalidItems.length > 0) {
      toast.error('Some items in your cart are invalid. Please remove them and try again.');
      console.error('Invalid items:', invalidItems);
      return;
    }

    setLoading(true);

    try {
      const fullAddress = (deliveryAddress && deliveryAddress.trim())
        ? `${deliveryAddress}, Block ${blockNumber}, Dorm ${dormNumber}`
        : `Block ${blockNumber}, Dorm ${dormNumber}${deliveryLat && deliveryLng ? ` (coords: ${deliveryLat.toFixed(6)}, ${deliveryLng.toFixed(6)})` : ''}`;
      
      const orderData = {
        vendor_id: vendorId,
        items: items.map((item) => {
          console.log('Cart item:', item);
          return {
            menu_item_id: item.menuItemId,
            quantity: item.quantity,
            special_instructions: item.specialInstructions || '',
          };
        }),
        delivery_address: fullAddress,
        delivery_lat: deliveryLat,
        delivery_lng: deliveryLng,
        delivery_block: blockNumber,
        delivery_dorm: dormNumber,
        customer_phone: phoneNumber,
        customer_id_number: idNumber,
        payment_method: paymentMethod,
        special_instructions: `Block: ${blockNumber}, Dorm: ${dormNumber}${phoneNumber ? `, Phone: ${phoneNumber}` : ''}${idNumber ? `, ID: ${idNumber}` : ''}`,
      };

      console.log('Order data being sent:', orderData);
      console.log('Items array:', orderData.items);
      orderData.items.forEach((item, index) => {
        console.log(`Item ${index}:`, item, 'menu_item_id type:', typeof item.menu_item_id);
      });

      const response = await ordersAPI.create(orderData);
      const order = response.data || response;
      // Optionally save the delivery address to user's addresses
      try {
        if (saveAddress) {
          await usersAPI.addAddress({
            address_line1: fullAddress,
            address_line2: '',
            city: '',
            state: '',
            postal_code: '',
            country: '',
            latitude: deliveryLat || 0,
            longitude: deliveryLng || 0,
            is_default: true,
            address_type: 'home'
          });
        }
      } catch (err) {
        console.warn('Failed to save address:', err);
      }
      
      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/student/orders/${order.id}/track`);
    } catch (error) {
      console.error('Order create failed:', error);
      const msg = (error && (error.error || error.message)) || JSON.stringify(error);
      toast.error(msg || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (loadingAddresses) {
    return <div className="text-center py-8">Loading addresses...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Checkout</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Delivery Location
          </h2>
          
          <div className="mb-4">
            <Button
              type="button"
              variant="secondary"
              onClick={requestLocation}
              className="mb-4 flex items-center"
            >
              <Navigation className="w-4 h-4 mr-2" />
              {locationPermission ? 'Location Fetched ✓' : 'Turn On & Fetch Location'}
            </Button>
            {locationPermission && deliveryLat && deliveryLng && (
              <p className="text-sm text-green-600 mb-2">
                Location: {deliveryLat.toFixed(6)}, {deliveryLng.toFixed(6)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <Input
              label="Block Number"
              name="block_number"
              value={blockNumber}
              onChange={(e) => setBlockNumber(e.target.value)}
              required
              placeholder="35"
            />
            <Input
              label="Dorm Number"
              name="dorm_number"
              value={dormNumber}
              onChange={(e) => setDormNumber(e.target.value)}
              required
              placeholder="12"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Input
              label="Phone Number"
              name="phone_number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g., +251912345678"
            />
            <Input
              label="ID Number"
              name="id_number"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder="Student ID or National ID"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Method</h2>
          <div className="space-y-3">
            <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="payment"
                value="cash"
                checked={paymentMethod === 'cash'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mr-3"
              />
              <div className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                <span className="font-medium">Cash on Delivery</span>
              </div>
            </label>
            <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="payment"
                value="card"
                checked={paymentMethod === 'card'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mr-3"
              />
              <div className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                <span className="font-medium">Credit/Debit Card</span>
              </div>
            </label>
            <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="payment"
                value="wallet"
                checked={paymentMethod === 'wallet'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mr-3"
              />
              <div className="flex items-center">
                <Wallet className="w-5 h-5 mr-2" />
                <span className="font-medium">Wallet</span>
              </div>
            </label>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-2 mb-4">
            {items.map((item) => (
              <div key={item.menuItemId} className="flex justify-between">
                <span className="text-gray-700">
                  {item.name} x {item.quantity}
                </span>
                <span className="font-medium">ETB {(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-700">Subtotal</span>
              <span className="font-medium">ETB {getTotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Delivery Fee</span>
              <span className="font-medium">ETB 2.50</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total</span>
              <span className="text-blue-600">ETB {(getTotal() + 2.5).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
          Place Order
        </Button>
      </form>
    </div>
  );
};

export default Checkout;