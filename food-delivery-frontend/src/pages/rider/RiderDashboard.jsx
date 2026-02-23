import { Routes, Route } from 'react-router-dom';
import RiderLayout from "../../components/riders/RiderLayout";
import RiderHome from './RiderHome';
import RiderOrders from './RiderOrders';
import RiderEarnings from './RiderEarnings';
import RiderProfile from './RiderProfile';

const RiderDashboard = () => {
  return (
    <RiderLayout>
      <Routes>
        <Route path="/" element={<RiderHome />} />
        <Route path="/orders" element={<RiderOrders />} />
        <Route path="/earnings" element={<RiderEarnings />} />
        <Route path="/profile" element={<RiderProfile />} />
      </Routes>
    </RiderLayout>
  );
};

export default RiderDashboard;