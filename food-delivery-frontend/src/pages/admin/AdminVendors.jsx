import { Link } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { ChevronLeft, ChevronRight, Plus, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAssetUrl } from '../../utils/helpers';

const AdminVendors = () => {
  const [pageSize, setPageSize] = useState(10);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [openFilter, setOpenFilter] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef(null);
  const [formData, setFormData] = useState({
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    business_name: '',
    business_address: '',
    logo_url: '',
    latitude: 0,
    longitude: 0,
    commission_rate: 0.15,
  });

  useEffect(() => {
    setLoading(true);
    loadVendors();
  }, [page, pageSize, openFilter]);

  const loadVendors = async () => {
    try {
      const response = await adminAPI.getVendors({
        page,
        limit: pageSize,
        is_open: openFilter || undefined,
      });
      setVendors(response.data || response || []);
      setTotalPages(response.pagination?.total_pages || 1);
      setTotalRows(
        typeof response.pagination?.total_rows === 'number'
          ? response.pagination.total_rows
          : (response.data || response || []).length
      );
    } catch {
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    try {
      if (!formData.logo_url) {
        toast.error('Please upload a vendor logo.');
        return;
      }
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
        logo_url: '',
        latitude: 0,
        longitude: 0,
        commission_rate: 0.15,
      });
      loadVendors();
    } catch (error) {
      toast.error(error.error || 'Failed to create vendor');
    }
  };

  const validateImageFile = (file) => {
    if (!file) return 'No file selected';
    if (file.size > 5 * 1024 * 1024) return 'Image size must be less than 5MB';
    const ext = (file.name || '').split('.').pop()?.toLowerCase();
    const allowed = ['jpg', 'jpeg', 'png', 'gif'];
    if (!ext || !allowed.includes(ext)) return 'Only JPG, PNG, and GIF images are allowed';
    return '';
  };

  const handleUploadLogo = async (file) => {
    const msg = validateImageFile(file);
    if (msg) {
      toast.error(msg);
      return;
    }

    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await adminAPI.uploadImage(fd);
      const payload = res?.data || res;
      const imageUrl = payload?.image_url;
      if (!imageUrl) {
        toast.error('Upload failed. Please try again.');
        return;
      }
      setFormData((prev) => ({ ...prev, logo_url: imageUrl }));
      toast.success('Logo uploaded successfully.');
    } catch (err) {
      toast.error(err?.error || err?.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
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
        <Link to="/admin" className="text-sm font-semibold text-pink-600 dark:text-pink-300 hover:underline">
          Home
        </Link>
        <div className="flex flex-col items-end gap-2">
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            
           + Create Vendor
          </Button>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Status</span>
              <select
                value={openFilter}
                onChange={(e) => {
                  setPage(1);
                  setOpenFilter(e.target.value);
                }}
                className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800"
                aria-label="Vendor status filter"
              >
                <option value="">All</option>
                <option value="true">Open</option>
                <option value="false">Closed</option>
              </select>
            </div>

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
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Vendor</h2>
          <form onSubmit={handleCreateVendor} className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm font-semibold text-gray-900 mb-2">Vendor Logo</div>
              {formData.logo_url ? (
                <div className="mb-3">
                  <img
                    src={getAssetUrl(formData.logo_url)}
                    alt="Vendor Logo"
                    className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                  />
                </div>
              ) : (
                <div className="mb-3 text-sm text-gray-600">No logo uploaded</div>
              )}

              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingLogo}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  handleUploadLogo(file);
                }}
              />

              <Button
                type="button"
                variant="primary"
                loading={uploadingLogo}
                disabled={uploadingLogo}
                onClick={() => logoInputRef.current?.click()}
              >
                Upload Logo
              </Button>
            </div>

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
              <Button type="submit" variant="primary" disabled={uploadingLogo || !formData.logo_url}>Create</Button>
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
                  ? 'min-w-10 px-4 py-2 text-sm font-semibold bg-pink-600 dark:bg-pink-500/80 text-white'
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

export default AdminVendors;