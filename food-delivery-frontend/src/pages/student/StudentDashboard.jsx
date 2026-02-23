import { Routes, Route } from 'react-router-dom';
import StudentLayout from '../../components/student/StudentLayout';
import StudentHome from './StudentHome';
import StudentOrders from './StudentOrders';
import StudentProfile from './StudentProfile';
import VendorList from './VendorList';
import VendorMenu from './VendorMenu';
import Cart from './Cart';
import Checkout from './Checkout';
import OrderTracking from './OrderTracking';

const StudentDashboard = () => {
  return (
    <StudentLayout>
      <Routes>
        <Route path="/" element={<StudentHome />} />
        <Route path="/vendors" element={<VendorList />} />
        <Route path="/vendors/:id/menu" element={<VendorMenu />} />
        <Route path="/orders" element={<StudentOrders />} />
        <Route path="/orders/:id/track" element={<OrderTracking />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/profile" element={<StudentProfile />} />
      </Routes>
    </StudentLayout>
  );
};

export default StudentDashboard;