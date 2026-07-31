import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ordersAPI, customersAPI, productsAPI } from '../../api/services';
import {
  Button, Input, Select, Modal, Badge, Pagination,
  EmptyState, LoadingPage, PageHeader,
} from '../../components/ui/index';
import { formatCurrency, formatDate } from '../../utils/helpers';

function OrderItemRow({ index, field, fields, remove, products, control, register, setValue }) {
  const unitPrice = useWatch({ control, name: `items.${index}.unit_price` });
  const quantity = useWatch({ control, name: `items.${index}.quantity` });
  const rowTotal = (parseFloat(unitPrice) || 0) * (parseInt(quantity) || 0);

  const handleProductChange = (e) => {
    const product = products?.find((p) => String(p.id) === e.target.value);
    if (product) setValue(`items.${index}.unit_price`, product.selling_price);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3 space-y-2 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-2 sm:items-end">
      <div className="sm:col-span-5">
        <Select
          label={index === 0 ? 'Product' : undefined}
          {...register(`items.${index}.product_id`, { required: true })}
          onChange={handleProductChange}
        >
          <option value="">Select product</option>
          {products?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} (Stock: {p.quantity})
            </option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:contents">
        <div className="sm:col-span-2">
          <Input
            label={index === 0 ? 'Qty' : undefined}
            type="number" min="1" placeholder="Qty"
            {...register(`items.${index}.quantity`, { required: true, min: 1, valueAsNumber: true })}
          />
        </div>
        <div className="sm:col-span-3">
          <Input
            label={index === 0 ? 'Unit Price' : undefined}
            type="number" step="0.01" placeholder="Price"
            {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
          />
        </div>
      </div>
      <div className="flex items-center justify-between sm:col-span-2 sm:pb-2">
        <span className="text-sm font-medium text-gray-700">{formatCurrency(rowTotal)}</span>
        {fields.length > 1 && (
          <button
            type="button"
            onClick={() => remove(index)}
            className="text-red-400 hover:text-red-600 text-xl leading-none ml-2"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

function CreateOrderForm({ onClose }) {
  const navigate = useNavigate();
  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm({
    defaultValues: {
      items: [{ product_id: '', quantity: 1, unit_price: 0 }],
      tax_rate: 7.5,
      discount_value: 0,
      discount_type: 'fixed',
      amount_paid: 0,
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const { data: customers } = useQuery({
    queryKey: ['customers-all'],
    queryFn: () => customersAPI.getAll({ limit: 200 }).then((r) => r.data.data),
  });
  const { data: products } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => productsAPI.getAll({ limit: 200 }).then((r) => r.data.data),
  });

  const watchItems = useWatch({ control, name: 'items' });
  const watchTax = parseFloat(watch('tax_rate') || 0);
  const watchDiscount = parseFloat(watch('discount_value') || 0);
  const watchDiscountType = watch('discount_type');
  const watchPaid = parseFloat(watch('amount_paid') || 0);

  const subtotal = watchItems.reduce(
    (s, i) => s + (parseFloat(i.unit_price || 0) * parseInt(i.quantity || 0)),
    0
  );
  const discountAmt = watchDiscountType === 'percentage' ? (subtotal * watchDiscount) / 100 : watchDiscount;
  const taxAmt = ((subtotal - discountAmt) * watchTax) / 100;
  const total = subtotal - discountAmt + taxAmt;
  const balance = total - watchPaid;

  const mutation = useMutation({
    mutationFn: (data) => ordersAPI.create(data),
    onSuccess: (res) => {
      toast.success('Order created successfully!');
      onClose();
      navigate(`/orders/${res.data.data.id}`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create order'),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Customer *"
          error={errors.customer_id?.message}
          {...register('customer_id', { required: 'Required' })}
        >
          <option value="">Select customer</option>
          {customers?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select label="Payment Method" {...register('payment_method')}>
          <option value="cash">Cash</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="card">Card</option>
          <option value="credit">Credit</option>
          <option value="cheque">Cheque</option>
        </Select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Order Items *</label>
          <button
            type="button"
            onClick={() => append({ product_id: '', quantity: 1, unit_price: 0 })}
            className="text-xs text-primary-600 hover:underline"
          >
            + Add Item
          </button>
        </div>
        <div className="space-y-3">
          {fields.map((field, i) => (
            <OrderItemRow
              key={field.id}
              index={i}
              field={field}
              fields={fields}
              remove={remove}
              products={products}
              control={control}
              register={register}
              setValue={setValue}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Select label="Discount Type" {...register('discount_type')}>
              <option value="fixed">Fixed (₦)</option>
              <option value="percentage">Percentage (%)</option>
            </Select>
            <Input label="Discount" type="number" step="0.01" {...register('discount_value', { valueAsNumber: true })} />
          </div>
          <Input label="Tax Rate (%)" type="number" step="0.01" {...register('tax_rate', { valueAsNumber: true })} />
          <Input label="Amount Paid (₦)" type="number" step="0.01" {...register('amount_paid', { valueAsNumber: true })} />
        </div>

        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Discount</span>
            <span className="text-red-500">-{formatCurrency(discountAmt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Tax ({watchTax}%)</span>
            <span>{formatCurrency(taxAmt)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-bold text-base">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Amount Paid</span>
            <span className="text-green-600">{formatCurrency(watchPaid)}</span>
          </div>
          <div className={`flex justify-between font-semibold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
            <span>Balance Due</span>
            <span>{formatCurrency(balance)}</span>
          </div>
        </div>
      </div>

      <Input label="Notes" {...register('notes')} placeholder="Optional order notes..." />

      <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
        <Button variant="secondary" type="button" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
        <Button type="submit" loading={mutation.isPending} className="w-full sm:w-auto">
          Create Order & Generate Invoice
        </Button>
      </div>
    </form>
  );
}

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, status],
    queryFn: () => ordersAPI.getAll({ page, limit: 20, status }).then((r) => r.data),
  });

  return (
    <div>
      <PageHeader
        title="Sales Orders"
        subtitle={`${data?.meta?.total || 0} total orders`}
        actions={<Button onClick={() => setShowCreate(true)}>+ New Order</Button>}
      />

      <div className="card">
        <div className="p-3 sm:p-4 border-b overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {['', 'pending', 'confirmed', 'paid', 'delivered', 'cancelled'].map((s) => (
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
          <EmptyState icon="🛒" title="No orders found" />
        ) : (
          <>
            <div className="hidden md:block table-container rounded-none border-0">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order #</th><th>Customer</th><th>Total</th>
                    <th>Paid</th><th>Balance</th><th>Status</th><th>Date</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <Link to={`/orders/${o.id}`} className="font-medium text-primary-600 hover:underline">
                          {o.order_number}
                        </Link>
                      </td>
                      <td className="text-gray-700">{o.customer?.name}</td>
                      <td className="font-medium">{formatCurrency(o.total_amount)}</td>
                      <td className="text-green-600">{formatCurrency(o.amount_paid)}</td>
                      <td className={o.balance_due > 0 ? 'text-red-600 font-medium' : 'text-gray-400'}>
                        {formatCurrency(o.balance_due)}
                      </td>
                      <td><Badge status={o.status} /></td>
                      <td className="text-gray-500">{formatDate(o.created_at)}</td>
                      <td>
                        <Link to={`/orders/${o.id}`} className="text-xs text-primary-600 hover:underline">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-gray-100">
              {data.data.map((o) => (
                <Link key={o.id} to={`/orders/${o.id}`} className="block p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <p className="font-medium text-primary-600 text-sm">{o.order_number}</p>
                      <p className="text-xs text-gray-500">{o.customer?.name}</p>
                    </div>
                    <Badge status={o.status} />
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-gray-400">{formatDate(o.created_at)}</span>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">{formatCurrency(o.total_amount)}</span>
                      {o.balance_due > 0 && (
                        <span className="ml-2 text-red-600">Due: {formatCurrency(o.balance_due)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <Pagination meta={data.meta} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Sales Order" size="xl">
        <CreateOrderForm onClose={() => setShowCreate(false)} />
      </Modal>
    </div>
  );
}
