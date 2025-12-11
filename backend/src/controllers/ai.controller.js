const { validationResult } = require('express-validator');
const pool = require('../config/db');
const env = require('../config/env');
const logger = require('../utils/logger');
const { generateResponse, fetchSettingsForUser, PROVIDER_META } = require('../services/ai.service');

const parseSettingsPayload = (body) => ({
  provider: body.provider,
  model: body.model,
  temperature: typeof body.temperature === 'number' ? body.temperature : undefined,
  maxTokens: typeof body.maxTokens === 'number' ? body.maxTokens : undefined,
  systemPrompt: body.systemPrompt,
  settings: typeof body.settings === 'object' && body.settings !== null ? body.settings : {},
});

const updateAISettings = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const userId = req.user?.id;
  const payload = parseSettingsPayload(req.body);
  const settingsJson = { ...payload.settings };
  if (req.body.apiKey) settingsJson.apiKey = req.body.apiKey;

  try {
    const result = await pool.query(
      `INSERT INTO ai_settings (user_id, provider, model, temperature, max_tokens, system_prompt, settings_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
       ON CONFLICT (user_id, provider) DO UPDATE
       SET model = EXCLUDED.model,
           temperature = EXCLUDED.temperature,
           max_tokens = EXCLUDED.max_tokens,
           system_prompt = EXCLUDED.system_prompt,
           settings_json = EXCLUDED.settings_json
       RETURNING *`,
      [
        userId,
        payload.provider,
        payload.model,
        payload.temperature ?? 0.7,
        payload.maxTokens || null,
        payload.systemPrompt || null,
        settingsJson,
      ]
    );

    return res.status(200).json({ settings: result.rows[0] });
  } catch (error) {
    logger.error('[ai] Failed to update settings', error);
    return res.status(500).json({ message: 'Unable to update AI settings' });
  }
};

const getAISettings = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const settings = await fetchSettingsForUser(req.user?.id, req.query.provider);
    return res.json({ settings });
  } catch (error) {
    logger.error('[ai] Failed to fetch settings', error);
    return res.status(500).json({ message: 'Unable to fetch AI settings' });
  }
};

const testAIConnection = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const provider = req.body.provider || env.defaultAIProvider || 'openai';
  const prompt = req.body.prompt || 'Say hello from the WhatsApp AI service.';

  try {
    const storedSettings = (await fetchSettingsForUser(req.user?.id, provider)) || {};
    const response = await generateResponse({
      userId: req.user?.id,
      provider,
      prompt,
      context: req.body.context || [],
      settingsOverride: {
        model: req.body.model,
        temperature: req.body.temperature,
        maxTokens: req.body.maxTokens,
        systemPrompt: req.body.systemPrompt,
        settings: req.body.settings,
        retryAttempts: 2,
        retryDelayMs: 750,
      },
    });

    return res.json({
      provider,
      model: response?.raw?.model || storedSettings?.model,
      response: response?.text,
    });
  } catch (error) {
    logger.error('[ai] Test connection failed', error);
    return res.status(500).json({ message: error.message || 'AI provider test failed' });
  }
};

const getAvailableProviders = (_req, res) => {
  const providers = Object.values(PROVIDER_META).map((p) => ({
    id: p.id,
    name: p.displayName,
    defaultModel: p.defaultModel,
  }));
  return res.json({ providers });
};

const switchProvider = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const userId = req.user?.id;
  const { provider } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`UPDATE ai_settings SET settings_json = settings_json - 'is_default' WHERE user_id = $1`, [
      userId,
    ]);

    const updated = await client.query(
      `UPDATE ai_settings
       SET settings_json = jsonb_set(COALESCE(settings_json, '{}'::jsonb), '{is_default}', 'true'::jsonb)
       WHERE user_id = $1 AND provider = $2
       RETURNING *`,
      [userId, provider]
    );

    if (!updated.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Provider settings not found for user' });
    }

    await client.query('COMMIT');
    return res.json({ provider: updated.rows[0].provider, settings: updated.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('[ai] Failed to switch provider', error);
    return res.status(500).json({ message: 'Unable to switch AI provider' });
  } finally {
    client.release();
  }
};

module.exports = {
  updateAISettings,
  getAISettings,
  testAIConnection,
  getAvailableProviders,
  switchProvider,
};
