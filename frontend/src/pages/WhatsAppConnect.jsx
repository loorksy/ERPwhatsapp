import { useCallback, useEffect, useMemo, useState } from 'react';
import QRCodeDisplay from '../components/QRCodeDisplay';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.service';
import getSocket from '../services/socket.service';
import { friendlyError } from '../utils/error';

function WhatsAppConnectPage() {
  const { user, token } = useAuth();
  const [status, setStatus] = useState({ status: 'unknown', isReady: false });
  const [qrPayload, setQrPayload] = useState(null);
  const [qrExpiresIn, setQrExpiresIn] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const connectionState = useMemo(() => {
    if (status.isReady) return 'متصل';
    if (status.status === 'qr' || qrPayload) return 'بانتظار المسح';
    if (status.status === 'initializing') return 'جاري التهيئة';
    return 'غير متصل';
  }, [status, qrPayload]);

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await api.get('/whatsapp/status');
      setStatus(data);

      if (data.isReady) {
        setSuccess('تم ربط WhatsApp بنجاح');
        setQrPayload(null);
        setQrExpiresIn(0);
        setError(null);
      }
    } catch (err) {
      setError(friendlyError(err));
    }
  }, []);

  const fetchQrCode = useCallback(async () => {
    try {
      const { data } = await api.get('/whatsapp/qr');
      setQrPayload(data);
      setQrExpiresIn(60);
    } catch (err) {
      if (err.status !== 404) {
        setError(friendlyError(err));
      }
    }
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post('/whatsapp/connect');
      await fetchStatus();
      await fetchQrCode();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post('/whatsapp/disconnect');
      setStatus({ status: 'disconnected', isReady: false });
      setQrPayload(null);
      setQrExpiresIn(0);
      setSuccess('تم قطع الاتصال');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  useEffect(() => {
    if (!token || !user?.id) return undefined;

    const socket = getSocket(token);
    const handleJoin = () => socket.emit('join', { userId: user.id });
    const handleQr = (payload) => {
      setQrPayload(payload);
      setQrExpiresIn(60);
      setSuccess(null);
    };

    socket.on('connect', handleJoin);
    socket.on('whatsapp:qr', handleQr);

    if (socket.connected) {
      handleJoin();
    }

    return () => {
      socket.off('connect', handleJoin);
      socket.off('whatsapp:qr', handleQr);
    };
  }, [token, user?.id]);

  useEffect(() => {
    if (!qrExpiresIn) return undefined;

    const timer = setInterval(() => {
      setQrExpiresIn((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [qrExpiresIn]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-indigo-600">ربط WhatsApp</p>
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">إدارة اتصال WhatsApp</h1>
            <p className="text-sm text-slate-600">ابدأ جلسة متعددة الأجهزة وراقب حالة الاتصال والرمز.</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span className="rounded-full bg-green-50 px-3 py-1 font-semibold text-green-700">{connectionState}</span>
            {status.phoneNumber && (
              <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">{status.phoneNumber}</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-semibold text-slate-900">بدء جلسة جديدة</p>
                <p className="text-sm text-slate-600">اضغط على الزر لتهيئة العميل وتلقي رمز QR عبر Socket.io.</p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={loading}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
                >
                  {loading ? '...جاري الربط' : 'ربط WhatsApp'}
                </button>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={loading || status.status === 'disconnected'}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:text-red-700 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  قطع الاتصال
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-700 md:grid-cols-3">
              <div>
                <p className="font-semibold text-slate-900">1. البدء</p>
                <p className="text-slate-600">اضغط على زر الربط لتوليد رمز QR جديد ومتابعة التقدم.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">2. المسح</p>
                <p className="text-slate-600">افتح WhatsApp &gt; الأجهزة المرتبطة &gt; اربط جهازاً لمسح الرمز المعروض.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">3. التحقق</p>
                <p className="text-slate-600">سيتم تحديث الحالة إلى متصل بمجرد اكتمال التوثيق.</p>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}
            {success && (
              <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">مراقبة الحالة</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">الحالة الحالية</p>
                <p className="text-lg font-bold text-indigo-700">{connectionState}</p>
                <p className="text-xs text-slate-500">آخر تحديث عبر REST كل بضع ثوانٍ.</p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">إشعارات Socket.io</p>
                <p className="text-sm text-slate-600">يتم بث رموز QR فورياً إلى جلسة المستخدم.</p>
                <p className="text-xs text-slate-500">معرف المستخدم: {user?.id || 'غير متوفر'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <QRCodeDisplay
            image={qrPayload?.image}
            expiresIn={qrExpiresIn}
            loading={loading && !qrPayload}
            error={error && !qrPayload ? error : null}
            onRefresh={fetchQrCode}
          />

          <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm">
            <p className="mb-2 text-sm font-semibold text-slate-900">نصائح للربط الناجح</p>
            <ul className="list-disc space-y-2 pl-4">
              <li>تأكد من استقرار اتصال الإنترنت على الجهاز الذي يحتوي على WhatsApp.</li>
              <li>إذا انتهى صلاحية الرمز، اضغط على تحديث الرمز لإعادة التوليد.</li>
              <li>بعد الربط ستتوقف الرموز الجديدة عن الظهور وسيتم عرض رقم الهاتف المتصل.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WhatsAppConnectPage;
