import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Bike, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminRiders = () => {
  const [pageSize, setPageSize] = useState(10);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    vehicle_number: '',
    vehicle_type: 'bike',
  });

  useEffect(() => {
    setLoading(true);
    loadRiders();
  }, [page, pageSize]);

  const loadRiders = async () => {
    try {
      const response = await adminAPI.getRiders(page, pageSize);
      setRiders(response.data || response || []);
      setTotalPages(response.pagination?.total_pages || 1);
      setTotalRows(
        typeof response.pagination?.total_rows === 'number'
          ? response.pagination.total_rows
          : (response.data || response || []).length
      );
    } catch {
      toast.error('Failed to load riders');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRider = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createRider(formData);
      toast.success('Rider created successfully');
      setShowForm(false);
      setFormData({
        password: '',
        first_name: '',
        last_name: '',
        phone: '',
        vehicle_number: '',
        vehicle_type: 'bike',
      });
      loadRiders();
    } catch (error) {
      toast.error(error.error || 'Failed to create rider');
    }
  };

  if (loading) return <LoadingSpinner />;

  const startEntry = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const endEntry = totalRows === 0 ? 0 : Math.min(page * pageSize, totalRows);

  const pagesToShow = Array.from(
    new Set([page - 1, page, page + 1].filter((p) => p >= 1 && p <= totalPages))
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Link to="/admin" className="text-sm font-semibold text-[#db2777] hover:underline">
          Home
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Per page</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPage(1);
                setPageSize(Number(e.target.value));
              }}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800"
              aria-label="Per page"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Rider
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Rider</h2>
          <form onSubmit={handleCreateRider} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required />
              <Input label="Last Name" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} required />
            </div>
            <Input label="Password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
            <Input label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
            <Input label="Vehicle Number" value={formData.vehicle_number} onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })} required />
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
              <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase">Vehicle</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase">Deliveries</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {riders.map((rider) => (
              <tr key={rider.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Bike className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="font-medium text-gray-900">{rider.user?.first_name} {rider.user?.last_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{rider.user?.phone || '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{rider.vehicle_number} ({rider.vehicle_type})</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={rider.is_available ? 'text-green-600' : 'text-gray-600'}>
                    {rider.is_available ? 'Available' : 'Unavailable'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{rider.total_deliveries || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-gray-700">
          Showing <span className="font-semibold">{startEntry}</span> to{' '}
          <span className="font-semibold">{endEntry}</span> of{' '}
          <span className="font-semibold">{totalRows}</span> entries
        </p>

        <div className="inline-flex items-stretch overflow-hidden rounded-lg border border-gray-200 bg-white">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-2 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {pagesToShow.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={
                p === page
                  ? 'min-w-10 px-4 py-2 text-sm font-semibold bg-green-500 text-white'
                  : 'min-w-10 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border-l border-gray-200'
              }
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-2 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed border-l border-gray-200"
            aria-label="Next page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminRiders;