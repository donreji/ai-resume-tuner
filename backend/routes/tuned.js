import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TUNED_DIR = path.join(__dirname, '..', 'tuned');

const router = express.Router();

router.get('/:tunedId/pdf', (req, res) => {
  const filePath = path.join(TUNED_DIR, req.params.tunedId, 'resume.pdf');
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'PDF not found' });
  res.download(filePath, 'tuned_resume.pdf');
});

router.get('/:tunedId/docx', (req, res) => {
  const filePath = path.join(TUNED_DIR, req.params.tunedId, 'resume.docx');
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'DOCX not found' });
  res.download(filePath, 'tuned_resume.docx');
});

export default router;
