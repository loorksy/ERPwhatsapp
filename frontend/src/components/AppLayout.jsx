import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api.service';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/overview', label: 'نظرة عامة' },
  { to: '/conversations', label: 'المحادثات' },
  { to: '/knowledge', label: 'قاعدة المعرفة' },
  { to: '/ai-settings', label: 'إعدادات AI' },
  { to: '/quick-replies', label: 'الردود السريعة' },
  { to: '/analytics', label: 'الإحصائيات' },
  { to: '/reports', label: 'التقارير' },
  { to: '/advanced-settings', label: 'الإعدادات المتقدمة' },
  { to: '/settings', label: 'الإعدادات' },
];

function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [whatsAppStatus, setWhatsAppStatus] = useState('checking');
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'تم ربط واتساب بنجاح', time: 'قبل دقيقة' },
    { id: 2, message: 'محادثة جديدة من 201234567890', time: 'قبل 5 دقائق' },
  ]);

  const activeNav = useMemo(() => navItems.find((item) => location.pathname.startsWith(item.to)), [location.pathname]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { data } = await api.get('/whatsapp/status');
        setWhatsAppStatus(data?.isConnected ? 'connected' : 'disconnected');
      } catch (error) {
        console.error('Failed to fetch WhatsApp status', error);
        setWhatsAppStatus('disconnected');
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const statusBadge = {
    connected: 'bg-green-100 text-green-700',
    disconnected: 'bg-rose-100 text-rose-700',
    checking: 'bg-amber-100 text-amber-700',
  }[whatsAppStatus];

  const statusLabel = {
    connected: 'متصل',
    disconnected: 'غير متصل',
    checking: 'يتم الفحص',
  }[whatsAppStatus];

  const unreadCount = notifications.length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <aside className={`fixed inset-y-0 right-0 z-30 w-72 border-l border-slate-200 bg-white shadow-sm transition duration-200 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <Link to="/overview" className="text-lg font-semibold text-indigo-700">
              ERP WhatsApp
            </Link>
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-600 md:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              إغلاق
            </button>
          </div>
          <nav className="space-y-1 px-4 py-4 text-sm font-semibold text-slate-700">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-lg px-3 py-2 transition hover:bg-indigo-50 hover:text-indigo-700 ${
                    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
                  }`
                }
              >
                <span>{item.label}</span>
                <span className="text-[10px] text-slate-400">›</span>
              </NavLink>
            ))}
            <NavLink
              to="/whatsapp-connect"
              className={({ isActive }) =>
                `flex items-center justify-between rounded-lg px-3 py-2 transition hover:bg-emerald-50 hover:text-emerald-700 ${
                  isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'
                }`
              }
            >
              <span>ربط واتساب</span>
              <span className="text-[10px] text-slate-400">›</span>
            </NavLink>
          </nav>
        </aside>

        <div className="flex flex-1 flex-col md:mr-72">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="flex items-center justify-between px-4 py-3 lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700 md:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  القائمة
                </button>
                <div>
                  <p className="text-xs text-slate-500">المسار الحالي</p>
                  <p className="text-sm font-semibold text-slate-900">{activeNav?.label || 'لوحة التحكم'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusBadge}`}>
                  <span className="h-2 w-2 rounded-full bg-current" />
                  <span>حالة واتساب: {statusLabel}</span>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    className="relative rounded-full border border-slate-200 p-2 text-slate-600 hover:border-indigo-200 hover:text-indigo-700"
                    onClick={() => {
                      setNotificationOpen((prev) => !prev);
                      setProfileOpen(false);
                    }}
                  >
                    <span className="sr-only">الإشعارات</span>
                    🔔
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -left-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  {notificationOpen && (
                    <div className="absolute left-0 mt-2 w-72 rounded-lg border border-slate-200 bg-white shadow-lg">
                      <div className="border-b border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800">الإشعارات</div>
                      <div className="max-h-64 space-y-2 overflow-y-auto px-4 py-3 text-sm text-slate-700">
                        {notifications.map((item) => (
                          <div key={item.id} className="rounded-lg bg-slate-50 px-3 py-2">
                            <p>{item.message}</p>
                            <p className="text-[11px] text-slate-500">{item.time}</p>
                          </div>
                        ))}
                        {notifications.length === 0 && <p className="text-center text-slate-500">لا توجد إشعارات</p>}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    className="flex items-center gap-3 rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
                    onClick={() => {
                      setProfileOpen((prev) => !prev);
                      setNotificationOpen(false);
                    }}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                      {user?.full_name?.slice(0, 2)?.toUpperCase() || 'U'}
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-xs text-slate-500">مرحباً</p>
                      <p className="text-sm font-semibold text-slate-900">{user?.full_name || 'مستخدم'}</p>
                    </div>
                    <span className="text-slate-400">▼</span>
                  </button>
                  {profileOpen && (
                    <div className="absolute left-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white shadow-lg">
                      <div className="border-b border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800">الملف الشخصي</div>
                      <div className="space-y-1 px-4 py-3 text-sm text-slate-700">
                        <p className="truncate font-semibold">{user?.email}</p>
                        <p className="text-xs text-slate-500">دور المستخدم: {user?.role || 'عضو'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="block w-full border-t border-slate-200 px-4 py-2 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        تسجيل الخروج
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className="px-4 py-8 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default AppLayout;
