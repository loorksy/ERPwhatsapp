const OpenAI = require('openai');
const { Anthropic } = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pool = require('../config/db');
const env = require('../config/env');
const logger = require('../utils/logger');

const PROVIDER_META = {
  openai: {
    id: 'openai',
    displayName: 'OpenAI',
    defaultModel: 'gpt-4o-mini',
  },
  claude: {
    id: 'claude',
    displayName: 'Anthropic Claude',
    defaultModel: 'claude-3-haiku-20240307',
  },
  gemini: {
    id: 'gemini',
    displayName: 'Google Gemini',
    defaultModel: 'gemini-1.5-flash',
  },
};

class BaseAIProvider {
  constructor(options) {
    this.provider = options.provider;
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.temperature = typeof options.temperature === 'number' ? options.temperature : 0.7;
    this.maxTokens = Number.isFinite(options.maxTokens) ? Number(options.maxTokens) : undefined;
    this.systemPrompt = options.systemPrompt || '';
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelayMs = options.retryDelayMs || 500;
    this.settings = options.settings || {};
  }

  buildMessages(prompt, context = []) {
    const messages = [];
    if (this.systemPrompt) {
      messages.push({ role: 'system', content: this.systemPrompt });
    }

    context.forEach((message) => {
      if (message?.role && message?.content) {
        messages.push({ role: message.role, content: String(message.content) });
      }
    });

    if (prompt) {
      messages.push({ role: 'user', content: prompt });
    }

    return messages;
  }

  async withRetry(fn) {
    let lastError;
    for (let attempt = 1; attempt <= this.retryAttempts; attempt += 1) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        logger.warn(
          `[ai:${this.provider}] attempt ${attempt} failed: ${error.message}. Retrying in ${
            this.retryDelayMs * attempt
          }ms`
        );
        if (attempt === this.retryAttempts) break;
        await new Promise((resolve) => setTimeout(resolve, this.retryDelayMs * attempt));
      }
    }

    const failure = new Error(`[ai:${this.provider}] request failed after retries`);
    failure.cause = lastError;
    throw failure;
  }

  async generate(prompt, context) {
    const messages = this.buildMessages(prompt, context);
    return this.withRetry(() => this.callModel(messages));
  }

  // To be implemented by providers.
  async callModel() {
    throw new Error('callModel must be implemented by provider');
  }
}

class OpenAIProvider extends BaseAIProvider {
  constructor(options) {
    super(options);
    this.client = new OpenAI({ apiKey: this.apiKey });
  }

  async callModel(messages) {
    const response = await this.client.chat.completions.create({
      model: this.model || PROVIDER_META.openai.defaultModel,
      messages,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
    });

    const text = response.choices?.[0]?.message?.content?.trim();
    return { text, raw: response };
  }
}

class ClaudeProvider extends BaseAIProvider {
  constructor(options) {
    super(options);
    this.client = new Anthropic({ apiKey: this.apiKey });
  }

  async callModel(messages) {
    const systemMessage = messages.find((msg) => msg.role === 'system');
    const conversation = messages
      .filter((msg) => msg.role !== 'system')
      .map((msg) => ({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content }));

    const response = await this.client.messages.create({
      model: this.model || PROVIDER_META.claude.defaultModel,
      temperature: this.temperature,
      max_tokens: this.maxTokens || 512,
      system: systemMessage?.content,
      messages: conversation,
    });

    const text = response.content?.[0]?.text?.trim();
    return { text, raw: response };
  }
}

class GeminiProvider extends BaseAIProvider {
  constructor(options) {
    super(options);
    this.client = new GoogleGenerativeAI(this.apiKey);
  }

  async callModel(messages) {
    const promptText = messages
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n');

    const model = this.client.getGenerativeModel({
      model: this.model || PROVIDER_META.gemini.defaultModel,
      systemInstruction: this.systemPrompt || undefined,
    });

    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: promptText }]}],
      generationConfig: {
        temperature: this.temperature,
        maxOutputTokens: this.maxTokens,
      },
    });

    const text = response.response?.text()?.trim();
    return { text, raw: response };
  }
}

const providerFactories = {
  openai: (options) => new OpenAIProvider({ ...options, provider: 'openai' }),
  claude: (options) => new ClaudeProvider({ ...options, provider: 'claude' }),
  gemini: (options) => new GeminiProvider({ ...options, provider: 'gemini' }),
};

const resolveApiKey = (provider, settings = {}) => {
  if (settings.apiKey) return settings.apiKey;
  if (provider === 'openai') return env.openaiApiKey;
  if (provider === 'claude') return env.anthropicApiKey;
  if (provider === 'gemini') return env.geminiApiKey;
  return undefined;
};

const getProviderInstance = (provider, settings) => {
  const factory = providerFactories[provider];
  if (!factory) {
    throw new Error(`Provider ${provider} is not supported`);
  }

  const apiKey = resolveApiKey(provider, settings);
  if (!apiKey) {
    throw new Error(`Missing API key for provider ${provider}`);
  }

  return factory({
    apiKey,
    model: settings.model,
    temperature: settings.temperature,
    maxTokens: settings.maxTokens,
    systemPrompt: settings.systemPrompt,
    settings: settings.settings,
    retryAttempts: settings.retryAttempts,
    retryDelayMs: settings.retryDelayMs,
  });
};

const mapRowToSettings = (row) => ({
  provider: row.provider,
  model: row.model,
  temperature: Number(row.temperature),
  maxTokens: row.max_tokens,
  systemPrompt: row.system_prompt,
  settings: row.settings_json || {},
});

const fetchSettingsForUser = async (userId, provider) => {
  const params = [userId];
  let query = 'SELECT * FROM ai_settings WHERE user_id = $1';
  if (provider) {
    params.push(provider);
    query += ' AND provider = $2';
  }

  const result = await pool.query(`${query} ORDER BY id DESC`, params);
  return provider ? result.rows.map(mapRowToSettings)[0] : result.rows.map(mapRowToSettings);
};

const getAIResponse = async ({ provider, prompt, context = [], settings = {} }) => {
  const instance = getProviderInstance(provider, settings);
  return instance.generate(prompt, context);
};

const generateResponse = async ({ userId, prompt, context = [], provider, settingsOverride }) => {
  const targetProvider = provider || env.defaultAIProvider || PROVIDER_META.openai.id;
  const storedSettings = await fetchSettingsForUser(userId, targetProvider);
  const mergedSettings = {
    provider: targetProvider,
    model: settingsOverride?.model || storedSettings?.model || PROVIDER_META[targetProvider]?.defaultModel,
    temperature:
      typeof settingsOverride?.temperature === 'number'
        ? settingsOverride.temperature
        : storedSettings?.temperature,
    maxTokens: settingsOverride?.maxTokens ?? storedSettings?.maxTokens,
    systemPrompt: settingsOverride?.systemPrompt || storedSettings?.systemPrompt,
    settings: { ...storedSettings?.settings, ...settingsOverride?.settings },
    retryAttempts: settingsOverride?.retryAttempts || 3,
    retryDelayMs: settingsOverride?.retryDelayMs || 500,
  };

  const response = await getAIResponse({
    provider: targetProvider,
    prompt,
    context,
    settings: mergedSettings,
  });

  return response;
};

module.exports = {
  BaseAIProvider,
  OpenAIProvider,
  ClaudeProvider,
  GeminiProvider,
  getAIResponse,
  generateResponse,
  fetchSettingsForUser,
  PROVIDER_META,
};
