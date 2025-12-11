import { useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { fetchAnalytics } from '../services/analytics.service';

const COLORS = ['#6366f1', '#22c55e', '#0ea5e9', '#f97316', '#e11d48'];

const dateRanges = [
  { key: 'today', label: 'اليوم' },
  { key: 'last7', label: 'آخر 7 أيام' },
  { key: 'last30', label: 'آخر 30 يوم' },
  { key: 'custom', label: 'مخصص' },
];

function formatMinutes(value) {
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  if (minutes === 0) return `${seconds}ث`;
  return `${minutes}د ${seconds.toString().padStart(2, '0')}ث`;
}

function AnalyticsPage() {
  const [summary, setSummary] = useState({ totalMessages: 0, responseRate: 0, avgResponseTime: 0, csat: 0 });
  const [trends, setTrends] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [range, setRange] = useState('last7');
  const [customRange, setCustomRange] = useState([null, null]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [startDate, endDate] = customRange;

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const { summary: s, trends: t, distribution: d, peakHours: p } = await fetchAnalytics({ range, startDate, endDate });
      setSummary(s);
      setTrends(t);
      setDistribution(d);
      setPeakHours(p);
    } catch (err) {
      setError('تعذر تحميل البيانات حالياً.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [range, startDate, endDate]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadAnalytics();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const kpiCards = useMemo(
    () => [
      { label: 'إجمالي الرسائل', value: summary.totalMessages.toLocaleString('en-US') },
      { label: 'معدل الاستجابة', value: `${summary.responseRate}%` },
      { label: 'متوسط وقت الرد', value: formatMinutes(summary.avgResponseTime) },
      { label: 'رضا العملاء', value: `${summary.csat}%` },
    ],
    [summary],
  );

  const exportCSV = () => {
    const rows = trends.map((item) => ({ التاريخ: item.date, وارد: item.inbound, صادر: item.outbound }));
    const header = Object.keys(rows[0] || {});
    const csv = [header.join(','), ...rows.map((row) => header.map((key) => row[key]).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'analytics.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(trends.map((item) => ({ التاريخ: item.date, وارد: item.inbound, صادر: item.outbound })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trends');
    XLSX.writeFile(wb, 'analytics.xlsx');
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFont('Helvetica', 'bold');
    doc.text('تقرير الإحصائيات', 14, 20);
    doc.setFontSize(10);
    doc.text(`النطاق: ${dateRanges.find((item) => item.key === range)?.label || 'مخصص'}`, 14, 28);
    doc.setFont('Helvetica', 'normal');

    const startY = 38;
    doc.setFontSize(11);
    doc.text(['#', 'التاريخ', 'وارد', 'صادر'].join(' | '), 14, startY, { align: 'left' });
    trends.forEach((item, idx) => {
      doc.text(`${idx + 1} | ${item.date} | ${item.inbound} | ${item.outbound}`, 14, startY + 8 + idx * 8, {
        align: 'left',
      });
    });
    doc.save('analytics.pdf');
  };

  const handleRangeChange = (key) => {
    setRange(key);
    if (key !== 'custom') {
      setCustomRange([null, null]);
    }
  };

  const totalMessages = useMemo(() => trends.reduce((acc, item) => acc + (item.inbound + item.outbound), 0), [trends]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-indigo-600">الإحصائيات والتحليلات</p>
          <h1 className="text-2xl font-bold text-slate-900">متابعة الأداء والاتجاهات</h1>
          <p className="text-sm text-slate-600">راقب مؤشرات الأداء، الرسوم البيانية، وصدّر التقارير بسهولة.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
          <span className="text-sm font-semibold text-slate-700">النطاق الزمني:</span>
          <div className="flex flex-wrap gap-2">
            {dateRanges.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleRangeChange(item.key)}
                className={`rounded-lg px-3 py-1 text-sm font-semibold transition ${
                  range === item.key ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {range === 'custom' && (
            <div className="flex items-center gap-2">
              <DatePicker
                selected={startDate}
                onChange={(dates) => setCustomRange(dates)}
                startDate={startDate}
                endDate={endDate}
                selectsRange
                placeholderText="اختر التاريخ"
                className="w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                dateFormat="yyyy/MM/dd"
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-600">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{card.value}</p>
            <p className="text-xs text-emerald-600">تحديث في الوقت الفعلي</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">حجم الرسائل</p>
              <h2 className="text-lg font-bold text-slate-900">الرسائل عبر الزمن</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadAnalytics}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
              >
                تحديث الآن
              </button>
              <button
                type="button"
                onClick={exportCSV}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
              >
                CSV
              </button>
              <button
                type="button"
                onClick={exportExcel}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
              >
                Excel
              </button>
              <button
                type="button"
                onClick={exportPDF}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
              >
                PDF
              </button>
            </div>
          </div>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ top: 16, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip formatter={(value) => [value, 'رسائل']} />
                <Legend />
                <Line type="monotone" dataKey="inbound" stroke="#4f46e5" strokeWidth={3} dot={{ r: 3 }} name="وارد" />
                <Line type="monotone" dataKey="outbound" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 3 }} name="صادر" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {loading && <p className="mt-3 text-sm text-slate-500">جارِ تحميل البيانات...</p>}
          {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">توزيع المحادثات</p>
            <h2 className="text-lg font-bold text-slate-900">حسب النوع</h2>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={4}>
                    {distribution.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">أوقات الذروة</p>
            <h2 className="text-lg font-bold text-slate-900">حجم الرسائل</h2>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHours} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="hour" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="messages" fill="#22c55e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">تصدير التقرير</p>
            <h2 className="text-lg font-bold text-slate-900">إجمالي الرسائل: {totalMessages.toLocaleString('en-US')}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">PDF</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">Excel</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">CSV</span>
          </div>
        </div>
        <p className="mt-2 text-sm text-slate-600">اختر تنسيق التصدير المفضل لك عبر الأزرار أعلى الرسم البياني.</p>
      </div>
    </div>
  );
}

export default AnalyticsPage;
