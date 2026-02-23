import { Routes, Route } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminHome from './AdminHome';
import AdminUsers from './AdminUsers';
import AdminVendors from './AdminVendors';
import AdminRiders from './AdminRiders';
import AdminOrders from './AdminOrders';
import AdminReports from './AdminReports';
import AdminProfile from './AdminProfile';

const AdminDashboard = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<AdminHome />} />
        <Route path="/users" element={<AdminUsers />} />
        <Route path="/vendors" element={<AdminVendors />} />
        <Route path="/riders" element={<AdminRiders />} />
        <Route path="/orders" element={<AdminOrders />} />
        <Route path="/reports" element={<AdminReports />} />
        <Route path="/profile" element={<AdminProfile />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminDashboard;