import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  fetchAISettings,
  fetchProviders,
  testAIConnection,
  updateAISettings,
} from '../services/ai.service';

const PROVIDER_OPTIONS = [
  {
    id: 'openai',
    label: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
  },
  {
    id: 'claude',
    label: 'Anthropic Claude',
    models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'],
  },
  {
    id: 'custom',
    label: 'مزود مخصص',
    models: ['custom-model'],
  },
];

const SYSTEM_TEMPLATES = [
  {
    label: 'دعم العملاء',
    value:
      'أنت مساعد ذكي لخدمة العملاء في شركة {{company_name}}. استخدم لهجة ودودة، وقدّم حلولاً مختصرة مع خطوات واضحة.',
  },
  {
    label: 'مساعد مبيعات',
    value:
      'أنت مستشار مبيعات لشركة {{company_name}}. عرّف بالمنتجات التالية: {{products}}. اقترح حلولاً بناءً على احتياجات العميل.',
  },
  {
    label: 'دليل تقني',
    value:
      'أنت خبير تقني يشرح بإيجاز وبدون مصطلحات معقدة. إذا كان الطلب خارج نطاق {{company_name}}، اطلب توضيحاً محدداً.',
  },
];

const TONE_OPTIONS = ['رسمي', 'ودي', 'احترافي', 'مرح'];
const LANGUAGE_OPTIONS = ['العربية', 'الإنجليزية', 'فرنسية', 'إسبانية'];
const RESPONSE_TIME = [
  { id: 'instant', label: 'فوري' },
  { id: 'natural', label: 'تأخير طبيعي' },
  { id: 'custom', label: 'مخصص' },
];
const RESPONSE_LENGTH = [
  { id: 'short', label: 'قصير' },
  { id: 'medium', label: 'متوسط' },
  { id: 'long', label: 'طويل' },
];

const Tab = ({ id, activeTab, label, onClick }) => (
  <button
    type="button"
    onClick={() => onClick(id)}
    className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
      activeTab === id
        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
        : 'border-transparent text-slate-600 hover:bg-slate-50'
    }`}
  >
    {label}
  </button>
);

function AISettingsPage() {
  const [activeTab, setActiveTab] = useState('provider');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [providers, setProviders] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: {
      provider: 'openai',
      model: 'gpt-4o',
      apiKey: '',
      temperature: 0.7,
      maxTokens: 1024,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
      systemPrompt: '',
      tone: 'احترافي',
      language: 'العربية',
      responseTime: 'instant',
      responseDelaySeconds: 2,
      responseLength: 'medium',
    },
  });

  const selectedProvider = watch('provider');
  const selectedModel = watch('model');
  const temperature = watch('temperature');
  const topP = watch('topP');
  const frequencyPenalty = watch('frequencyPenalty');
  const presencePenalty = watch('presencePenalty');

  const providerMeta = useMemo(() => {
    const remote = providers.map((p) => ({ id: p.id, label: p.name, models: [] }));
    const merged = [...PROVIDER_OPTIONS];
    remote.forEach((p) => {
      if (!merged.find((m) => m.id === p.id)) merged.push(p);
    });
    return merged;
  }, [providers]);

  const availableModels = useMemo(() => {
    const option = providerMeta.find((p) => p.id === selectedProvider);
    return option?.models || ['default-model'];
  }, [providerMeta, selectedProvider]);

  const loadSettings = async () => {
    setLoading(true);
    setStatusMessage('');
    try {
      const [settings, providerList] = await Promise.all([
        fetchAISettings(),
        fetchProviders(),
      ]);
      setProviders(providerList);
      if (settings) {
        reset({
          provider: settings.provider || 'openai',
          model: settings.model || availableModels[0],
          apiKey: settings.settings_json?.apiKey || '',
          temperature: settings.temperature ?? 0.7,
          maxTokens: settings.max_tokens || 1024,
          topP: settings.settings_json?.topP ?? 1,
          frequencyPenalty: settings.settings_json?.frequencyPenalty ?? 0,
          presencePenalty: settings.settings_json?.presencePenalty ?? 0,
          systemPrompt: settings.system_prompt || '',
          tone: settings.settings_json?.tone || 'احترافي',
          language: settings.settings_json?.language || 'العربية',
          responseTime: settings.settings_json?.responseTime || 'instant',
          responseDelaySeconds: settings.settings_json?.responseDelaySeconds || 2,
          responseLength: settings.settings_json?.responseLength || 'medium',
        });
      }
    } catch (error) {
      setStatusMessage(error?.message || 'تعذر تحميل الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const option = providerMeta.find((p) => p.id === selectedProvider);
    if (option && !option.models.includes(selectedModel)) {
      setValue('model', option.models[0] || 'default-model');
    }
  }, [providerMeta, selectedModel, selectedProvider, setValue]);

  const onSubmit = async (values) => {
    setLoading(true);
    setStatusMessage('');
    try {
      const payload = {
        provider: values.provider,
        model: values.model,
        temperature: Number(values.temperature),
        maxTokens: Number(values.maxTokens) || null,
        systemPrompt: values.systemPrompt,
        apiKey: values.apiKey,
        settings: {
          topP: Number(values.topP),
          frequencyPenalty: Number(values.frequencyPenalty),
          presencePenalty: Number(values.presencePenalty),
          tone: values.tone,
          language: values.language,
          responseTime: values.responseTime,
          responseDelaySeconds: Number(values.responseDelaySeconds) || 0,
          responseLength: values.responseLength,
        },
      };
      await updateAISettings(payload);
      setStatusMessage('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      setStatusMessage(error?.message || 'تعذر حفظ الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (value) => {
    setValue('systemPrompt', value, { shouldDirty: true });
  };

  const appendVariable = (variable) => {
    const current = watch('systemPrompt') || '';
    setValue('systemPrompt', `${current} {{${variable}}}`, { shouldDirty: true });
  };

  const handleTestConnection = async () => {
    if (selectedProvider === 'custom') {
      setTestResult({ status: 'warning', message: 'اختبار الاتصال غير متاح للمزود المخصص.' });
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      const result = await testAIConnection({
        provider: selectedProvider,
        model: selectedModel,
        temperature,
        maxTokens: watch('maxTokens'),
        systemPrompt: watch('systemPrompt'),
        settings: {
          topP,
          frequencyPenalty,
          presencePenalty,
        },
      });
      setTestResult({ status: 'success', message: `تم الاختبار بنجاح باستخدام ${result.model || 'الموديل'}` });
    } catch (error) {
      setTestResult({ status: 'error', message: error?.message || 'فشل اختبار الاتصال' });
    } finally {
      setTesting(false);
    }
  };

  const renderProviderTab = () => (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">مزود الذكاء الاصطناعي</label>
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            {...register('provider', { required: 'اختيار المزود مطلوب' })}
          >
            {providerMeta.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.label}
              </option>
            ))}
          </select>
          {errors.provider && <p className="mt-1 text-xs text-red-500">{errors.provider.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">API Key</label>
          <input
            type="password"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="أدخل مفتاح المزود"
            {...register('apiKey', { required: 'API Key مطلوب' })}
          />
          {errors.apiKey && <p className="mt-1 text-xs text-red-500">{errors.apiKey.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">اختبار الاتصال</label>
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {testing ? 'جار الاختبار...' : 'اختبار الاتصال'}
          </button>
        </div>
        {testResult && (
          <div className={`rounded-lg border px-3 py-2 text-sm ${
            testResult.status === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : testResult.status === 'warning'
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : 'border-red-200 bg-red-50 text-red-700'
          }`}
          >
            {testResult.message}
          </div>
        )}
      </div>
    </div>
  );

  const renderModelTab = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">الموديل</label>
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            {...register('model', { required: 'اختيار الموديل مطلوب' })}
          >
            {availableModels.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
          {errors.model && <p className="mt-1 text-xs text-red-500">{errors.model.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Max Tokens</label>
          <input
            type="number"
            min={1}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            {...register('maxTokens', { required: 'قيمة مطلوبة', min: { value: 1, message: 'يجب أن يكون أكبر من 0' } })}
          />
          {errors.maxTokens && <p className="mt-1 text-xs text-red-500">{errors.maxTokens.message}</p>}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {[{
          name: 'temperature',
          label: 'Temperature',
          min: 0,
          max: 2,
          step: 0.1,
        },
        {
          name: 'topP',
          label: 'Top P',
          min: 0,
          max: 1,
          step: 0.05,
        },
        {
          name: 'frequencyPenalty',
          label: 'Frequency Penalty',
          min: -2,
          max: 2,
          step: 0.1,
        },
        {
          name: 'presencePenalty',
          label: 'Presence Penalty',
          min: -2,
          max: 2,
          step: 0.1,
        }].map((slider) => (
          <div key={slider.name} className="space-y-2">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
              <span>{slider.label}</span>
              <span className="text-slate-500">{watch(slider.name)}</span>
            </div>
            <input
              type="range"
              min={slider.min}
              max={slider.max}
              step={slider.step}
              {...register(slider.name, { valueAsNumber: true })}
              className="w-full"
            />
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
        <h4 className="mb-2 text-sm font-semibold text-slate-800">معاينة فورية</h4>
        <p>المزود: <span className="font-semibold">{selectedProvider}</span> | الموديل: <span className="font-semibold">{selectedModel}</span></p>
        <p className="mt-1">Temperature: {temperature} | Top P: {topP} | Frequency Penalty: {frequencyPenalty} | Presence Penalty: {presencePenalty}</p>
      </div>
    </div>
  );

  const renderPromptTab = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {SYSTEM_TEMPLATES.map((template) => (
          <button
            key={template.label}
            type="button"
            onClick={() => handleTemplateSelect(template.value)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
          >
            {template.label}
          </button>
        ))}
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-700">System Prompt</label>
        <textarea
          rows={8}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          placeholder="عرّف أسلوب البوت وسياق الشركة هنا..."
          {...register('systemPrompt', { required: 'النص مطلوب' })}
        />
        {errors.systemPrompt && <p className="mt-1 text-xs text-red-500">{errors.systemPrompt.message}</p>}
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {['company_name', 'products', 'contact_name', 'support_hours'].map((variable) => (
          <button
            key={variable}
            type="button"
            onClick={() => appendVariable(variable)}
            className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            {{
              company_name: 'اسم الشركة',
              products: 'المنتجات',
              contact_name: 'اسم العميل',
              support_hours: 'ساعات الدعم',
            }[variable]}
          </button>
        ))}
      </div>
    </div>
  );

  const renderBehaviorTab = () => (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">نبرة الحديث</label>
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            {...register('tone')}
          >
            {TONE_OPTIONS.map((tone) => (
              <option key={tone} value={tone}>
                {tone}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">اللغة المفضلة</label>
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            {...register('language')}
          >
            {LANGUAGE_OPTIONS.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">وقت الرد</label>
          <div className="flex gap-2">
            {RESPONSE_TIME.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setValue('responseTime', option.id, { shouldDirty: true })}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                  watch('responseTime') === option.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {watch('responseTime') === 'custom' && (
            <input
              type="number"
              min={0}
              className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="زمن التأخير بالثواني"
              {...register('responseDelaySeconds', { required: true, min: 0 })}
            />
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">طول الرد</label>
          <div className="flex gap-2">
            {RESPONSE_LENGTH.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setValue('responseLength', option.id, { shouldDirty: true })}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                  watch('responseLength') === option.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">إعدادات الذكاء الاصطناعي</h1>
          <p className="text-sm text-slate-600">قم بضبط المزود، الموديل، وسلوك الردود بما يناسب فريقك.</p>
        </div>
        {statusMessage && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 shadow-sm">
            {statusMessage}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Tab id="provider" label="اختيار المزود" activeTab={activeTab} onClick={setActiveTab} />
        <Tab id="model" label="إعدادات الموديل" activeTab={activeTab} onClick={setActiveTab} />
        <Tab id="prompt" label="System Prompt" activeTab={activeTab} onClick={setActiveTab} />
        <Tab id="behavior" label="السلوك" activeTab={activeTab} onClick={setActiveTab} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {activeTab === 'provider' && renderProviderTab()}
          {activeTab === 'model' && renderModelTab()}
          {activeTab === 'prompt' && renderPromptTab()}
          {activeTab === 'behavior' && renderBehaviorTab()}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">يتم الحفظ لكل مستخدم مع دعم مزودين متعددين لكل حساب.</div>
          <button
            type="submit"
            disabled={loading || !isDirty}
            className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {loading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AISettingsPage;
