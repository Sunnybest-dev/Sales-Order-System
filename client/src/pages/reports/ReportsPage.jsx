import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { reportsAPI } from '../../api/services';
import { LoadingPage, PageHeader, KPICard } from '../../components/ui/index';
import { formatCurrency } from '../../utils/helpers';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const today = new Date().toISOString().split('T')[0];
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

export default function ReportsPage() {
  const [tab, setTab] = useState('sales');
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['report-sales', from, to],
    queryFn: () => reportsAPI.getSales({ from_date: from, to_date: to }).then(r => r.data.data),
    enabled: tab === 'sales',
  });

  const { data: plData, isLoading: plLoading } = useQuery({
    queryKey: ['report-pl', from, to],
    queryFn: () => reportsAPI.getProfitLoss({ from_date: from, to_date: to }).then(r => r.data.data),
    enabled: tab === 'profit',
  });

  const { data: invData, isLoading: invLoading } = useQuery({
    queryKey: ['report-inventory'],
    queryFn: () => reportsAPI.getInventory().then(r => r.data.data),
    enabled: tab === 'inventory',
  });

  const salesChartData = salesData ? {
    labels: salesData.chart.map(d => d.period),
    datasets: [
      { label: 'Revenue', data: salesData.chart.map(d => parseFloat(d.revenue || 0)), backgroundColor: '#2563eb', borderRadius: 6 },
      { label: 'Orders', data: salesData.chart.map(d => parseInt(d.orders || 0)), backgroundColor: '#16a34a', borderRadius: 6 },
    ],
  } : null;

  const tabs = [
    { key: 'sales', label: '📊 Sales Report' },
    { key: 'profit', label: '💰 Profit & Loss' },
    { key: 'inventory', label: '📦 Inventory Report' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Analytics" subtitle="Business performance insights" />

      {/* Date Filter */}
      <div className="card p-4 flex gap-4 items-end flex-wrap">
        <div>
          <label className="label">From Date</label>
          <input type="date" className="input w-40" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="label">To Date</label>
          <input type="date" className="input w-40" value={to} onChange={e => setTo(e.target.value)} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Sales Report */}
      {tab === 'sales' && (
        salesLoading ? <LoadingPage /> : salesData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <KPICard title="Total Revenue" value={formatCurrency(salesData.summary?.total_revenue)} icon="💰" color="blue" />
              <KPICard title="Total Orders" value={salesData.summary?.total_orders || 0} icon="🛒" color="green" />
              <KPICard title="Avg Order Value" value={formatCurrency(salesData.summary?.avg_order_value)} icon="📊" color="purple" />
            </div>
            {salesChartData && (
              <div className="card p-5">
                <h3 className="font-semibold text-gray-800 mb-4">Sales Chart</h3>
                <div className="h-72">
                  <Bar data={salesChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } }} />
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* Profit & Loss */}
      {tab === 'profit' && (
        plLoading ? <LoadingPage /> : plData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <KPICard title="Total Revenue" value={formatCurrency(plData.totalRevenue)} icon="💰" color="blue" />
              <KPICard title="Cost of Goods" value={formatCurrency(plData.totalCOGS)} icon="🏭" color="yellow" />
              <KPICard title="Gross Profit" value={formatCurrency(plData.grossProfit)} icon="📈" color="green" />
              <KPICard title="Total Expenses" value={formatCurrency(plData.totalExpenses)} icon="💸" color="red" />
              <KPICard title="Net Profit" value={formatCurrency(plData.netProfit)} icon="🏆" color={plData.netProfit >= 0 ? 'green' : 'red'} />
              <KPICard title="Gross Margin" value={`${plData.grossMargin}%`} icon="%" color="purple" />
            </div>
            <div className="card p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Profit & Loss Summary</h3>
              <div className="space-y-3 max-w-md">
                {[
                  { label: 'Revenue', value: plData.totalRevenue, color: 'text-blue-600' },
                  { label: '- Cost of Goods Sold', value: -plData.totalCOGS, color: 'text-red-500' },
                  { label: '= Gross Profit', value: plData.grossProfit, color: 'text-green-600', bold: true },
                  { label: '- Operating Expenses', value: -plData.totalExpenses, color: 'text-red-500' },
                  { label: '= Net Profit', value: plData.netProfit, color: plData.netProfit >= 0 ? 'text-green-700' : 'text-red-700', bold: true },
                ].map((row, i) => (
                  <div key={i} className={`flex justify-between py-2 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                    <span className={`text-sm ${row.bold ? 'font-bold' : 'text-gray-600'}`}>{row.label}</span>
                    <span className={`text-sm font-semibold ${row.color}`}>{formatCurrency(Math.abs(row.value))}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      )}

      {/* Inventory Report */}
      {tab === 'inventory' && (
        invLoading ? <LoadingPage /> : invData && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <KPICard title="Total Products" value={invData.products?.length || 0} icon="📦" color="blue" />
              <KPICard title="Inventory Value" value={formatCurrency(invData.totalValue)} icon="💰" color="green" />
              <KPICard title="Low Stock Items" value={invData.lowStockCount} icon="⚠️" color="red" />
            </div>
            <div className="card">
              <div className="p-4 border-b"><h3 className="font-semibold text-gray-800">Inventory Status</h3></div>
              <div className="table-container rounded-none border-0">
                <table className="table">
                  <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Stock</th><th>Min Level</th><th>Cost Price</th><th>Value</th><th>Status</th></tr></thead>
                  <tbody>
                    {invData.products?.map(p => (
                      <tr key={p.id}>
                        <td className="font-medium text-gray-900">{p.name}</td>
                        <td className="font-mono text-xs text-gray-500">{p.sku}</td>
                        <td className="text-gray-600">{p.category?.name || '—'}</td>
                        <td className={`font-semibold ${p.quantity <= p.min_stock_level ? 'text-red-600' : 'text-gray-800'}`}>{p.quantity}</td>
                        <td className="text-gray-500">{p.min_stock_level}</td>
                        <td>{formatCurrency(p.cost_price)}</td>
                        <td className="font-medium">{formatCurrency(p.quantity * p.cost_price)}</td>
                        <td>
                          {p.quantity <= p.min_stock_level
                            ? <span className="badge-red">Low Stock</span>
                            : <span className="badge-green">OK</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
