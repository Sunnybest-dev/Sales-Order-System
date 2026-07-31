import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend,
} from 'chart.js';
import { reportsAPI } from '../../api/services';
import { LoadingPage, PageHeader, KPICard } from '../../components/ui/index';
import { formatCurrency } from '../../utils/helpers';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const today = new Date().toISOString().split('T')[0];
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  .toISOString()
  .split('T')[0];

const CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'top' } },
  scales: {
    y: { beginAtZero: true, ticks: { font: { size: 11 } } },
    x: { ticks: { font: { size: 11 } } },
  },
};

export default function ReportsPage() {
  const [tab, setTab] = useState('sales');
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['report-sales', from, to],
    queryFn: () => reportsAPI.getSales({ from_date: from, to_date: to }).then((r) => r.data.data),
    enabled: tab === 'sales',
  });

  const { data: plData, isLoading: plLoading } = useQuery({
    queryKey: ['report-pl', from, to],
    queryFn: () => reportsAPI.getProfitLoss({ from_date: from, to_date: to }).then((r) => r.data.data),
    enabled: tab === 'profit',
  });

  const { data: invData, isLoading: invLoading } = useQuery({
    queryKey: ['report-inventory'],
    queryFn: () => reportsAPI.getInventory().then((r) => r.data.data),
    enabled: tab === 'inventory',
  });

  const salesChartData = salesData?.chart
    ? {
        labels: salesData.chart.map((d) => d.period),
        datasets: [
          {
            label: 'Revenue',
            data: salesData.chart.map((d) => parseFloat(d.revenue || 0)),
            backgroundColor: '#2563eb',
            borderRadius: 6,
          },
          {
            label: 'Orders',
            data: salesData.chart.map((d) => parseInt(d.orders || 0)),
            backgroundColor: '#16a34a',
            borderRadius: 6,
          },
        ],
      }
    : null;

  const tabs = [
    { key: 'sales', label: '📊 Sales' },
    { key: 'profit', label: '💰 P&L' },
    { key: 'inventory', label: '📦 Inventory' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader title="Reports & Analytics" subtitle="Business performance insights" />

      <div className="card p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1">
          <label className="label">From Date</label>
          <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="flex-1">
          <label className="label">To Date</label>
          <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-1 border-b border-gray-200 min-w-max">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'sales' && (
        salesLoading ? <LoadingPage /> : salesData && (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <KPICard title="Total Revenue" value={formatCurrency(salesData.summary?.total_revenue)} icon="💰" color="blue" />
              <KPICard title="Total Orders" value={salesData.summary?.total_orders || 0} icon="🛒" color="green" />
              <KPICard title="Avg Order Value" value={formatCurrency(salesData.summary?.avg_order_value)} icon="📊" color="purple" />
            </div>
            {salesChartData && (
              <div className="card p-4 sm:p-5">
                <h3 className="font-semibold text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">Sales Chart</h3>
                <div className="h-56 sm:h-72">
                  <Bar data={salesChartData} options={CHART_OPTIONS} />
                </div>
              </div>
            )}
          </div>
        )
      )}

      {tab === 'profit' && (
        plLoading ? <LoadingPage /> : plData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <KPICard title="Total Revenue" value={formatCurrency(plData.totalRevenue)} icon="💰" color="blue" />
              <KPICard title="Cost of Goods" value={formatCurrency(plData.totalCOGS)} icon="🏭" color="yellow" />
              <KPICard title="Gross Profit" value={formatCurrency(plData.grossProfit)} icon="📈" color="green" />
              <KPICard title="Total Expenses" value={formatCurrency(plData.totalExpenses)} icon="💸" color="red" />
              <KPICard
                title="Net Profit"
                value={formatCurrency(plData.netProfit)}
                icon="🏆"
                color={plData.netProfit >= 0 ? 'green' : 'red'}
              />
              <KPICard title="Gross Margin" value={`${plData.grossMargin}%`} icon="%" color="purple" />
            </div>
            <div className="card p-4 sm:p-5">
              <h3 className="font-semibold text-gray-800 mb-4 text-sm sm:text-base">Profit & Loss Summary</h3>
              <div className="space-y-2 max-w-md">
                {[
                  { label: 'Revenue', value: plData.totalRevenue, color: 'text-blue-600' },
                  { label: '- Cost of Goods Sold', value: -plData.totalCOGS, color: 'text-red-500' },
                  { label: '= Gross Profit', value: plData.grossProfit, color: 'text-green-600', bold: true },
                  { label: '- Operating Expenses', value: -plData.totalExpenses, color: 'text-red-500' },
                  {
                    label: '= Net Profit',
                    value: plData.netProfit,
                    color: plData.netProfit >= 0 ? 'text-green-700' : 'text-red-700',
                    bold: true,
                  },
                ].map((row, i) => (
                  <div key={i} className={`flex justify-between py-2 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                    <span className={`text-sm ${row.bold ? 'font-bold' : 'text-gray-600'}`}>{row.label}</span>
                    <span className={`text-sm font-semibold ${row.color}`}>
                      {formatCurrency(Math.abs(row.value))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      )}

      {tab === 'inventory' && (
        invLoading ? <LoadingPage /> : invData && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <KPICard title="Total Products" value={invData.products?.length || 0} icon="📦" color="blue" />
              <KPICard title="Inventory Value" value={formatCurrency(invData.totalValue)} icon="💰" color="green" />
              <KPICard title="Low Stock Items" value={invData.lowStockCount} icon="⚠️" color="red" />
            </div>
            <div className="card">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Inventory Status</h3>
              </div>
              <div className="hidden sm:block table-container rounded-none border-0">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product</th><th>SKU</th><th>Category</th>
                      <th>Stock</th><th>Min</th><th>Cost</th><th>Value</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invData.products?.map((p) => (
                      <tr key={p.id}>
                        <td className="font-medium text-gray-900">{p.name}</td>
                        <td className="font-mono text-xs text-gray-500">{p.sku}</td>
                        <td className="text-gray-600">{p.category?.name || '—'}</td>
                        <td className={`font-semibold ${p.quantity <= p.min_stock_level ? 'text-red-600' : 'text-gray-800'}`}>
                          {p.quantity}
                        </td>
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
              <div className="sm:hidden divide-y divide-gray-100">
                {invData.products?.map((p) => (
                  <div key={p.id} className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{p.sku}</p>
                      </div>
                      {p.quantity <= p.min_stock_level
                        ? <span className="badge-red">Low</span>
                        : <span className="badge-green">OK</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 text-xs text-gray-600 mt-1">
                      <span>
                        Stock: <strong className={p.quantity <= p.min_stock_level ? 'text-red-600' : ''}>
                          {p.quantity}
                        </strong> / min {p.min_stock_level}
                      </span>
                      <span>Value: {formatCurrency(p.quantity * p.cost_price)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
