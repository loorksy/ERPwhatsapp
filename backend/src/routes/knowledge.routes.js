const { Router } = require('express');
const { body, param, query } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const env = require('../config/env');
const knowledgeController = require('../controllers/knowledge.controller');
const { verifyToken } = require('../middleware/auth.middleware');

if (!fs.existsSync(env.knowledgeUploadDir)) {
  fs.mkdirSync(env.knowledgeUploadDir, { recursive: true });
}

const upload = multer({
  dest: env.knowledgeUploadDir,
  limits: { fileSize: env.maxUploadSizeMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(file.mimetype) || ['.pdf', '.docx', '.txt'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'));
    }
  },
});

const router = Router();

router.get(
  '/',
  verifyToken,
  [query('page').optional().isInt({ min: 1 }), query('pageSize').optional().isInt({ min: 1, max: 200 })],
  knowledgeController.getAll
);

router.post(
  '/',
  verifyToken,
  [
    body('question').isString().trim().notEmpty(),
    body('answer').isString().trim().notEmpty(),
    body('category').optional().isString().trim(),
  ],
  knowledgeController.create
);

router.get('/:id', verifyToken, [param('id').isInt({ min: 1 })], knowledgeController.getById);

router.put(
  '/:id',
  verifyToken,
  [
    param('id').isInt({ min: 1 }),
    body('question').optional().isString().trim(),
    body('answer').optional().isString().trim(),
    body('category').optional().isString().trim(),
  ],
  knowledgeController.update
);

router.delete('/:id', verifyToken, [param('id').isInt({ min: 1 })], knowledgeController.delete);

router.post('/upload', verifyToken, upload.single('file'), knowledgeController.uploadFile);

router.post(
  '/search',
  verifyToken,
  [body('query').isString().trim().notEmpty(), body('limit').optional().isInt({ min: 1, max: 50 })],
  knowledgeController.search
);

module.exports = router;
