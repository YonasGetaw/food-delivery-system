import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { vendorsAPI } from '../../api/vendors';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Store, Star } from 'lucide-react';
import { getAssetUrl } from '../../utils/helpers';

const VendorList = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      const response = await vendorsAPI.getPublicVendors();
      const data = response.data ?? response;
      setVendors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Browse Vendors</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendors.map((vendor) => (
          <Link
            key={vendor.id}
            to={`/student/vendors/${vendor.id}/menu`}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            {vendor.cover_image_url ? (
              <img
                src={getAssetUrl(vendor.cover_image_url)}
                alt={vendor.business_name}
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                <Store className="w-16 h-16 text-gray-400" />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-center gap-3 mb-2">
                {vendor.logo_url ? (
                  <img
                    src={getAssetUrl(vendor.logo_url)}
                    alt={vendor.business_name}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <Store className="w-5 h-5 text-gray-500" />
                  </div>
                )}
                <h3 className="text-xl font-semibold text-gray-900">{vendor.business_name}</h3>
              </div>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{vendor.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                  <span className="text-sm font-medium">{vendor.rating?.toFixed(1) ?? '0.0'}</span>
                  <span className="text-sm text-gray-500 ml-1">({vendor.review_count ?? 0})</span>
                </div>
                <span
                  className={`px-2 py-1 rounded text-sm font-medium ${
                    vendor.is_open ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {vendor.is_open ? 'Open' : 'Closed'}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {vendors.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No vendors available</p>
        </div>
      )}
    </div>
  );
};

export default VendorList;