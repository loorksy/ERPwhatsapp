import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../services/api.service';
import { friendlyError } from '../utils/error';

function ForgotPasswordPage() {
  const [serverError, setServerError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: 'onBlur',
    defaultValues: { email: '' },
  });

  const onSubmit = async (values) => {
    setServerError(null);
    setSuccessMessage('');
    try {
      await api.post('/auth/forgot-password', values);
      setSuccessMessage('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني (إن وجد).');
    } catch (err) {
      setServerError(friendlyError(err));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-4 py-10">
      <div className="w-full max-w-[440px] rounded-2xl border border-slate-200 bg-white p-8 shadow-lg md:p-10">
        <p className="text-sm font-semibold text-indigo-600">ERP WhatsApp</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">نسيت كلمة المرور</h1>
        <p className="mt-1 text-sm text-slate-600">أدخل بريدك الإلكتروني لإرسال رابط إعادة التعيين.</p>

        {serverError && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>
        )}
        {successMessage && (
          <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{successMessage}</p>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <label className="block text-sm font-medium text-slate-700">البريد الإلكتروني</label>
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
              {...register('email', {
                required: 'البريد الإلكتروني مطلوب',
                pattern: {
                  value: /[^\s@]+@[^\s@]+\.[^\s@]+/,
                  message: 'صيغة البريد الإلكتروني غير صحيحة',
                },
              })}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-indigo-500"
          >
            إرسال الرابط
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-600">
          تذكرت كلمة المرور؟{' '}
          <Link className="font-semibold text-indigo-600" to="/login">
            العودة لتسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
