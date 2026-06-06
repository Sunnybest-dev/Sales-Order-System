import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { invoicesAPI } from '../../api/services';
import { Button, Badge, Pagination, EmptyState, LoadingPage, PageHeader } from '../../components/ui/index';
import { formatCurrency, formatDate, downloadBlob } from '../../utils/helpers';

export default function InvoicesPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', page, status],
    queryFn: () => invoicesAPI.getAll({ page, limit: 20, status }).then(r => r.data),
    keepPreviousData: true,
  });

  const markPaidMutation = useMutation({
    mutationFn: (id) => invoicesAPI.markPaid(id),
    onSuccess: () => { toast.success('Invoice marked as paid'); qc.invalidateQueries(['invoices']); },
  });

  const handleDownload = async (invoice) => {
    try {
      const res = await invoicesAPI.download(invoice.id);
      downloadBlob(res.data, `invoice-${invoice.invoice_number}.pdf`);
    } catch { toast.error('Download failed'); }
  };

  const handleEmail = async (id) => {
    try {
      await invoicesAPI.email(id);
      toast.success('Invoice emailed');
    } catch { toast.error('Email failed'); }
  };

  return (
    <div>
      <PageHeader title="Invoices" subtitle={`${data?.meta?.total || 0} total invoices`} />

      <div className="card">
        <div className="p-4 border-b flex gap-3 flex-wrap">
          {['', 'draft', 'sent', 'paid', 'overdue', 'cancelled'].map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${status === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>

        {isLoading ? <LoadingPage /> : data?.data?.length === 0 ? (
          <EmptyState icon="🧾" title="No invoices found" />
        ) : (
          <>
            <div className="table-container rounded-none border-0">
              <table className="table">
                <thead><tr>
                  <th>Invoice #</th><th>Customer</th><th>Total</th><th>Paid</th>
                  <th>Balance</th><th>Status</th><th>Date</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {data.data.map(inv => (
                    <tr key={inv.id}>
                      <td className="font-medium text-primary-600">{inv.invoice_number}</td>
                      <td className="text-gray-700">{inv.customer?.name}</td>
                      <td className="font-medium">{formatCurrency(inv.total_amount)}</td>
                      <td className="text-green-600">{formatCurrency(inv.amount_paid)}</td>
                      <td className={inv.balance_due > 0 ? 'text-red-600 font-medium' : 'text-gray-400'}>{formatCurrency(inv.balance_due)}</td>
                      <td><Badge status={inv.status} /></td>
                      <td className="text-gray-500">{formatDate(inv.created_at)}</td>
                      <td>
                        <div className="flex gap-2">
                          <button onClick={() => handleDownload(inv)} className="text-xs text-primary-600 hover:underline">PDF</button>
                          <button onClick={() => handleEmail(inv.id)} className="text-xs text-blue-600 hover:underline">Email</button>
                          {inv.status !== 'paid' && (
                            <button onClick={() => markPaidMutation.mutate(inv.id)} className="text-xs text-green-600 hover:underline">Mark Paid</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination meta={data.meta} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
