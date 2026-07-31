import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authAPI } from '../../api/services';
import { Input } from '../../components/ui/index';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async ({ email }) => {
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
      toast.success('Reset link sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 40%, #2563eb 100%)' }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <span className="text-3xl font-black" style={{ color: '#1e40af' }}>S</span>
          </div>
          <h1 className="text-3xl font-bold text-white">SalesOrder Pro</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl px-8 py-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
              <p className="text-sm text-gray-500 mb-6">We sent a password reset link to your email address.</p>
              <Link to="/login" className="text-sm font-medium hover:underline" style={{ color: '#2563eb' }}>
                ← Back to login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Reset your password</h2>
              <p className="text-sm text-gray-500 mb-6">Enter your email and we'll send you a reset link.</p>
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
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #1e40af, #2563eb)' }}
                >
                  {loading && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
              <div className="mt-4 text-center">
                <Link to="/login" className="text-sm hover:underline" style={{ color: '#2563eb' }}>
                  ← Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
