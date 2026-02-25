import { useState, useEffect } from 'react';
import { usersAPI } from '../../api/users';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { User, MapPin, Plus, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';

const StudentProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingAddress, setEditingAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
  });
  const [addressForm, setAddressForm] = useState({
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    latitude: '',
    longitude: '',
    is_default: false,
    address_type: 'home',
  });

  useEffect(() => {
    loadProfile();
    loadAddresses();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await usersAPI.getProfile();
      const data = response.data || response;
      setProfile(data);
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone: data.phone || '',
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAddresses = async () => {
    try {
      const response = await usersAPI.getAddresses();
      setAddresses(response.data || response);
    } catch (error) {
      console.error('Failed to load addresses:', error);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await usersAPI.updateProfile(formData);
      toast.success('Profile updated successfully');
      loadProfile();
    } catch (error) {
      toast.error(error.error || 'Failed to update profile');
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      await usersAPI.addAddress({
        ...addressForm,
        latitude: parseFloat(addressForm.latitude) || 0,
        longitude: parseFloat(addressForm.longitude) || 0,
      });
      toast.success('Address added successfully');
      setShowAddressForm(false);
      setAddressForm({
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        latitude: '',
        longitude: '',
        is_default: false,
        address_type: 'home',
      });
      loadAddresses();
    } catch (error) {
      toast.error(error.error || 'Failed to add address');
    }
  };

  const handleUpdateAddress = async (e) => {
    e.preventDefault();
    try {
      await usersAPI.updateAddress(editingAddress.id, {
        ...addressForm,
        latitude: parseFloat(addressForm.latitude) || 0,
        longitude: parseFloat(addressForm.longitude) || 0,
      });
      toast.success('Address updated successfully');
      setEditingAddress(null);
      setAddressForm({
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        latitude: '',
        longitude: '',
        is_default: false,
        address_type: 'home',
      });
      loadAddresses();
    } catch (error) {
      toast.error(error.error || 'Failed to update address');
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await usersAPI.deleteAddress(id);
      toast.success('Address deleted successfully');
      loadAddresses();
    } catch (error) {
      toast.error(error.error || 'Failed to delete address');
    }
  };

  const startEditAddress = (address) => {
    setEditingAddress(address);
    setAddressForm({
      address_line1: address.address_line1,
      address_line2: address.address_line2 || '',
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      latitude: address.latitude?.toString() || '',
      longitude: address.longitude?.toString() || '',
      is_default: address.is_default,
      address_type: address.address_type || 'home',
    });
    setShowAddressForm(true);
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Profile</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <User className="w-5 h-5 mr-2" />
          Personal Information
        </h2>
        <form onSubmit={handleProfileUpdate}>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              required
            />
          </div>
          <Input
            label="Email"
            name="email"
            value={profile?.email || ''}
            disabled
            className="bg-gray-100"
          />
          <Input
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
          <Button type="submit" variant="primary">
            Update Profile
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Delivery Addresses
          </h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setShowAddressForm(!showAddressForm);
              setEditingAddress(null);
              setAddressForm({
                address_line1: '',
                address_line2: '',
                city: '',
                state: '',
                postal_code: '',
                country: '',
                latitude: '',
                longitude: '',
                is_default: false,
                address_type: 'home',
              });
            }}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Address
          </Button>
        </div>

        {showAddressForm && (
          <form
            onSubmit={editingAddress ? handleUpdateAddress : handleAddAddress}
            className="mb-6 p-4 bg-gray-50 rounded-lg"
          >
            <Input
              label="Address Line 1"
              name="address_line1"
              value={addressForm.address_line1}
              onChange={(e) =>
                setAddressForm({ ...addressForm, address_line1: e.target.value })
              }
              required
            />
            <Input
              label="Address Line 2"
              name="address_line2"
              value={addressForm.address_line2}
              onChange={(e) =>
                setAddressForm({ ...addressForm, address_line2: e.target.value })
              }
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="City"
                name="city"
                value={addressForm.city}
                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                required
              />
              <Input
                label="State"
                name="state"
                value={addressForm.state}
                onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Postal Code"
                name="postal_code"
                value={addressForm.postal_code}
                onChange={(e) =>
                  setAddressForm({ ...addressForm, postal_code: e.target.value })
                }
                required
              />
              <Input
                label="Country"
                name="country"
                value={addressForm.country}
                onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                required
              />
            </div>
            <div className="flex items-center space-x-4 mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={addressForm.is_default}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, is_default: e.target.checked })
                  }
                  className="mr-2"
                />
                Set as default
              </label>
              <select
                value={addressForm.address_type}
                onChange={(e) =>
                  setAddressForm({ ...addressForm, address_type: e.target.value })
                }
                className="px-3 py-2 border rounded"
              >
                <option value="home">Home</option>
                <option value="work">Work</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <Button type="submit" variant="primary">
                {editingAddress ? 'Update' : 'Add'} Address
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowAddressForm(false);
                  setEditingAddress(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="p-4 border rounded-lg flex justify-between items-start"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <p className="font-medium">{address.address_line1}</p>
                  {address.is_default && (
                    <span className="px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded">
                      Default
                    </span>
                  )}
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                    {address.address_type}
                  </span>
                </div>
                {address.address_line2 && <p className="text-gray-600">{address.address_line2}</p>}
                <p className="text-gray-600">
                  {address.city}, {address.state} {address.postal_code}
                </p>
                <p className="text-gray-600">{address.country}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => startEditAddress(address)}
                  className="p-2 text-pink-600 hover:bg-pink-50 rounded"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteAddress(address.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {addresses.length === 0 && !showAddressForm && (
            <p className="text-gray-600 text-center py-8">No addresses saved yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;