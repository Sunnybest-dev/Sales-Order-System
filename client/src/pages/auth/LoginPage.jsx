import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { Input } from '../../components/ui/index';

const DEMOS = [
  { label: 'Super Admin', email: 'admin@salesorder.com', password: 'admin123' },
  { label: 'Manager', email: 'manager@salesorder.com', password: 'admin123' },
  { label: 'Accountant', email: 'accountant@salesorder.com', password: 'admin123' },
  { label: 'Sales Staff', email: 'sales@salesorder.com', password: 'admin123' },
];

export default function LoginPage() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const user = await login(data);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demo) => {
    setValue('email', demo.email);
    setValue('password', demo.password);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)' }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <span className="text-3xl font-black" style={{ color: '#1e40af' }}>S</span>
          </div>
          <h1 className="text-3xl font-bold text-white">SalesOrder Pro</h1>
          <p className="text-blue-200 mt-1 text-sm">Accounting Information System</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-8 pt-8 pb-6">
            <h2 className="text-xl font-bold text-gray-900">Sign in to your account</h2>
            <p className="text-sm text-gray-500 mt-1 mb-6">Enter your credentials to continue</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="admin@salesorder.com"
                error={errors.email?.message}
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' },
                })}
              />
              <div className="relative">
                <Input
                  label="Password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  error={errors.password?.message}
                  {...register('password', { required: 'Password is required' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-8 text-xs text-gray-400 hover:text-gray-600"
                >
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm font-medium text-blue-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #1e40af, #2563eb)' }}
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>

          <div className="px-8 pb-8">
            <div className="border-t border-gray-100 pt-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Quick Demo Login
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DEMOS.map((d) => (
                  <button
                    key={d.email}
                    type="button"
                    onClick={() => fillDemo(d)}
                    className="text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                  >
                    <p className="text-xs font-semibold text-gray-700 group-hover:text-blue-700">{d.label}</p>
                    <p className="text-xs text-gray-400 truncate">{d.email}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-blue-200 text-xs mt-6">
          © {new Date().getFullYear()} SalesOrder Pro · All rights reserved
        </p>
      </div>
    </div>
  );
}
