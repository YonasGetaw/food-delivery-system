import { useState, useEffect } from 'react';
import { vendorsAPI } from '../../api/vendors';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { Store } from 'lucide-react';
import toast from 'react-hot-toast';

const VendorProfile = () => {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    business_name: '',
    business_address: '',
    phone: '',
    description: '',
    logo_url: '',
    cover_image_url: '',
    delivery_radius: 5,
    minimum_order: 0,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await vendorsAPI.getProfile();
      const data = response.data || response;
      setVendor(data);
      setFormData({
        business_name: data.business_name || '',
        business_address: data.business_address || '',
        phone: data.phone || '',
        description: data.description || '',
        logo_url: data.logo_url || '',
        cover_image_url: data.cover_image_url || '',
        delivery_radius: data.delivery_radius || 5,
        minimum_order: data.minimum_order || 0,
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
      await vendorsAPI.updateProfile({
        ...formData,
        delivery_radius: parseFloat(formData.delivery_radius),
        minimum_order: parseFloat(formData.minimum_order),
      });
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
        <Store className="w-8 h-8 mr-2" />
        Vendor Profile
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <Input
          label="Business Name"
          value={formData.business_name}
          onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
          required
        />
        <Input
          label="Business Address"
          value={formData.business_address}
          onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
          required
        />
        <Input
          label="Phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
        <Input
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
        <Input
          label="Logo URL"
          value={formData.logo_url}
          onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
        />
        <Input
          label="Cover Image URL"
          value={formData.cover_image_url}
          onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Delivery Radius (km)"
            type="number"
            step="0.1"
            value={formData.delivery_radius}
            onChange={(e) => setFormData({ ...formData, delivery_radius: e.target.value })}
          />
          <Input
            label="Minimum Order ($)"
            type="number"
            step="0.01"
            value={formData.minimum_order}
            onChange={(e) => setFormData({ ...formData, minimum_order: e.target.value })}
          />
        </div>
        <Button type="submit" variant="primary">
          Update Profile
        </Button>
      </form>
    </div>
  );
};

export default VendorProfile;