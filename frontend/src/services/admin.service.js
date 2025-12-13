import api from './api.service';

const mockUsers = [
  {
    id: 1,
    full_name: 'أحمد علي',
    email: 'ahmed@example.com',
    company: 'شركة التقنية',
    plan: 'احترافي',
    status: 'active',
    created_at: '2024-03-01T10:00:00Z',
    last_active: '2024-05-20T09:30:00Z',
    usage: { messages: 1520, apiCalls: 320 },
  },
  {
    id: 2,
    full_name: 'سارة محمد',
    email: 'sara@example.com',
    company: 'حلول المستقبل',
    plan: 'أساسي',
    status: 'suspended',
    created_at: '2024-02-10T12:15:00Z',
    last_active: '2024-05-18T16:45:00Z',
    usage: { messages: 860, apiCalls: 140 },
  },
  {
    id: 3,
    full_name: 'يوسف حسن',
    email: 'yousef@example.com',
    company: 'متاجر العرب',
    plan: 'مؤسسة',
    status: 'active',
    created_at: '2024-01-05T08:20:00Z',
    last_active: '2024-05-22T11:10:00Z',
    usage: { messages: 4200, apiCalls: 980 },
  },
  {
    id: 4,
    full_name: 'ليان خالد',
    email: 'lian@example.com',
    company: 'خدمات مالية',
    plan: 'مجاني',
    status: 'active',
    created_at: '2024-04-12T15:00:00Z',
    last_active: '2024-05-21T14:25:00Z',
    usage: { messages: 340, apiCalls: 60 },
  },
];

const mockStats = {
  totalUsers: 482,
  activeUsers: 398,
  totalMessages: 128430,
  apiUsage: 43210,
};

const mockPlans = [
  {
    id: 'free',
    name: 'Free Plan',
    price: 0,
    currency: 'دولار/شهر',
    messageLimit: 500,
    whatsappAccounts: 1,
    aiProviders: ['OpenAI (محدود)'],
    features: [
      { label: 'مراسلات أساسية', enabled: true },
      { label: 'لوحة تقارير مبسطة', enabled: true },
      { label: 'دعم بريد إلكتروني خلال 48 ساعة', enabled: true },
      { label: 'تكامل API', enabled: false },
      { label: 'ذكاء اصطناعي متعدد المزودين', enabled: false },
    ],
    subscribers: 124,
  },
  {
    id: 'basic',
    name: 'Basic Plan',
    price: 49,
    currency: 'دولار/شهر',
    messageLimit: 5000,
    whatsappAccounts: 2,
    aiProviders: ['OpenAI', 'Claude (أساسي)'],
    features: [
      { label: 'جدولة الردود الآلية', enabled: true },
      { label: 'تقارير أسبوعية', enabled: true },
      { label: 'دعم البريد خلال 24 ساعة', enabled: true },
      { label: 'مساعد ذكاء اصطناعي أساسي', enabled: true },
      { label: 'مناطق توافر متعددة', enabled: false },
    ],
    subscribers: 82,
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    price: 149,
    currency: 'دولار/شهر',
    messageLimit: 20000,
    whatsappAccounts: 5,
    aiProviders: ['OpenAI', 'Claude', 'Gemini'],
    features: [
      { label: 'تكامل CRM', enabled: true },
      { label: 'معالجة وسائط متقدمة', enabled: true },
      { label: 'أولوية دعم على مدار الساعة', enabled: true },
      { label: 'ذكاء اصطناعي متعدد المزودين', enabled: true },
      { label: 'وصول للـ API بلا حدود', enabled: true },
    ],
    subscribers: 41,
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plan',
    price: 399,
    currency: 'دولار/شهر',
    messageLimit: 100000,
    whatsappAccounts: 15,
    aiProviders: ['OpenAI', 'Claude', 'Gemini', 'مزود مخصص'],
    features: [
      { label: 'عقود SLA مخصصة', enabled: true },
      { label: 'أمان وامتثال متقدم', enabled: true },
      { label: 'إدارة حساب مخصصة', enabled: true },
      { label: 'تكاملات مخصصة', enabled: true },
      { label: 'وصول فريق متعدد مع أدوار', enabled: true },
    ],
    subscribers: 17,
  },
];

const mockProviders = [
  {
    id: 'openai',
    name: 'OpenAI',
    type: 'openai',
    status: 'active',
    apiKey: 'sk-****-openai',
    endpoint: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
    costPerThousand: 0.002,
    monthlyUsage: 182000,
    settings: { temperature: 0.7 },
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    type: 'claude',
    status: 'active',
    apiKey: 'sk-****-claude',
    endpoint: 'https://api.anthropic.com',
    models: ['claude-3-sonnet', 'claude-3-opus', 'claude-3-haiku'],
    costPerThousand: 0.0015,
    monthlyUsage: 82000,
    settings: { max_tokens: 4000 },
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    type: 'gemini',
    status: 'inactive',
    apiKey: 'sk-****-gemini',
    endpoint: 'https://generativelanguage.googleapis.com',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash'],
    costPerThousand: 0.0012,
    monthlyUsage: 32000,
    settings: { top_p: 0.9 },
  },
  {
    id: 'custom',
    name: 'مزود مخصص',
    type: 'custom',
    status: 'active',
    apiKey: 'sk-****-custom',
    endpoint: 'https://ai.example.com',
    models: ['assist-1', 'assist-2'],
    costPerThousand: 0.0008,
    monthlyUsage: 12600,
    settings: { region: 'eu-west-1' },
  },
];

export async function fetchAdminStats() {
  try {
    const { data } = await api.get('/admin/stats');
    return data;
  } catch (error) {
    return mockStats;
  }
}

const filterUsers = (list, filters = {}) => {
  const { plan, status, search, startDate, endDate } = filters;
  return list
    .filter((user) => (plan ? user.plan === plan : true))
    .filter((user) => (status ? user.status === status : true))
    .filter((user) => {
      if (!search) return true;
      const term = search.toLowerCase();
      return (
        user.full_name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.company.toLowerCase().includes(term)
      );
    })
    .filter((user) => {
      if (!startDate && !endDate) return true;
      const created = new Date(user.created_at);
      if (startDate && created < startDate) return false;
      if (endDate && created > endDate) return false;
      return true;
    });
};

export async function fetchUsers(params = {}) {
  try {
    const { data } = await api.get('/admin/users', { params });
    return data;
  } catch (error) {
    const { page = 1, pageSize = 10 } = params;
    const filtered = filterUsers(mockUsers, params);
    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);
    return {
      users: paged,
      total: filtered.length,
      page,
      pageSize,
    };
  }
}

export async function fetchUserDetails(userId) {
  try {
    const { data } = await api.get(`/admin/users/${userId}`);
    return data;
  } catch (error) {
    const base = mockUsers.find((u) => u.id === userId);
    return (
      base || {
        id: userId,
        full_name: 'مستخدم تجريبي',
        email: 'demo@example.com',
        company: 'تجريبي',
        plan: 'أساسي',
        status: 'active',
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
        usage: { messages: 0, apiCalls: 0 },
        activity: [],
      }
    );
  }
}

export async function updateUserStatus(userId, status) {
  try {
    const { data } = await api.patch(`/admin/users/${userId}/status`, { status });
    return data;
  } catch (error) {
    return { success: true, status };
  }
}

export async function updateUserPlan(userId, plan) {
  try {
    const { data } = await api.patch(`/admin/users/${userId}/plan`, { plan });
    return data;
  } catch (error) {
    return { success: true, plan };
  }
}

export async function deleteUser(userId) {
  try {
    const { data } = await api.delete(`/admin/users/${userId}`);
    return data;
  } catch (error) {
    return { success: true };
  }
}

export async function exportUsers(params = {}) {
  try {
    const { data } = await api.get('/admin/users/export', { params, responseType: 'blob' });
    return data;
  } catch (error) {
    const filtered = filterUsers(mockUsers, params);
    return filtered;
  }
}

export async function fetchSubscriptionPlans() {
  try {
    const { data } = await api.get('/admin/plans');
    return data;
  } catch (error) {
    return mockPlans;
  }
}

export async function updateSubscriptionPlan(planId, payload) {
  try {
    const { data } = await api.patch(`/admin/plans/${planId}`, payload);
    return data;
  } catch (error) {
    const existing = mockPlans.find((plan) => plan.id === planId) || {};
    return { ...existing, ...payload };
  }
}

export async function fetchAIProviders() {
  try {
    const { data } = await api.get('/admin/ai-providers');
    return data;
  } catch (error) {
    return mockProviders;
  }
}

export async function saveAIProvider(provider) {
  try {
    if (provider.id) {
      const { data } = await api.put(`/admin/ai-providers/${provider.id}`, provider);
      return data;
    }
    const { data } = await api.post('/admin/ai-providers', provider);
    return data;
  } catch (error) {
    return provider.id ? provider : { ...provider, id: `temp-${Date.now()}` };
  }
}

export async function testAIProvider(provider) {
  try {
    const { data } = await api.post('/admin/ai-providers/test', provider);
    return data;
  } catch (error) {
    return { ok: true, latency: 180 };
  }
}

export async function deleteAIProvider(providerId) {
  try {
    const { data } = await api.delete(`/admin/ai-providers/${providerId}`);
    return data;
  } catch (error) {
    return { success: true };
  }
}

export default {
  fetchAdminStats,
  fetchUsers,
  fetchUserDetails,
  updateUserStatus,
  updateUserPlan,
  deleteUser,
  exportUsers,
  fetchSubscriptionPlans,
  updateSubscriptionPlan,
  fetchAIProviders,
  saveAIProvider,
  testAIProvider,
  deleteAIProvider,
};
