import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { usersAPI, authAPI } from '../../api/services';
import useAuthStore from '../../store/authStore';
import { Button, Input, Select, Modal, Badge, PageHeader } from '../../components/ui/index';
import { formatDate } from '../../utils/helpers';

function AddUserForm({ onClose }) {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const mutation = useMutation({
    mutationFn: (data) => usersAPI.register(data),
    onSuccess: () => { toast.success('User created'); onClose(); },
  });
  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
      <Input label="Full Name *" error={errors.name?.message} {...register('name', { required: 'Required' })} />
      <Input label="Email *" type="email" error={errors.email?.message} {...register('email', { required: 'Required' })} />
      <Input label="Password *" type="password" error={errors.password?.message} {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 chars' } })} />
      <Select label="Role *" {...register('role', { required: 'Required' })}>
        <option value="">Select role</option>
        <option value="manager">Manager</option>
        <option value="accountant">Accountant</option>
        <option value="sales_staff">Sales Staff</option>
      </Select>
      <Input label="Phone" {...register('phone')} />
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={mutation.isPending}>Create User</Button>
      </div>
    </form>
  );
}

function ProfileForm() {
  const { user, setUser } = useAuthStore();
  const { register, handleSubmit } = useForm({ defaultValues: { name: user?.name, phone: user?.phone } });
  const mutation = useMutation({
    mutationFn: (data) => authAPI.updateProfile(data),
    onSuccess: (res) => { setUser(res.data.data); toast.success('Profile updated'); },
  });
  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4 max-w-md">
      <Input label="Full Name" {...register('name')} />
      <Input label="Phone" {...register('phone')} />
      <Button type="submit" loading={mutation.isPending}>Save Changes</Button>
    </form>
  );
}

export default function SettingsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState('profile');
  const [showAddUser, setShowAddUser] = useState(false);

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersAPI.getAll().then(r => r.data.data),
    enabled: tab === 'users',
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) => usersAPI.deactivate(id),
    onSuccess: () => { toast.success('User deactivated'); qc.invalidateQueries(['users']); },
  });

  const tabs = [
    { key: 'profile', label: '👤 My Profile' },
    { key: 'users', label: '👥 User Management', roles: ['super_admin', 'manager'] },
    { key: 'company', label: '🏢 Company Info' },
  ].filter(t => !t.roles || t.roles.includes(user?.role));

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your account and system settings" />

      <div className="flex gap-2 border-b border-gray-200 mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="card p-6 max-w-lg">
          <h3 className="font-semibold text-gray-800 mb-4">Profile Information</h3>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-2xl">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <span className="badge-blue capitalize">{user?.role?.replace('_', ' ')}</span>
            </div>
          </div>
          <ProfileForm />
        </div>
      )}

      {tab === 'users' && (
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b">
            <h3 className="font-semibold text-gray-800">System Users</h3>
            {user?.role === 'super_admin' && <Button onClick={() => setShowAddUser(true)}>+ Add User</Button>}
          </div>
          <div className="table-container rounded-none border-0">
            <table className="table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Last Login</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {users?.map(u => (
                  <tr key={u.id}>
                    <td className="font-medium text-gray-900">{u.name}</td>
                    <td className="text-gray-600">{u.email}</td>
                    <td><span className="badge-blue capitalize">{u.role?.replace('_', ' ')}</span></td>
                    <td className="text-gray-500">{u.last_login ? formatDate(u.last_login) : 'Never'}</td>
                    <td><Badge status={u.is_active ? 'active' : 'inactive'} /></td>
                    <td>
                      {u.id !== user?.id && u.is_active && (
                        <button onClick={() => deactivateMutation.mutate(u.id)} className="text-xs text-red-500 hover:underline">Deactivate</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'company' && (
        <div className="card p-6 max-w-lg">
          <h3 className="font-semibold text-gray-800 mb-4">Company Information</h3>
          <div className="space-y-3 text-sm">
            {[
              { label: 'Company Name', value: import.meta.env.VITE_COMPANY_NAME || 'Your Company' },
              { label: 'Email', value: import.meta.env.VITE_COMPANY_EMAIL || '—' },
              { label: 'Phone', value: import.meta.env.VITE_COMPANY_PHONE || '—' },
              { label: 'Address', value: import.meta.env.VITE_COMPANY_ADDRESS || '—' },
            ].map(item => (
              <div key={item.label} className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">{item.label}</span>
                <span className="font-medium text-gray-800">{item.value}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4">Company details are configured via environment variables on the server.</p>
        </div>
      )}

      <Modal open={showAddUser} onClose={() => setShowAddUser(false)} title="Add New User" size="md">
        <AddUserForm onClose={() => setShowAddUser(false)} />
      </Modal>
    </div>
  );
}
