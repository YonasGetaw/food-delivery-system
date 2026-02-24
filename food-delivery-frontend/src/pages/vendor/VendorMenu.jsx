import { useState, useEffect } from 'react';
import { vendorsAPI } from '../../api/vendors';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

const VendorMenu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    discount_price: '',
    preparation_time: 15,
    calories: 0,
    is_vegetarian: false,
    is_spicy: false,
  });

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      const response = await vendorsAPI.getMenuItems();
      const data = response.data || response;
      setMenuItems(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err?.error || err?.message || 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    // Convert to base64 for now (you'll need a proper upload endpoint)
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(imageFile);
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      price: '',
      discount_price: '',
      preparation_time: 15,
      calories: 0,
      is_vegetarian: false,
      is_spicy: false,
    });
    setEditingItem(null);
    setImageFile(null);
    setImagePreview('');
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = formData.image_url || '';
      
      if (imageFile) {
        // Upload image (you'll need to implement actual upload)
        imageUrl = await uploadImage();
        // For now, using base64. Replace with actual upload endpoint URL
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        preparation_time: parseInt(formData.preparation_time) || 15,
        calories: parseInt(formData.calories) || 0,
        is_vegetarian: formData.is_vegetarian,
        is_spicy: formData.is_spicy,
        image_url: imageUrl || undefined,
      };
      
      if (formData.discount_price) {
        payload.discount_price = parseFloat(formData.discount_price);
      }

      if (editingItem) {
        await vendorsAPI.updateMenuItem(editingItem.id, payload);
        toast.success('Menu item updated');
      } else {
        await vendorsAPI.addMenuItem(payload);
        toast.success('Menu item added');
      }
      resetForm();
      loadMenu(); // Reload menu to show new item
    } catch (err) {
      toast.error(err?.error || err?.message || 'Failed to save menu item');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this menu item?')) return;
    try {
      await vendorsAPI.deleteMenuItem(id);
      toast.success('Menu item deleted');
      loadMenu();
    } catch (err) {
      toast.error(err?.error || err?.message || 'Failed to delete');
    }
  };

  const handleToggleAvailability = async (id) => {
    try {
      await vendorsAPI.toggleMenuItemAvailability(id);
      toast.success('Availability updated');
      loadMenu();
    } catch (err) {
      toast.error(err?.error || err?.message || 'Failed to update');
    }
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      category: item.category || '',
      price: item.price?.toString() || '',
      discount_price: item.discount_price?.toString() || '',
      image_url: item.image_url || '',
      preparation_time: item.preparation_time || 15,
      calories: item.calories || 0,
      is_vegetarian: item.is_vegetarian || false,
      is_spicy: item.is_spicy || false,
    });
    setImagePreview(item.image_url || '');
    setShowForm(true);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-end items-center gap-3 flex-wrap">
        <Button
          variant="primary"
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          {showForm ? 'Cancel' : 'Add Item'}
        </Button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g. Appetizers, Main Course"
                required
              />
            </div>
            <Input
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Price (ETB)"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
              <Input
                label="Discount Price (ETB)"
                type="number"
                step="0.01"
                value={formData.discount_price}
                onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
              />
              <Input
                label="Prep Time (min)"
                type="number"
                value={formData.preparation_time}
                onChange={(e) => setFormData({ ...formData, preparation_time: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 dark:text-gray-100 dark:border-gray-800"
              />
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded" />
              )}
            </div>
            <div className="flex items-center space-x-6">
              <label className="flex items-center text-gray-700 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={formData.is_vegetarian}
                  onChange={(e) => setFormData({ ...formData, is_vegetarian: e.target.checked })}
                  className="mr-2 accent-pink-600"
                />
                Vegetarian
              </label>
              <label className="flex items-center text-gray-700 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={formData.is_spicy}
                  onChange={(e) => setFormData({ ...formData, is_spicy: e.target.checked })}
                  className="mr-2 accent-pink-600"
                />
                Spicy
              </label>
            </div>
            <div className="flex space-x-2">
              <Button type="submit" variant="primary">
                {editingItem ? 'Update' : 'Add'} Item
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <div key={item.id} className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden border border-gray-100 dark:border-gray-800">
            {item.image_url && (
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-40 object-cover"
              />
            )}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{item.name}</h3>
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    item.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {item.is_available ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{item.category}</p>
              <div className="flex justify-between items-center mb-3">
                <span className="text-lg font-bold text-pink-600 dark:text-pink-300">
                  ETB {item.price?.toFixed(2)}
                  {item.discount_price && (
                    <span className="text-sm text-gray-500 line-through ml-1">
                      ETB {item.discount_price.toFixed(2)}
                    </span>
                  )}
                </span>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleToggleAvailability(item.id)}
                >
                  {item.is_available ? (
                    <ToggleRight className="w-4 h-4" />
                  ) : (
                    <ToggleLeft className="w-4 h-4" />
                  )}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => startEdit(item)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {menuItems.length === 0 && !showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-12 text-center border border-gray-100 dark:border-gray-800">
          <p className="text-gray-600 dark:text-gray-300">No menu items yet. Add your first item!</p>
        </div>
      )}
    </div>
  );
};

export default VendorMenu;