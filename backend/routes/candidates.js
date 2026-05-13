import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getAllCandidates, getCandidateById, clearCollection } from '../services/qdrant.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

const router = express.Router();

// List all candidates in the pool
router.get('/', async (req, res) => {
  try {
    const candidates = await getAllCandidates();
    res.json({ candidates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get candidate metadata
router.get('/:candidateId', async (req, res) => {
  try {
    const candidate = await getCandidateById(req.params.candidateId);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// View resume inline (opens in browser)
router.get('/:candidateId/view', async (req, res) => {
  try {
    const candidate = await getCandidateById(req.params.candidateId);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    const filePath = path.join(__dirname, '..', candidate.filePath);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' });
    res.setHeader('Content-Disposition', `inline; filename="${candidate.fileName}"`);
    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download resume as attachment
router.get('/:candidateId/file', async (req, res) => {
  try {
    const candidate = await getCandidateById(req.params.candidateId);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    const filePath = path.join(__dirname, '..', candidate.filePath);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' });
    res.download(filePath, candidate.fileName);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear all candidates (wipes Qdrant collection and uploads folder)
router.delete('/', async (req, res) => {
  try {
    await clearCollection();
    if (fs.existsSync(UPLOADS_DIR)) {
      fs.rmSync(UPLOADS_DIR, { recursive: true, force: true });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
