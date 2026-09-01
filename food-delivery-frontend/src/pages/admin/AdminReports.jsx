import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';

const AdminReports = () => {
  const [statusSummary, setStatusSummary] = useState(null);
  const [revenueReport, setRevenueReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');
  const [error, setError] = useState('');

  useEffect(() => {
    loadReports();
  }, [period]);

  const loadReports = async () => {
    setLoading(true);
    setError('');
    try {
      const statusResp = await adminAPI.getStatusSummaryReport(period);
      const statusData = statusResp.data || statusResp;
      setStatusSummary(statusData);

      const startDate = statusData?.period?.start_date;
      const endDate = statusData?.period?.end_date;
      if (startDate && endDate) {
        const revenueResp = await adminAPI.getRevenueReport(startDate, endDate);
        setRevenueReport(revenueResp.data || revenueResp);
      } else {
        setRevenueReport(null);
      }
    } catch (error) {
      console.error('Failed to load report:', error);
      setError(error?.error || error?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const periodMeta = statusSummary?.period;
  const summary = revenueReport?.summary || {};
  const dailyData = revenueReport?.daily_breakdown || revenueReport?.by_day || [];
  const averageOrderValue =
    typeof summary.average_order_value === 'number'
      ? summary.average_order_value
      : (summary.total_orders ? (summary.total_revenue || 0) / summary.total_orders : 0);

  const periodOptions = [
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'yearly', label: 'Yearly' },
  ];

  const prettifyStatus = (value) => {
    if (!value) return '';
    return String(value)
      .split('_')
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
      .join(' ');
  };

  const safeData = (data) => (Array.isArray(data) ? data.filter((d) => d && typeof d.count === 'number') : []);

  const formatNumber = (n) => {
    if (typeof n !== 'number') return '0';
    return n.toLocaleString();
  };

  const basePink = '#db2777';
  const softGray = '#e5e7eb';
  const slate = '#64748b';
  const emerald = '#10b981';
  const sky = '#0ea5e9';
  const amber = '#f59e0b';
  const violet = '#8b5cf6';
  const indigo = '#6366f1';
  const red = '#ef4444';

  const orderStatusColor = (status) => {
    switch (String(status || '')) {
      case 'delivered':
        return emerald;
      case 'pending':
        return amber;
      case 'confirmed':
        return sky;
      case 'preparing':
        return violet;
      case 'ready':
        return indigo;
      case 'picked_up':
        return basePink;
      case 'cancelled':
        return slate;
      case 'rejected':
        return red;
      default:
        return softGray;
    }
  };

  const UsersPieCard = ({ title, data }) => {
    const chartData = safeData(data).map((d) => ({ ...d, status: prettifyStatus(d.status) }));
    const colors = [emerald, softGray];

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        {chartData.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="count" nameKey="status" outerRadius="85%" paddingAngle={2}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [formatNumber(v), n]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No data available.</p>
        )}
      </div>
    );
  };

  const VendorsBarCard = ({ title, data }) => {
    const rows = safeData(data).map((d) => ({ status: prettifyStatus(d.status), count: d.count }));

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        {rows.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} margin={{ left: 8, right: 8 }}>
                <defs>
                  <linearGradient id="vendorsBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={indigo} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={indigo} stopOpacity={0.65} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(v) => [formatNumber(v), 'Vendors']} />
                <Bar dataKey="count" fill="url(#vendorsBar)" name="Vendors" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No data available.</p>
        )}
      </div>
    );
  };

  const RidersLineCard = ({ title, data }) => {
    const rows = safeData(data).map((d) => ({ status: prettifyStatus(d.status), count: d.count }));

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        {rows.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rows} margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(v) => [formatNumber(v), 'Riders']} />
                <Line type="monotone" dataKey="count" stroke={sky} strokeWidth={3} dot={{ r: 5, fill: sky }} name="Riders" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No data available.</p>
        )}
      </div>
    );
  };

  const OrdersStatusCard = ({ title, data }) => {
    const orderFlow = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled', 'rejected'];
    const chartData = safeData(data)
      .slice()
      .sort((a, b) => orderFlow.indexOf(a.status) - orderFlow.indexOf(b.status))
      .map((d) => ({ ...d, statusLabel: prettifyStatus(d.status) }));
    const palette = chartData.map((d) => orderStatusColor(d.status));

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        {chartData.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: 8, right: 8 }}>
                <defs>
                  <linearGradient id="ordersBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={basePink} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={basePink} stopOpacity={0.65} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="statusLabel" interval={0} angle={-15} textAnchor="end" height={70} />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(v) => [formatNumber(v), 'Orders']} />
                <Bar dataKey="count" name="Orders">
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={palette[i] || 'url(#ordersBar)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No data available.</p>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-4">
          <Link to="/admin" className="text-sm font-semibold text-pink-600 dark:text-pink-300 hover:underline">
          Home
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {periodOptions.map((opt) => {
            const active = opt.key === period;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setPeriod(opt.key)}
                  className={
                    active
                      ? 'px-4 py-2 rounded-lg bg-pink-600 dark:bg-pink-500/80 text-white text-sm font-semibold'
                      : 'px-4 py-2 rounded-lg bg-white border text-sm font-semibold text-gray-700 hover:bg-gray-50'
                  }
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="text-sm text-gray-600">
          {periodMeta?.start_date && periodMeta?.end_date
            ? `From ${periodMeta.start_date} to ${periodMeta.end_date}`
            : null}
        </div>
      </div>

      {error ? (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <UsersPieCard title="Users by Status" data={statusSummary?.users_by_status} />
        <VendorsBarCard title="Vendors by Status" data={statusSummary?.vendors_by_status} />
        <RidersLineCard title="Riders by Status" data={statusSummary?.riders_by_status} />
        <OrdersStatusCard title="Orders by Status" data={statusSummary?.orders_by_status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm font-medium text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">
            ${summary.total_revenue?.toFixed(2) || '0.00'}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm font-medium text-gray-600">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900">{summary.total_orders || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm font-medium text-gray-600">Average Order Value</p>
          <p className="text-2xl font-bold text-gray-900">
            ${averageOrderValue?.toFixed(2) || '0.00'}
          </p>
        </div>
      </div>
      {dailyData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Daily Revenue</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <defs>
                  <linearGradient id="revenueBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={basePink} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={basePink} stopOpacity={0.65} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="url(#revenueBar)" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;