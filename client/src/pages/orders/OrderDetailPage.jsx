import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ordersAPI, invoicesAPI } from '../../api/services';
import { Button, Badge, LoadingPage, EmptyState, Select } from '../../components/ui/index';
import { formatCurrency, formatDateTime, downloadBlob } from '../../utils/helpers';
import useAuthStore from '../../store/authStore';

const STATUS_FLOW = ['pending', 'confirmed', 'paid', 'delivered'];

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [newStatus, setNewStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersAPI.getOne(id).then((r) => r.data.data),
  });

  const cancelMutation = useMutation({
    mutationFn: () => ordersAPI.cancel(id),
    onSuccess: () => {
      toast.success('Order cancelled');
      qc.invalidateQueries({ queryKey: ['order', id] });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to cancel order'),
  });

  const statusMutation = useMutation({
    mutationFn: (status) => ordersAPI.updateStatus(id, status),
    onSuccess: () => {
      toast.success('Order status updated');
      qc.invalidateQueries({ queryKey: ['order', id] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      setNewStatus('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update status'),
  });

  const downloadInvoice = async () => {
    if (!data?.invoice?.id) return;
    try {
      const res = await invoicesAPI.download(data.invoice.id);
      downloadBlob(res.data, `invoice-${data.invoice.invoice_number}.pdf`);
    } catch { toast.error('Download failed'); }
  };

  const emailInvoice = async () => {
    if (!data?.invoice?.id) return;
    try {
      await invoicesAPI.email(data.invoice.id);
      toast.success('Invoice emailed to customer');
    } catch { toast.error('Email failed'); }
  };

  if (isLoading) return <LoadingPage />;
  if (!data) return <EmptyState title="Order not found" />;

  const canUpdateStatus = ['super_admin', 'manager', 'accountant'].includes(user?.role);
  const canCancel = ['super_admin', 'manager'].includes(user?.role);
  const availableStatuses = STATUS_FLOW.filter((s) => s !== data.status);

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-gray-500 hover:text-gray-700 mb-1 flex items-center gap-1"
          >
            ← Back
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{data.order_number}</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            {formatDateTime(data.created_at)} · by {data.creator?.name}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Badge status={data.status} />
          {data.invoice && (
            <>
              <Button variant="secondary" size="sm" onClick={downloadInvoice}>⬇ PDF</Button>
              <Button variant="secondary" size="sm" onClick={emailInvoice}>✉ Email</Button>
            </>
          )}
          {canUpdateStatus && !['cancelled', 'delivered'].includes(data.status) && (
            <div className="flex gap-2 items-center">
              <select
                className="input text-sm py-1.5 w-36"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="">Update status...</option>
                {availableStatuses.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              {newStatus && (
                <Button
                  size="sm"
                  onClick={() => statusMutation.mutate(newStatus)}
                  loading={statusMutation.isPending}
                >
                  Apply
                </Button>
              )}
            </div>
          )}
          {canCancel && !['cancelled', 'delivered'].includes(data.status) && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => cancelMutation.mutate()}
              loading={cancelMutation.isPending}
            >
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-4 sm:p-5">
          <h3 className="font-semibold text-gray-700 mb-3 text-sm sm:text-base">Customer</h3>
          <p className="font-medium text-gray-900">{data.customer?.name}</p>
          <p className="text-sm text-gray-500">{data.customer?.email}</p>
          <p className="text-sm text-gray-500">{data.customer?.phone}</p>
          <p className="text-sm text-gray-500">{data.customer?.address}</p>
          <Link to={`/customers/${data.customer?.id}`} className="text-xs text-primary-600 hover:underline mt-2 block">
            View customer profile →
          </Link>
        </div>

        <div className="card p-4 sm:p-5">
          <h3 className="font-semibold text-gray-700 mb-3 text-sm sm:text-base">Invoice</h3>
          {data.invoice ? (
            <>
              <p className="font-medium text-gray-900">{data.invoice.invoice_number}</p>
              <div className="mt-2 space-y-1.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Status</span>
                  <Badge status={data.invoice.status} />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total</span>
                  <span className="font-medium">{formatCurrency(data.invoice.total_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Paid</span>
                  <span className="text-green-600">{formatCurrency(data.invoice.amount_paid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Balance</span>
                  <span className={data.invoice.balance_due > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'}>
                    {formatCurrency(data.invoice.balance_due)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400">No invoice generated</p>
          )}
        </div>
      </div>

      <div className="card">
        <div className="p-4 sm:p-5 border-b">
          <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Order Items</h3>
        </div>
        <div className="table-container rounded-none border-0">
          <table className="table">
            <thead>
              <tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
            </thead>
            <tbody>
              {data.items?.map((item) => (
                <tr key={item.id}>
                  <td className="font-medium text-gray-900">{item.product_name}</td>
                  <td className="text-center">{item.quantity}</td>
                  <td>{formatCurrency(item.unit_price)}</td>
                  <td className="font-medium">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 sm:p-5 border-t">
          <div className="max-w-xs ml-auto space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>{formatCurrency(data.subtotal)}</span>
            </div>
            {data.discount_amount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Discount</span>
                <span className="text-red-500">-{formatCurrency(data.discount_amount)}</span>
              </div>
            )}
            {data.tax_amount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Tax ({data.tax_rate}%)</span>
                <span>{formatCurrency(data.tax_amount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t pt-2">
              <span>Total</span>
              <span>{formatCurrency(data.total_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount Paid</span>
              <span className="text-green-600">{formatCurrency(data.amount_paid)}</span>
            </div>
            {data.balance_due > 0 && (
              <div className="flex justify-between font-semibold text-red-600">
                <span>Balance Due</span>
                <span>{formatCurrency(data.balance_due)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {data.notes && (
        <div className="card p-4 sm:p-5">
          <h3 className="font-semibold text-gray-700 mb-2 text-sm sm:text-base">Notes</h3>
          <p className="text-sm text-gray-600">{data.notes}</p>
        </div>
      )}
    </div>
  );
}
