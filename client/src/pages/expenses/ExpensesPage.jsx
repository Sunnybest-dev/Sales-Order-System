import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { expensesAPI } from '../../api/services';
import {
  Button, Input, Select, Modal, Pagination,
  EmptyState, LoadingPage, PageHeader, ConfirmDialog,
} from '../../components/ui/index';
import { formatCurrency, formatDate } from '../../utils/helpers';

const EXPENSE_CATEGORIES = ['Rent', 'Utilities', 'Payroll', 'Transport', 'Marketing', 'Supplies', 'Maintenance', 'Other'];

function ExpenseForm({ expense, onClose }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: expense || { date: new Date().toISOString().split('T')[0] },
  });
  const mutation = useMutation({
    mutationFn: (data) => expense ? expensesAPI.update(expense.id, data) : expensesAPI.create(data),
    onSuccess: () => {
      toast.success(expense ? 'Expense updated' : 'Expense recorded');
      qc.invalidateQueries({ queryKey: ['expenses'] });
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Operation failed'),
  });
  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <Input
        label="Title *"
        error={errors.title?.message}
        {...register('title', { required: 'Required' })}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select label="Category" {...register('category')}>
          <option value="">Select category</option>
          {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Input
          label="Amount *" type="number" step="0.01"
          error={errors.amount?.message}
          {...register('amount', { required: 'Required', valueAsNumber: true })}
        />
      </div>
      <Input
        label="Date *" type="date"
        error={errors.date?.message}
        {...register('date', { required: 'Required' })}
      />
      <Input label="Description" {...register('description')} />
      <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
        <Button variant="secondary" type="button" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
        <Button type="submit" loading={mutation.isPending} className="w-full sm:w-auto">
          {expense ? 'Update' : 'Record'} Expense
        </Button>
      </div>
    </form>
  );
}

export default function ExpensesPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', page],
    queryFn: () => expensesAPI.getAll({ page, limit: 20 }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => expensesAPI.delete(id),
    onSuccess: () => {
      toast.success('Expense deleted');
      qc.invalidateQueries({ queryKey: ['expenses'] });
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Operation failed'),
  });

  const total = data?.data?.reduce((s, e) => s + parseFloat(e.amount || 0), 0) || 0;

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle="Track business expenses"
        actions={<Button onClick={() => setModal('create')}>+ Record Expense</Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="card p-4 sm:p-5">
          <p className="text-sm text-gray-500">Total Expenses (Page)</p>
          <p className="text-xl sm:text-2xl font-bold text-red-600 mt-1">{formatCurrency(total)}</p>
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <LoadingPage />
        ) : data?.data?.length === 0 ? (
          <EmptyState icon="💸" title="No expenses recorded" />
        ) : (
          <>
            <div className="hidden sm:block table-container rounded-none border-0">
              <table className="table">
                <thead>
                  <tr><th>Title</th><th>Category</th><th>Amount</th><th>Date</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {data.data.map((e) => (
                    <tr key={e.id}>
                      <td className="font-medium text-gray-900">{e.title}</td>
                      <td><span className="badge-blue">{e.category || '—'}</span></td>
                      <td className="font-medium text-red-600">{formatCurrency(e.amount)}</td>
                      <td className="text-gray-500">{formatDate(e.date)}</td>
                      <td>
                        <div className="flex gap-2">
                          <button onClick={() => setModal(e)} className="text-xs text-primary-600 hover:underline">Edit</button>
                          <button onClick={() => setDeleteTarget(e)} className="text-xs text-red-500 hover:underline">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sm:hidden divide-y divide-gray-100">
              {data.data.map((e) => (
                <div key={e.id} className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{e.title}</p>
                      <p className="text-xs text-gray-400">{formatDate(e.date)}</p>
                    </div>
                    <p className="font-semibold text-red-600 text-sm shrink-0">{formatCurrency(e.amount)}</p>
                  </div>
                  {e.category && <span className="badge-blue text-xs">{e.category}</span>}
                  <div className="flex gap-3 mt-2">
                    <button onClick={() => setModal(e)} className="text-xs text-primary-600 hover:underline">Edit</button>
                    <button onClick={() => setDeleteTarget(e)} className="text-xs text-red-500 hover:underline">Delete</button>
                  </div>
                </div>
              ))}
            </div>

            <Pagination meta={data.meta} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'create' ? 'Record Expense' : 'Edit Expense'}
        size="md"
      >
        <ExpenseForm expense={modal !== 'create' ? modal : null} onClose={() => setModal(null)} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?.id)}
        loading={deleteMutation.isPending}
        title="Delete Expense"
        message={`Delete "${deleteTarget?.title}"?`}
      />
    </div>
  );
}
