import { useState, useEffect } from 'react';

const CART_STORAGE_KEY = 'cart';
const CART_VENDOR_KEY = 'cartVendorId';
const CART_UPDATED_EVENT = 'cart:updated';

export const useCart = () => {
  const [items, setItems] = useState([]);
  const [vendorId, setVendorId] = useState(null);

  const loadFromStorage = () => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      const savedVendorId = localStorage.getItem(CART_VENDOR_KEY);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        setItems(Array.isArray(parsed) ? parsed : []);
      } else {
        setItems([]);
      }
      if (savedVendorId) {
        const parsedVendorId = parseInt(savedVendorId, 10);
        setVendorId(Number.isFinite(parsedVendorId) ? parsedVendorId : null);
      } else {
        setVendorId(null);
      }
    } catch {
      setItems([]);
      setVendorId(null);
    }
  };

  useEffect(() => {
    loadFromStorage();

    const onCartUpdated = () => {
      loadFromStorage();
    };

    const onStorage = (e) => {
      if (!e) return;
      if (e.key === CART_STORAGE_KEY || e.key === CART_VENDOR_KEY) {
        loadFromStorage();
      }
    };

    window.addEventListener(CART_UPDATED_EVENT, onCartUpdated);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, onCartUpdated);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const saveCart = (newItems, newVendorId) => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));
    if (newVendorId) {
      localStorage.setItem(CART_VENDOR_KEY, newVendorId.toString());
      setVendorId(newVendorId);
    } else {
      localStorage.removeItem(CART_VENDOR_KEY);
      setVendorId(null);
    }
    setItems(newItems);

    // Notify other hook instances in the same tab
    window.dispatchEvent(new Event(CART_UPDATED_EVENT));
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
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(CART_VENDOR_KEY);
  };

  const getTotal = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const itemCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  return {
    items,
    vendorId,
    itemCount,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotal,
  };
};