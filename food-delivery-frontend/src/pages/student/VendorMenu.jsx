import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { vendorsAPI } from '../../api/vendors';
import { useCart } from '../../hooks/useCart';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import { Plus, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAssetUrl } from '../../utils/helpers';

const VendorMenu = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [menuItems, setMenuItems] = useState([]);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    loadMenu();
  }, [id]);

  const loadMenu = async () => {
    try {
      const response = await vendorsAPI.getPublicMenu(id);
      const items = response.data || response;
      setMenuItems(items);
      
      // Get vendor info from first item or fetch separately
      if (items.length > 0 && items[0].vendor) {
        setVendor(items[0].vendor);
      }
    } catch (error) {
      toast.error('Failed to load menu');
      navigate('/student');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...new Set(menuItems.map((item) => item.category))];

  const filteredItems =
    selectedCategory === 'all'
      ? menuItems
      : menuItems.filter((item) => item.category === selectedCategory);

  const handleAddToCart = (item) => {
    const quantity = quantities[item.id] || 1;
    addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.discount_price || item.price,
      quantity,
      vendorId: Number(id),
      vendorName: vendor?.business_name || 'Vendor',
      imageUrl: item.image_url,
    });
    setQuantities({ ...quantities, [item.id]: 1 });
    toast.success(`${item.name} added to cart`);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {vendor && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{vendor.business_name}</h1>
          <p className="text-gray-600">{vendor.description}</p>
          <div className="mt-4 flex items-center space-x-4">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                vendor.is_open
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {vendor.is_open ? 'Open' : 'Closed'}
            </span>
            {vendor.minimum_order > 0 && (
              <span className="text-sm text-gray-600">
                Minimum order: ${vendor.minimum_order.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="mb-6 flex space-x-2 overflow-x-auto">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
              selectedCategory === category
                ? 'bg-pink-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {item.image_url && (
              <img
                src={getAssetUrl(item.image_url)}
                alt={item.name}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                <div className="flex space-x-1">
                  {item.is_vegetarian && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      Veg
                    </span>
                  )}
                  {item.is_spicy && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                      Spicy
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">{item.description}</p>
              <div className="flex items-center justify-between">
                <div>
                  {item.discount_price ? (
                    <div>
                      <span className="text-lg font-bold text-pink-600">
                        ${item.discount_price.toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-500 line-through ml-2">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-lg font-bold text-gray-900">
                      ${item.price.toFixed(2)}
                    </span>
                  )}
                </div>
                {item.is_available ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="1"
                      value={quantities[item.id] || 1}
                      onChange={(e) =>
                        setQuantities({
                          ...quantities,
                          [item.id]: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-16 px-2 py-1 border rounded text-center"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(item)}
                      className="flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                ) : (
                  <span className="text-sm text-red-600 font-medium">Unavailable</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-600">No items found in this category.</p>
        </div>
      )}
    </div>
  );
};

export default VendorMenu;