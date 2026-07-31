import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { customersAPI } from '../../api/services';
import { LoadingPage, EmptyState, Badge, KPICard } from '../../components/ui/index';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/helpers';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersAPI.getOne(id).then((r) => r.data.data),
  });

  const { data: analytics } = useQuery({
    queryKey: ['customer-analytics', id],
    queryFn: () => customersAPI.getAnalytics(id).then((r) => r.data.data),
  });

  const { data: transactions } = useQuery({
    queryKey: ['customer-transactions', id],
    queryFn: () => customersAPI.getTransactions(id, { limit: 20 }).then((r) => r.data),
  });

  if (isLoading) return <LoadingPage />;
  if (!customer) return <EmptyState title="Customer not found" />;

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-500 hover:text-gray-700 mb-1 flex items-center gap-1"
        >
          ← Back
        </button>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-sm text-gray-500 font-mono">{customer.customer_code}</p>
          </div>
          <Badge status={customer.is_active ? 'active' : 'inactive'} />
        </div>
      </div>

      {/* Analytics KPIs */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <KPICard title="Total Orders" value={analytics.totalOrders || 0} icon="🛒" color="blue" />
          <KPICard title="Total Spent" value={formatCurrency(analytics.totalSpent)} icon="💰" color="green" />
          <KPICard title="Overdue Invoices" value={analytics.overdueInvoices || 0} icon="⚠️" color={analytics.overdueInvoices > 0 ? 'red' : 'blue'} />
        </div>
      )}

      {/* Profile + Balance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-4 sm:p-5">
          <h3 className="font-semibold text-gray-700 mb-3">Contact Information</h3>
          <div className="space-y-2 text-sm">
            {[
              { label: 'Email', value: customer.email || '—' },
              { label: 'Phone', value: customer.phone || '—' },
              { label: 'Address', value: customer.address || '—' },
              { label: 'City', value: customer.city || '—' },
              { label: 'State', value: customer.state || '—' },
              { label: 'Joined', value: formatDate(customer.created_at) },
            ].map((item) => (
              <div key={item.label} className="flex justify-between border-b border-gray-50 pb-1">
                <span className="text-gray-500">{item.label}</span>
                <span className="font-medium text-gray-800 text-right max-w-[60%] break-words">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4 sm:p-5">
          <h3 className="font-semibold text-gray-700 mb-3">Account Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Outstanding Balance</span>
              <span className={`font-bold text-lg ${customer.outstanding_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(customer.outstanding_balance)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Credit Limit</span>
              <span className="font-semibold text-gray-800">{formatCurrency(customer.credit_limit || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      {customer.orders?.length > 0 && (
        <div className="card">
          <div className="p-4 sm:p-5 border-b">
            <h3 className="font-semibold text-gray-800">Recent Orders</h3>
          </div>
          <div className="table-container rounded-none border-0">
            <table className="table">
              <thead>
                <tr><th>Order #</th><th>Total</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {customer.orders.map((o) => (
                  <tr key={o.id}>
                    <td className="font-medium text-primary-600">{o.order_number}</td>
                    <td className="font-medium">{formatCurrency(o.total_amount)}</td>
                    <td><Badge status={o.status} /></td>
                    <td className="text-gray-500">{formatDate(o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="card">
        <div className="p-4 sm:p-5 border-b">
          <h3 className="font-semibold text-gray-800">Transaction History</h3>
        </div>
        {!transactions?.data?.length ? (
          <EmptyState icon="💳" title="No transactions yet" />
        ) : (
          <div className="table-container rounded-none border-0">
            <table className="table">
              <thead>
                <tr><th>Reference</th><th>Type</th><th>Amount</th><th>Method</th><th>Date</th></tr>
              </thead>
              <tbody>
                {transactions.data.map((t) => (
                  <tr key={t.id}>
                    <td className="font-mono text-xs text-gray-500">{t.reference}</td>
                    <td><span className="badge-blue capitalize">{t.type}</span></td>
                    <td className="font-medium text-green-600">{formatCurrency(t.amount)}</td>
                    <td className="text-gray-600 capitalize">{t.payment_method || '—'}</td>
                    <td className="text-gray-500">{formatDateTime(t.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
