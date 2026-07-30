import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { customersAPI } from '../../api/services';
import {
  Button, Input, Textarea, Modal, Badge, Pagination,
  EmptyState, LoadingPage, PageHeader, ConfirmDialog,
} from '../../components/ui/index';
import { formatDate, formatCurrency } from '../../utils/helpers';

function CustomerForm({ customer, onClose }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: customer || {} });
  const mutation = useMutation({
    mutationFn: (data) => customer ? customersAPI.update(customer.id, data) : customersAPI.create(data),
    onSuccess: () => {
      toast.success(customer ? 'Customer updated' : 'Customer created');
      qc.invalidateQueries(['customers']);
      onClose();
    },
  });
  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Full Name *" error={errors.name?.message} {...register('name', { required: 'Required' })} />
        <Input label="Phone" {...register('phone')} />
      </div>
      <Input label="Email" type="email" {...register('email')} />
      <Textarea label="Address" rows={2} {...register('address')} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="City" {...register('city')} />
        <Input label="State" {...register('state')} />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={mutation.isPending}>{customer ? 'Update' : 'Create'} Customer</Button>
      </div>
    </form>
  );
}

export default function CustomersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search],
    queryFn: () => customersAPI.getAll({ page, limit: 20, search }).then(r => r.data),
    keepPreviousData: true,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => customersAPI.delete(id),
    onSuccess: () => {
      toast.success('Customer deactivated');
      qc.invalidateQueries(['customers']);
      setDeleteTarget(null);
    },
  });

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle={`${data?.meta?.total || 0} total customers`}
        actions={<Button onClick={() => setModal('create')}>+ Add Customer</Button>}
      />

      <div className="card">
        <div className="p-3 sm:p-4 border-b">
          <input
            className="input max-w-xs"
            placeholder="Search customers..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {isLoading ? <LoadingPage /> : data?.data?.length === 0 ? (
          <EmptyState icon="👥" title="No customers found" description="Add your first customer to get started" />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block table-container rounded-none border-0">
              <table className="table">
                <thead><tr>
                  <th>Code</th><th>Name</th><th>Phone</th><th>Email</th>
                  <th>Balance</th><th>Joined</th><th>Status</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {data.data.map(c => (
                    <tr key={c.id}>
                      <td className="font-mono text-xs text-gray-500">{c.customer_code}</td>
                      <td className="font-medium text-gray-900">{c.name}</td>
                      <td className="text-gray-600">{c.phone || '—'}</td>
                      <td className="text-gray-600 max-w-[160px] truncate">{c.email || '—'}</td>
                      <td className={`font-medium ${c.outstanding_balance > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                        {formatCurrency(c.outstanding_balance)}
                      </td>
                      <td className="text-gray-500">{formatDate(c.created_at)}</td>
                      <td><Badge status={c.is_active ? 'active' : 'inactive'} /></td>
                      <td>
                        <div className="flex gap-2">
                          <button onClick={() => setModal(c)} className="text-xs text-primary-600 hover:underline">Edit</button>
                          <button onClick={() => setDeleteTarget(c)} className="text-xs text-red-500 hover:underline">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {data.data.map(c => (
                <div key={c.id} className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{c.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{c.customer_code}</p>
                    </div>
                    <Badge status={c.is_active ? 'active' : 'inactive'} />
                  </div>
                  <div className="text-xs text-gray-500 space-y-0.5 mb-2">
                    {c.phone && <p>📞 {c.phone}</p>}
                    {c.email && <p>✉️ {c.email}</p>}
                    {c.outstanding_balance > 0 && (
                      <p className="text-red-600 font-medium">Balance: {formatCurrency(c.outstanding_balance)}</p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setModal(c)} className="text-xs text-primary-600 hover:underline">Edit</button>
                    <button onClick={() => setDeleteTarget(c)} className="text-xs text-red-500 hover:underline">Deactivate</button>
                  </div>
                </div>
              ))}
            </div>

            <Pagination meta={data.meta} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Add Customer' : 'Edit Customer'} size="lg">
        <CustomerForm customer={modal !== 'create' ? modal : null} onClose={() => setModal(null)} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?.id)}
        loading={deleteMutation.isPending}
        title="Deactivate Customer"
        message={`Are you sure you want to deactivate ${deleteTarget?.name}?`}
      />
    </div>
  );
}
