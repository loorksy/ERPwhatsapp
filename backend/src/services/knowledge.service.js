const fsp = require('fs/promises');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const OpenAI = require('openai');
const pool = require('../config/db');
const env = require('../config/env');
const logger = require('../utils/logger');

const openaiClient = env.openaiApiKey ? new OpenAI({ apiKey: env.openaiApiKey }) : null;

const ensureUploadDir = async () => {
  if (!env.knowledgeUploadDir) return;
  await fsp.mkdir(env.knowledgeUploadDir, { recursive: true });
};

const cosineSimilarity = (a = [], b = []) => {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length === 0) return 0;
  const dot = a.reduce((sum, val, idx) => sum + val * b[idx], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  if (!normA || !normB) return 0;
  return dot / (normA * normB);
};

const chunkText = (text, chunkSize = 1500) => {
  if (!text) return [];
  const normalized = text.replace(/\s+/g, ' ').trim();
  const chunks = [];
  for (let i = 0; i < normalized.length; i += chunkSize) {
    chunks.push(normalized.slice(i, i + chunkSize));
  }
  return chunks;
};

const generateEmbeddings = async (input) => {
  if (!input) return null;
  if (!openaiClient) {
    throw new Error('OpenAI API key missing. Set OPENAI_API_KEY to enable embeddings.');
  }

  try {
    const response = await openaiClient.embeddings.create({
      model: env.embeddingModel || 'text-embedding-3-small',
      input,
    });
    return response.data?.[0]?.embedding || null;
  } catch (error) {
    logger.error('[knowledge] Failed to generate embeddings', error);
    throw new Error('Unable to generate embeddings at this time');
  }
};

const addKnowledge = async ({ userId, category, question, answer, source = 'manual', sourceName, metadata }) => {
  const embedding = await generateEmbeddings(`${question}\n${answer}`);
  const result = await pool.query(
    `INSERT INTO knowledge_base (user_id, category, question, answer, embedding, source, source_name, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8::jsonb, '{}'::jsonb))
     RETURNING *`,
    [userId, category || null, question, answer, embedding, source, sourceName || null, metadata]
  );
  return result.rows[0];
};

const updateKnowledge = async (id, userId, payload) => {
  const existing = await pool.query('SELECT * FROM knowledge_base WHERE id = $1 AND user_id = $2', [id, userId]);
  const row = existing.rows[0];
  if (!row) return null;

  const shouldRefreshEmbedding = Boolean(
    (payload.question && payload.question !== row.question) || (payload.answer && payload.answer !== row.answer)
  );
  const embedding = shouldRefreshEmbedding
    ? await generateEmbeddings(`${payload.question || row.question}\n${payload.answer || row.answer}`)
    : row.embedding;

  const result = await pool.query(
    `UPDATE knowledge_base
     SET category = COALESCE($3, category),
         question = COALESCE($4, question),
         answer = COALESCE($5, answer),
         embedding = $6,
         source = COALESCE($7, source),
         source_name = COALESCE($8, source_name),
         metadata = COALESCE($9::jsonb, metadata),
         updated_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [
      id,
      userId,
      payload.category,
      payload.question,
      payload.answer,
      embedding,
      payload.source,
      payload.sourceName,
      payload.metadata,
    ]
  );

  return result.rows[0];
};

const deleteKnowledge = async (id, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const docs = await client.query('SELECT storage_path FROM knowledge_documents WHERE knowledge_id = $1', [id]);
    const result = await client.query('DELETE FROM knowledge_base WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
    await client.query('DELETE FROM knowledge_documents WHERE knowledge_id = $1 AND user_id = $2', [id, userId]);
    await client.query('COMMIT');

    for (const doc of docs.rows) {
      if (doc.storage_path) {
        fsp.unlink(doc.storage_path).catch(() => {});
      }
    }
    return Boolean(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('[knowledge] Failed to delete knowledge', error);
    throw error;
  } finally {
    client.release();
  }
};

const searchKnowledge = async ({ userId, query, category, limit = 20, semantic = true }) => {
  const trimmed = query?.trim();
  const textTerm = trimmed ? `%${trimmed}%` : '';
  const baseRows = await pool.query(
    `SELECT * FROM knowledge_base
     WHERE user_id = $1
       AND ($2::text IS NULL OR category = $2)
       AND ($3 = '' OR question ILIKE $3 OR answer ILIKE $3)
     ORDER BY updated_at DESC
     LIMIT 250`,
    [userId, category || null, textTerm]
  );

  const records = baseRows.rows || [];
  if (!semantic || !trimmed) {
    return records.slice(0, limit);
  }

  let queryEmbedding;
  try {
    queryEmbedding = await generateEmbeddings(query);
  } catch (error) {
    logger.warn('[knowledge] Semantic search skipped:', error.message);
    return records.slice(0, limit);
  }

  const ranked = records
    .map((r) => ({ ...r, score: r.embedding ? cosineSimilarity(queryEmbedding, r.embedding) : 0 }))
    .sort((a, b) => b.score - a.score);

  return ranked.slice(0, limit);
};

const extractTextFromDocument = async (filePath, mimeType) => {
  const buffer = await fsp.readFile(filePath);
  if (mimeType === 'application/pdf' || filePath.toLowerCase().endsWith('.pdf')) {
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    filePath.toLowerCase().endsWith('.docx')
  ) {
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  }

  return buffer.toString('utf8');
};

const uploadDocument = async ({ userId, file, category }) => {
  await ensureUploadDir();
  if (!file) throw new Error('No file provided');
  const text = await extractTextFromDocument(file.path, file.mimetype);
  const chunks = chunkText(text);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const docEmbedding = text ? await generateEmbeddings(text.slice(0, 6000)) : null;
    const documentInsert = await client.query(
      `INSERT INTO knowledge_documents (user_id, filename, mime_type, file_size, storage_path, text_content, embedding, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
       RETURNING *`,
      [
        userId,
        file.originalname,
        file.mimetype,
        file.size,
        file.path,
        text,
        docEmbedding,
        { uploadedAt: new Date().toISOString() },
      ]
    );

    const document = documentInsert.rows[0];
    const entries = [];
    const suffix = Date.now();
    for (let i = 0; i < chunks.length; i += 1) {
      const chunk = chunks[i];
      const entry = await addKnowledge({
        userId,
        category,
        question: `${file.originalname} - chunk ${i + 1} (${suffix})`,
        answer: chunk,
        source: 'document',
        sourceName: file.originalname,
        metadata: { chunk: i + 1, filename: file.originalname },
      });
      entries.push(entry);
    }

    if (entries[0]) {
      await client.query('UPDATE knowledge_documents SET knowledge_id = $1 WHERE id = $2', [entries[0].id, document.id]);
    }

    await client.query('COMMIT');
    return { document, entries };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('[knowledge] Failed to process upload', error);
    throw error;
  } finally {
    client.release();
  }
};

const findRelevantContext = async ({ userId, question, topK = 5 }) => {
  const results = await searchKnowledge({ userId, query: question, limit: topK, semantic: true });
  return results.map((r) => ({ id: r.id, question: r.question, answer: r.answer, score: r.score || 0 }));
};

module.exports = {
  addKnowledge,
  updateKnowledge,
  deleteKnowledge,
  searchKnowledge,
  uploadDocument,
  extractTextFromDocument,
  generateEmbeddings,
  findRelevantContext,
};
