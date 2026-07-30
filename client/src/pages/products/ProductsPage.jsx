import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { productsAPI } from '../../api/services';
import {
  Button, Input, Select, Modal, Badge, Pagination,
  EmptyState, LoadingPage, PageHeader, ConfirmDialog,
} from '../../components/ui/index';
import { formatCurrency } from '../../utils/helpers';

function ProductForm({ product, categories, onClose }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: product || { min_stock_level: 10 },
  });
  const mutation = useMutation({
    mutationFn: (data) => product ? productsAPI.update(product.id, data) : productsAPI.create(data),
    onSuccess: () => {
      toast.success(product ? 'Product updated' : 'Product created');
      qc.invalidateQueries(['products']);
      onClose();
    },
  });
  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Product Name *" error={errors.name?.message} {...register('name', { required: 'Required' })} />
        <Input label="SKU *" error={errors.sku?.message} {...register('sku', { required: 'Required' })} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select label="Category" {...register('category_id')}>
          <option value="">Select category</option>
          {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Input label="Supplier" {...register('supplier')} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input label="Cost Price *" type="number" step="0.01" error={errors.cost_price?.message} {...register('cost_price', { required: 'Required' })} />
        <Input label="Selling Price *" type="number" step="0.01" error={errors.selling_price?.message} {...register('selling_price', { required: 'Required' })} />
        <Input label="Quantity" type="number" {...register('quantity')} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Min Stock Level" type="number" {...register('min_stock_level')} />
        <Input label="Unit" placeholder="piece, kg, litre..." {...register('unit')} />
      </div>
      <Input label="Barcode" {...register('barcode')} />
      <div className="flex gap-3 justify-end pt-2">
        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={mutation.isPending}>{product ? 'Update' : 'Create'} Product</Button>
      </div>
    </form>
  );
}

function StockAdjustModal({ product, onClose }) {
  const qc = useQueryClient();
  const { register, handleSubmit } = useForm({ defaultValues: { type: 'restock', quantity_change: 1 } });
  const mutation = useMutation({
    mutationFn: (data) => productsAPI.adjustStock(product.id, data),
    onSuccess: () => { toast.success('Stock adjusted'); qc.invalidateQueries(['products']); onClose(); },
  });
  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
      <p className="text-sm text-gray-600">Current stock: <strong>{product.quantity} {product.unit}</strong></p>
      <Select label="Adjustment Type" {...register('type')}>
        <option value="restock">Restock (+)</option>
        <option value="adjustment">Adjustment</option>
        <option value="damage">Damage (-)</option>
        <option value="return">Return (+)</option>
      </Select>
      <Input label="Quantity Change" type="number" {...register('quantity_change', { required: true, valueAsNumber: true })} />
      <Input label="Notes" {...register('notes')} />
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={mutation.isPending}>Adjust Stock</Button>
      </div>
    </form>
  );
}

export default function ProductsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [stockModal, setStockModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search],
    queryFn: () => productsAPI.getAll({ page, limit: 20, search }).then(r => r.data),
    keepPreviousData: true,
  });

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsAPI.getCategories().then(r => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => productsAPI.delete(id),
    onSuccess: () => {
      toast.success('Product deactivated');
      qc.invalidateQueries(['products']);
      setDeleteTarget(null);
    },
  });

  return (
    <div>
      <PageHeader
        title="Products & Inventory"
        subtitle={`${data?.meta?.total || 0} products`}
        actions={<Button onClick={() => setModal('create')}>+ Add Product</Button>}
      />

      <div className="card">
        <div className="p-3 sm:p-4 border-b">
          <input
            className="input max-w-xs"
            placeholder="Search products..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {isLoading ? <LoadingPage /> : data?.data?.length === 0 ? (
          <EmptyState icon="📦" title="No products found" />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block table-container rounded-none border-0">
              <table className="table">
                <thead><tr>
                  <th>Code</th><th>Name</th><th>SKU</th><th>Category</th>
                  <th>Cost</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {data.data.map(p => (
                    <tr key={p.id}>
                      <td className="font-mono text-xs text-gray-500">{p.product_code}</td>
                      <td className="font-medium text-gray-900">{p.name}</td>
                      <td className="font-mono text-xs text-gray-500">{p.sku}</td>
                      <td className="text-gray-600">{p.category?.name || '—'}</td>
                      <td>{formatCurrency(p.cost_price)}</td>
                      <td className="font-medium">{formatCurrency(p.selling_price)}</td>
                      <td>
                        <span className={`font-semibold ${p.quantity <= p.min_stock_level ? 'text-red-600' : 'text-gray-800'}`}>
                          {p.quantity} {p.unit}
                          {p.quantity <= p.min_stock_level && <span className="ml-1 text-xs">⚠️</span>}
                        </span>
                      </td>
                      <td><Badge status={p.is_active ? 'active' : 'inactive'} /></td>
                      <td>
                        <div className="flex gap-2">
                          <button onClick={() => setStockModal(p)} className="text-xs text-green-600 hover:underline">Stock</button>
                          <button onClick={() => setModal(p)} className="text-xs text-primary-600 hover:underline">Edit</button>
                          <button onClick={() => setDeleteTarget(p)} className="text-xs text-red-500 hover:underline">Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {data.data.map(p => (
                <div key={p.id} className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{p.sku}</p>
                    </div>
                    <Badge status={p.is_active ? 'active' : 'inactive'} />
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 text-xs text-gray-600 mb-2">
                    <span>Cost: {formatCurrency(p.cost_price)}</span>
                    <span>Price: <strong>{formatCurrency(p.selling_price)}</strong></span>
                    <span className={p.quantity <= p.min_stock_level ? 'text-red-600 font-semibold' : ''}>
                      Stock: {p.quantity} {p.unit} {p.quantity <= p.min_stock_level ? '⚠️' : ''}
                    </span>
                    <span>{p.category?.name || '—'}</span>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setStockModal(p)} className="text-xs text-green-600 hover:underline">Adjust Stock</button>
                    <button onClick={() => setModal(p)} className="text-xs text-primary-600 hover:underline">Edit</button>
                    <button onClick={() => setDeleteTarget(p)} className="text-xs text-red-500 hover:underline">Deactivate</button>
                  </div>
                </div>
              ))}
            </div>

            <Pagination meta={data.meta} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Add Product' : 'Edit Product'} size="lg">
        <ProductForm product={modal !== 'create' ? modal : null} categories={catData} onClose={() => setModal(null)} />
      </Modal>

      <Modal open={!!stockModal} onClose={() => setStockModal(null)} title="Adjust Stock" size="sm">
        {stockModal && <StockAdjustModal product={stockModal} onClose={() => setStockModal(null)} />}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?.id)}
        loading={deleteMutation.isPending}
        title="Deactivate Product"
        message={`Deactivate "${deleteTarget?.name}"?`}
      />
    </div>
  );
}
