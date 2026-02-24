import { useState, useEffect } from 'react';
import { vendorsAPI } from '../../api/vendors';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const VendorEarnings = () => {
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) loadEarnings();
  }, [startDate, endDate]);

  const loadEarnings = async () => {
    try {
      const response = await vendorsAPI.getEarnings(startDate, endDate);
      setEarnings(response.data || response);
    } catch (error) {
      console.error('Failed to load earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const summary = earnings?.summary || {};
  const dailyBreakdown = earnings?.daily_breakdown || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{summary.total_orders || 0}</p>
            </div>
            <BarChart3 className="w-10 h-10 text-pink-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${summary.total_revenue?.toFixed(2) || '0.00'}
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-pink-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Commission</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${summary.total_commission?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Net Earnings</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${summary.total_earnings?.toFixed(2) || '0.00'}
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-pink-600" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-800">
        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Current Balance</p>
        <p className="text-3xl font-bold text-pink-600">
          ${earnings?.current_balance?.toFixed(2) || '0.00'}
        </p>
      </div>

      {dailyBreakdown.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Daily Breakdown</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="earnings" fill="#db2777" name="Earnings" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {dailyBreakdown.length === 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-12 text-center border border-gray-100 dark:border-gray-800">
          <p className="text-gray-600 dark:text-gray-300">No earnings data for this period</p>
        </div>
      )}
    </div>
  );
};

export default VendorEarnings;