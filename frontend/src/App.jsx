import { Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import GuestRoute from './components/GuestRoute';
import ProtectedRoute from './components/ProtectedRoute';
import ConversationsPage from './pages/Conversations';
import ForgotPasswordPage from './pages/ForgotPassword';
import KnowledgeBasePage from './pages/KnowledgeBase';
import LoginPage from './pages/Login';
import NotFoundPage from './pages/NotFound';
import RegisterPage from './pages/Register';
import WhatsAppConnectPage from './pages/WhatsAppConnect';
import DashboardPage from './pages/Dashboard';
import OverviewPage from './pages/Overview';
import AISettingsPage from './pages/AISettings';
import QuickRepliesPage from './pages/QuickReplies';
import AnalyticsPage from './pages/Analytics';
import SettingsPage from './pages/Settings';
import AdvancedSettingsPage from './pages/AdvancedSettings';
import ReportsPage from './pages/Reports';
import { Navigate } from 'react-router-dom';

function App() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="conversations" element={<ConversationsPage />} />
          <Route path="knowledge" element={<KnowledgeBasePage />} />
          <Route path="ai-settings" element={<AISettingsPage />} />
          <Route path="quick-replies" element={<QuickRepliesPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="advanced-settings" element={<AdvancedSettingsPage />} />
          <Route path="whatsapp-connect" element={<WhatsAppConnectPage />} />
        </Route>
      </Route>

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
