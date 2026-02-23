import { Routes, Route } from 'react-router-dom';
import VendorLayout from "../../components/vendors/VendorLayout";
import VendorHome from './VendorHome';
import VendorMenu from './VendorMenu';
import VendorOrders from './VendorOrders';
import VendorEarnings from './VendorEarnings';
import VendorProfile from './VendorProfile';

const VendorDashboard = () => {
  return (
    <VendorLayout>
      <Routes>
        <Route path="/" element={<VendorHome />} />
        <Route path="/menu" element={<VendorMenu />} />
        <Route path="/orders" element={<VendorOrders />} />
        <Route path="/earnings" element={<VendorEarnings />} />
        <Route path="/profile" element={<VendorProfile />} />
      </Routes>
    </VendorLayout>
  );
};

export default VendorDashboard;