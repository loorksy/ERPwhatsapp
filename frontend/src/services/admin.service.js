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

export default {
  fetchAdminStats,
  fetchUsers,
  fetchUserDetails,
  updateUserStatus,
  updateUserPlan,
  deleteUser,
  exportUsers,
};
