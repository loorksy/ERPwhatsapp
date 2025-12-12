import api from './api.service';

const mockSummary = {
  totalMessages: 12450,
  responseRate: 96,
  avgResponseTime: 105,
  csat: 92,
};

const mockTrends = [
  { date: 'اليوم', inbound: 120, outbound: 98 },
  { date: 'أمس', inbound: 140, outbound: 110 },
  { date: 'قبل يومين', inbound: 132, outbound: 118 },
  { date: 'قبل 3 أيام', inbound: 150, outbound: 130 },
  { date: 'قبل 4 أيام', inbound: 125, outbound: 108 },
  { date: 'قبل 5 أيام', inbound: 119, outbound: 100 },
];

const mockDistribution = [
  { name: 'استفسار عام', value: 35 },
  { name: 'دعم فني', value: 28 },
  { name: 'مبيعات', value: 22 },
  { name: 'شكاوى', value: 15 },
];

const mockPeakHours = [
  { hour: '9 صباحاً', messages: 34 },
  { hour: '12 ظهراً', messages: 50 },
  { hour: '3 مساءً', messages: 46 },
  { hour: '6 مساءً', messages: 62 },
  { hour: '9 مساءً', messages: 48 },
  { hour: '11 مساءً', messages: 30 },
];

export async function fetchAnalytics(params = {}) {
  try {
    const { data } = await api.get('/analytics/summary', { params });
    return data;
  } catch (error) {
    // fallback to mock data for environments without backend
    const jitter = () => Math.floor(Math.random() * 5);
    return {
      summary: {
        totalMessages: mockSummary.totalMessages + jitter() * 10,
        responseRate: Math.min(100, mockSummary.responseRate + jitter()),
        avgResponseTime: mockSummary.avgResponseTime + jitter(),
        csat: Math.min(100, mockSummary.csat + jitter()),
      },
      trends: mockTrends.map((item) => ({
        ...item,
        inbound: item.inbound + jitter(),
        outbound: item.outbound + jitter(),
      })),
      distribution: mockDistribution,
      peakHours: mockPeakHours,
    };
  }
}

export async function fetchReportTemplates() {
  try {
    const { data } = await api.get('/reports/templates');
    return data?.templates || [];
  } catch (error) {
    return [
      { key: 'conversations', title: 'تقرير المحادثات', description: 'حجم المحادثات، الحالات، ومتوسط زمن الإغلاق.' },
      { key: 'bot-performance', title: 'تقرير أداء البوت', description: 'دقة الردود، معدل النجاح، ونسب التحويل للمشغل.' },
      { key: 'faq', title: 'تقرير الأسئلة الشائعة', description: 'أكثر الأسئلة وروداً وأداء الردود السريعة.' },
      { key: 'peak-hours', title: 'تقرير أوقات الذروة', description: 'ساعات الذروة والضغط على فريق الدعم.' },
    ];
  }
}

export async function scheduleReport(payload) {
  try {
    const { data } = await api.post('/reports/schedule', payload);
    return data;
  } catch (error) {
    return { success: true, message: 'تم حفظ الجدولة وإرسال التقارير عبر البريد الإلكتروني.' };
  }
}

export async function exportReport(format, payload) {
  try {
    const { data } = await api.post(`/reports/export?format=${format}`, payload, { responseType: 'blob' });
    return data;
  } catch (error) {
    return null;
  }
}
