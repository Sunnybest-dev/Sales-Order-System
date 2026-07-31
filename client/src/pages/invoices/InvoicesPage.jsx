import { useState } from 'react';
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
    queryFn: () => invoicesAPI.getAll({ page, limit: 20, status }).then((r) => r.data),
  });

  const markPaidMutation = useMutation({
    mutationFn: (id) => invoicesAPI.markPaid(id),
    onSuccess: () => {
      toast.success('Invoice marked as paid');
      qc.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Operation failed'),
  });

  const handleDownload = async (invoice) => {
    try {
      const res = await invoicesAPI.download(invoice.id);
      downloadBlob(res.data, `invoice-${invoice.invoice_number}.pdf`);
    } catch {
      toast.error('Download failed');
    }
  };

  const handleEmail = async (id) => {
    try {
      await invoicesAPI.email(id);
      toast.success('Invoice emailed');
    } catch {
      toast.error('Email failed');
    }
  };

  return (
    <div>
      <PageHeader title="Invoices" subtitle={`${data?.meta?.total || 0} total invoices`} />

      <div className="card">
        <div className="p-3 sm:p-4 border-b overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {['', 'draft', 'sent', 'paid', 'overdue', 'cancelled'].map((s) => (
              <button
                key={s}
                onClick={() => { setStatus(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  status === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <LoadingPage />
        ) : data?.data?.length === 0 ? (
          <EmptyState icon="🧾" title="No invoices found" />
        ) : (
          <>
            <div className="hidden md:block table-container rounded-none border-0">
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice #</th><th>Customer</th><th>Total</th><th>Paid</th>
                    <th>Balance</th><th>Status</th><th>Date</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((inv) => (
                    <tr key={inv.id}>
                      <td className="font-medium text-primary-600">{inv.invoice_number}</td>
                      <td className="text-gray-700">{inv.customer?.name}</td>
                      <td className="font-medium">{formatCurrency(inv.total_amount)}</td>
                      <td className="text-green-600">{formatCurrency(inv.amount_paid)}</td>
                      <td className={inv.balance_due > 0 ? 'text-red-600 font-medium' : 'text-gray-400'}>
                        {formatCurrency(inv.balance_due)}
                      </td>
                      <td><Badge status={inv.status} /></td>
                      <td className="text-gray-500">{formatDate(inv.created_at)}</td>
                      <td>
                        <div className="flex gap-2">
                          <button onClick={() => handleDownload(inv)} className="text-xs text-primary-600 hover:underline">PDF</button>
                          <button onClick={() => handleEmail(inv.id)} className="text-xs text-blue-600 hover:underline">Email</button>
                          {inv.status !== 'paid' && (
                            <button
                              onClick={() => markPaidMutation.mutate(inv.id)}
                              disabled={markPaidMutation.isPending}
                              className="text-xs text-green-600 hover:underline disabled:opacity-50"
                            >
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-gray-100">
              {data.data.map((inv) => (
                <div key={inv.id} className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <p className="font-medium text-primary-600 text-sm">{inv.invoice_number}</p>
                      <p className="text-xs text-gray-500">{inv.customer?.name}</p>
                      <p className="text-xs text-gray-400">{formatDate(inv.created_at)}</p>
                    </div>
                    <Badge status={inv.status} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs my-2">
                    <div>
                      <p className="text-gray-400">Total</p>
                      <p className="font-semibold">{formatCurrency(inv.total_amount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Paid</p>
                      <p className="text-green-600 font-medium">{formatCurrency(inv.amount_paid)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Balance</p>
                      <p className={inv.balance_due > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'}>
                        {formatCurrency(inv.balance_due)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-2">
                    <button onClick={() => handleDownload(inv)} className="text-xs text-primary-600 hover:underline">⬇ PDF</button>
                    <button onClick={() => handleEmail(inv.id)} className="text-xs text-blue-600 hover:underline">✉ Email</button>
                    {inv.status !== 'paid' && (
                      <button
                        onClick={() => markPaidMutation.mutate(inv.id)}
                        disabled={markPaidMutation.isPending}
                        className="text-xs text-green-600 hover:underline disabled:opacity-50"
                      >
                        ✓ Mark Paid
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Pagination meta={data.meta} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
