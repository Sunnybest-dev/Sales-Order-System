import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { dashboardAPI } from '../../api/services';
import { KPICard, LoadingPage, Badge, EmptyState } from '../../components/ui/index';
import { formatCurrency, formatDate } from '../../utils/helpers';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getStats()
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingPage />;
  if (!data) return <EmptyState title="Failed to load dashboard" />;

  const { kpis, recentOrders, topProducts, monthlyRevenue } = data;

  const revenueChartData = {
    labels: monthlyRevenue.map(m => MONTHS[(m.month || 1) - 1]),
    datasets: [{
      label: 'Revenue',
      data: monthlyRevenue.map(m => parseFloat(m.revenue || 0)),
      backgroundColor: 'rgba(37,99,235,0.15)',
      borderColor: '#2563eb',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#2563eb',
    }],
  };

  const topProductsChart = {
    labels: topProducts.map(p => p.product_name?.substring(0, 15) || ''),
    datasets: [{
      label: 'Units Sold',
      data: topProducts.map(p => parseInt(p.total_sold || 0)),
      backgroundColor: ['#2563eb','#16a34a','#d97706','#dc2626','#7c3aed'],
      borderRadius: 6,
    }],
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, grid: { color: '#f3f4f6' } }, x: { grid: { display: false } } },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Welcome back! Here's what's happening today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard title="Total Revenue" value={formatCurrency(kpis.totalRevenue)} icon="💰" color="blue" subtitle="All time" />
        <KPICard title="This Month" value={formatCurrency(kpis.monthRevenue)} icon="📅" color="green" subtitle="Monthly revenue" />
        <KPICard title="Total Orders" value={kpis.totalOrders.toLocaleString()} icon="🛒" color="purple" subtitle={`${kpis.pendingOrders} pending`} />
        <KPICard title="Customers" value={kpis.totalCustomers.toLocaleString()} icon="👥" color="yellow" subtitle="Active customers" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard title="Today's Revenue" value={formatCurrency(kpis.todayRevenue)} icon="☀️" color="yellow" />
        <KPICard title="Products" value={kpis.totalProducts.toLocaleString()} icon="📦" color="blue" />
        <KPICard title="Low Stock Items" value={kpis.lowStockCount} icon="⚠️" color="red" subtitle="Need restocking" />
        <KPICard title="Monthly Profit" value={formatCurrency(kpis.monthProfit)} icon="📈" color="green" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="card p-5 xl:col-span-2">
          <h3 className="font-semibold text-gray-800 mb-4">Revenue Trend</h3>
          <div className="h-64">
            <Line data={revenueChartData} options={chartOptions} />
          </div>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Top Products</h3>
          <div className="h-64">
            {topProducts.length > 0
              ? <Bar data={topProductsChart} options={chartOptions} />
              : <EmptyState icon="📦" title="No sales data" />}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-semibold text-gray-800">Recent Orders</h3>
          <Link to="/orders" className="text-sm text-primary-600 hover:underline">View all →</Link>
        </div>
        {recentOrders.length === 0 ? (
          <EmptyState icon="🛒" title="No orders yet" />
        ) : (
          <div className="table-container rounded-none border-0">
            <table className="table">
              <thead><tr>
                <th>Order #</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th>
              </tr></thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id}>
                    <td><Link to={`/orders/${order.id}`} className="text-primary-600 hover:underline font-medium">{order.order_number}</Link></td>
                    <td className="text-gray-700">{order.customer?.name}</td>
                    <td className="font-medium">{formatCurrency(order.total_amount)}</td>
                    <td><Badge status={order.status} /></td>
                    <td className="text-gray-500">{formatDate(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Low Stock Alert */}
      {kpis.lowStockCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <p className="font-semibold text-red-800">{kpis.lowStockCount} product(s) are running low on stock</p>
            <p className="text-sm text-red-600">Restock soon to avoid stockouts</p>
          </div>
          <Link to="/products?low_stock=true" className="btn-danger text-sm px-4 py-2 rounded-lg">View Products</Link>
        </div>
      )}
    </div>
  );
}
