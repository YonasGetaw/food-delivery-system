import { useState, useEffect } from 'react';

export const useCart = () => {
  const [items, setItems] = useState([]);
  const [vendorId, setVendorId] = useState(null);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    const savedVendorId = localStorage.getItem('cartVendorId');
    if (savedCart) {
      setItems(JSON.parse(savedCart));
    }
    if (savedVendorId) {
      setVendorId(parseInt(savedVendorId));
    }
  }, []);

  const saveCart = (newItems, newVendorId) => {
    localStorage.setItem('cart', JSON.stringify(newItems));
    if (newVendorId) {
      localStorage.setItem('cartVendorId', newVendorId.toString());
      setVendorId(newVendorId);
    }
    setItems(newItems);
  };

  const addItem = (item) => {
    const existingItem = items.find((i) => i.menuItemId === item.menuItemId);
    
    if (vendorId && vendorId !== item.vendorId) {
      if (window.confirm('Your cart contains items from another vendor. Clear cart and add this item?')) {
        saveCart([item], item.vendorId);
        return;
      }
      return;
    }

    if (existingItem) {
      const updatedItems = items.map((i) =>
        i.menuItemId === item.menuItemId
          ? { ...i, quantity: i.quantity + item.quantity }
          : i
      );
      saveCart(updatedItems, item.vendorId);
    } else {
      saveCart([...items, item], item.vendorId);
    }
  };

  const removeItem = (menuItemId) => {
    const updatedItems = items.filter((i) => i.menuItemId !== menuItemId);
    saveCart(updatedItems, updatedItems.length > 0 ? vendorId : null);
  };

  const updateQuantity = (menuItemId, quantity) => {
    if (quantity <= 0) {
      removeItem(menuItemId);
      return;
    }
    const updatedItems = items.map((i) =>
      i.menuItemId === menuItemId ? { ...i, quantity } : i
    );
    saveCart(updatedItems, vendorId);
  };

  const clearCart = () => {
    saveCart([], null);
    localStorage.removeItem('cart');
    localStorage.removeItem('cartVendorId');
  };

  const getTotal = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  return {
    items,
    vendorId,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotal,
  };
};