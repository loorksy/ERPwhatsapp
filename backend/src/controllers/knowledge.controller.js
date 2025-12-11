const { validationResult } = require('express-validator');
const pool = require('../config/db');
const logger = require('../utils/logger');
const {
  addKnowledge,
  updateKnowledge,
  deleteKnowledge,
  searchKnowledge,
  uploadDocument,
  findRelevantContext,
} = require('../services/knowledge.service');

const create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const entry = await addKnowledge({
      userId: req.user?.id,
      category: req.body.category,
      question: req.body.question,
      answer: req.body.answer,
      source: req.body.source,
      sourceName: req.body.sourceName,
      metadata: req.body.metadata,
    });
    return res.status(201).json({ knowledge: entry });
  } catch (error) {
    logger.error('[knowledge] create failed', error);
    return res.status(500).json({ message: 'Unable to create knowledge entry' });
  }
};

const getAll = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const pageSize = Math.min(Number(req.query.pageSize) || 20, 200);
  const offset = (page - 1) * pageSize;
  const filters = [req.user?.id];
  const conditions = ['user_id = $1'];

  if (req.query.category) {
    conditions.push(`category = $${filters.length + 1}`);
    filters.push(req.query.category);
  }

  if (req.query.search) {
    conditions.push(`(question ILIKE $${filters.length + 1} OR answer ILIKE $${filters.length + 1})`);
    filters.push(`%${req.query.search}%`);
  }

  try {
    const whereClause = conditions.join(' AND ');
    const listQuery = `SELECT * FROM knowledge_base WHERE ${whereClause} ORDER BY updated_at DESC LIMIT ${pageSize} OFFSET ${offset}`;
    const countQuery = `SELECT COUNT(*) FROM knowledge_base WHERE ${whereClause}`;

    const [rowsResult, countResult] = await Promise.all([
      pool.query(listQuery, filters),
      pool.query(countQuery, filters),
    ]);

    return res.json({
      data: rowsResult.rows,
      page,
      pageSize,
      total: Number(countResult.rows[0].count),
    });
  } catch (error) {
    logger.error('[knowledge] getAll failed', error);
    return res.status(500).json({ message: 'Unable to fetch knowledge entries' });
  }
};

const getById = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM knowledge_base WHERE id = $1 AND user_id = $2', [
      req.params.id,
      req.user?.id,
    ]);
    if (!result.rows[0]) return res.status(404).json({ message: 'Knowledge entry not found' });
    return res.json({ knowledge: result.rows[0] });
  } catch (error) {
    logger.error('[knowledge] getById failed', error);
    return res.status(500).json({ message: 'Unable to fetch knowledge entry' });
  }
};

const update = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const entry = await updateKnowledge(req.params.id, req.user?.id, {
      category: req.body.category,
      question: req.body.question,
      answer: req.body.answer,
      source: req.body.source,
      sourceName: req.body.sourceName,
      metadata: req.body.metadata,
    });

    if (!entry) return res.status(404).json({ message: 'Knowledge entry not found' });
    return res.json({ knowledge: entry });
  } catch (error) {
    logger.error('[knowledge] update failed', error);
    return res.status(500).json({ message: 'Unable to update knowledge entry' });
  }
};

const remove = async (req, res) => {
  try {
    const deleted = await deleteKnowledge(req.params.id, req.user?.id);
    if (!deleted) return res.status(404).json({ message: 'Knowledge entry not found' });
    return res.status(204).send();
  } catch (error) {
    logger.error('[knowledge] delete failed', error);
    return res.status(500).json({ message: 'Unable to delete knowledge entry' });
  }
};

const uploadFile = async (req, res) => {
  try {
    const result = await uploadDocument({ userId: req.user?.id, file: req.file, category: req.body.category });
    return res.status(201).json(result);
  } catch (error) {
    logger.error('[knowledge] upload failed', error);
    return res.status(400).json({ message: error.message || 'Unable to process upload' });
  }
};

const search = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const results = await searchKnowledge({
      userId: req.user?.id,
      query: req.body.query,
      category: req.body.category,
      limit: Number(req.body.limit) || 10,
      semantic: req.body.semantic !== false,
    });

    return res.json({ results });
  } catch (error) {
    logger.error('[knowledge] search failed', error);
    return res.status(500).json({ message: 'Unable to search knowledge base' });
  }
};

const contextual = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const context = await findRelevantContext({
      userId: req.user?.id,
      question: req.body.question,
      topK: Number(req.body.topK) || 5,
    });
    return res.json({ context });
  } catch (error) {
    logger.error('[knowledge] contextual search failed', error);
    return res.status(500).json({ message: 'Unable to fetch contextual knowledge' });
  }
};

module.exports = {
  create,
  getAll,
  getById,
  update,
  delete: remove,
  uploadFile,
  search,
  contextual,
};
