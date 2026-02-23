import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Plus, Store } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminVendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    business_name: '',
    business_address: '',
    latitude: 0,
    longitude: 0,
    commission_rate: 0.15,
  });

  useEffect(() => {
    setLoading(true);
    loadVendors();
  }, [page]);

  const loadVendors = async () => {
    try {
      const response = await adminAPI.getVendors(page, 10);
      setVendors(response.data || response || []);
      setTotalPages(response.pagination?.total_pages || 1);
    } catch {
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createVendor(formData);
      toast.success('Vendor created successfully');
      setShowForm(false);
      setFormData({
        password: '',
        first_name: '',
        last_name: '',
        phone: '',
        business_name: '',
        business_address: '',
        latitude: 0,
        longitude: 0,
        commission_rate: 0.15,
      });
      loadVendors();
    } catch (error) {
      toast.error(error.error || 'Failed to create vendor');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Link to="/admin" className="text-sm font-semibold text-[#db2777] hover:underline">
          Home
        </Link>
        <Button variant="primary" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Vendor
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Vendor</h2>
          <form onSubmit={handleCreateVendor} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required />
              <Input label="Last Name" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} required />
            </div>
            <Input label="Password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
            <Input label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
            <Input label="Business Name" value={formData.business_name} onChange={(e) => setFormData({ ...formData, business_name: e.target.value })} required />
            <Input label="Business Address" value={formData.business_address} onChange={(e) => setFormData({ ...formData, business_address: e.target.value })} required />
            <Input label="Commission Rate" type="number" step="0.01" value={formData.commission_rate} onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) })} />
            <div className="flex space-x-2">
              <Button type="submit" variant="primary">Create</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-none shadow-md overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase">Business</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase">Revenue</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vendors.map((vendor) => (
              <tr key={vendor.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Store className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="font-medium text-gray-900">{vendor.business_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{vendor.phone || vendor.user?.phone || '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={vendor.is_open ? 'text-green-600' : 'text-gray-600'}>
                    {vendor.is_open ? 'Open' : 'Closed'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ${vendor.total_revenue?.toFixed(2) || '0.00'}
                </td>
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
    </div>
  );
};

export default AdminVendors;