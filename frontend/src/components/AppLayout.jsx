import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api.service';
import { useAuth } from '../context/AuthContext.jsx';
import NotificationBell from './NotificationBell';
import LanguageSwitcher from './LanguageSwitcher';

const navItems = [
  { to: '/overview', label: 'nav.overview' },
  { to: '/conversations', label: 'nav.conversations' },
  { to: '/knowledge', label: 'nav.knowledge' },
  { to: '/ai-settings', label: 'nav.aiSettings' },
  { to: '/quick-replies', label: 'nav.quickReplies' },
  { to: '/analytics', label: 'nav.analytics' },
  { to: '/reports', label: 'nav.reports' },
  { to: '/admin', label: 'nav.admin' },
  { to: '/admin/users', label: 'nav.adminUsers' },
  { to: '/admin/plans', label: 'nav.adminPlans' },
  { to: '/admin/providers', label: 'nav.adminProviders' },
  { to: '/advanced-settings', label: 'nav.advancedSettings' },
  { to: '/settings', label: 'nav.settings' },
];

function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [whatsAppStatus, setWhatsAppStatus] = useState('checking');
  const [profileOpen, setProfileOpen] = useState(false);

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
    connected: t('layout.connected'),
    disconnected: t('layout.disconnected'),
    checking: t('layout.checking'),
  }[whatsAppStatus];

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
              {t('layout.close')}
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
                <span>{t(item.label)}</span>
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
              <span>{t('nav.whatsappConnect')}</span>
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
                  {t('layout.menu')}
                </button>
                <div>
                  <p className="text-xs text-slate-500">{t('layout.currentPath')}</p>
                  <p className="text-sm font-semibold text-slate-900">{(activeNav && t(activeNav.label)) || t('nav.dashboard')}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusBadge}`}>
                  <span className="h-2 w-2 rounded-full bg-current" />
                  <span>
                    {t('layout.whatsappStatus')}: {statusLabel}
                  </span>
                </div>

                <NotificationBell />
                <LanguageSwitcher />

                <div className="relative">
                  <button
                    type="button"
                    className="flex items-center gap-3 rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
                    onClick={() => {
                      setProfileOpen((prev) => !prev);
                    }}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                      {user?.full_name?.slice(0, 2)?.toUpperCase() || 'U'}
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-xs text-slate-500">{t('layout.hi')}</p>
                      <p className="text-sm font-semibold text-slate-900">{user?.full_name || 'User'}</p>
                    </div>
                    <span className="text-slate-400">▼</span>
                  </button>
                  {profileOpen && (
                    <div className="absolute left-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white shadow-lg">
                      <div className="border-b border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800">{t('layout.profile')}</div>
                      <div className="space-y-1 px-4 py-3 text-sm text-slate-700">
                        <p className="truncate font-semibold">{user?.email}</p>
                        <p className="text-xs text-slate-500">
                          {t('layout.userRole')}: {user?.role || 'Member'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="block w-full border-t border-slate-200 px-4 py-2 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        {t('layout.logout')}
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
