import { useState, useEffect } from 'react';
import { ridersAPI } from '../../api/riders';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { Bike } from 'lucide-react';
import toast from 'react-hot-toast';

const RiderProfile = () => {
  const [rider, setRider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    vehicle_number: '',
    vehicle_type: 'bike',
    phone: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await ridersAPI.getProfile();
      const data = response.data || response;
      setRider(data);
      setFormData({
        vehicle_number: data.vehicle_number || '',
        vehicle_type: data.vehicle_type || 'bike',
        phone: data.user?.phone || '',
      });
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await ridersAPI.updateProfile(formData);
      toast.success('Profile updated successfully');
      loadProfile();
    } catch (error) {
      toast.error(error.error || 'Failed to update profile');
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
        <Bike className="w-8 h-8 mr-2" />
        Rider Profile
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <Input
          label="Vehicle Number"
          value={formData.vehicle_number}
          onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
          <select
            value={formData.vehicle_type}
            onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="bike">Bike</option>
            <option value="scooter">Scooter</option>
            <option value="car">Car</option>
          </select>
        </div>
        <Input
          label="Phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
        <Button type="submit" variant="primary">
          Update Profile
        </Button>
      </form>
    </div>
  );
};

export default RiderProfile;