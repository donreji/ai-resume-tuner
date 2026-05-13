import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { parseFile } from '../services/parser.js';
import { chunkText } from '../services/chunker.js';
import { getEmbedding } from '../services/ollama.js';
import { ensureCollection, upsertChunks } from '../services/qdrant.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

function extractNameFromFilename(filename) {
  let name = filename.replace(/\.[^.]+$/, '');
  name = name.replace(/[-_]?(resume|cv|curriculum|vitae)[-_]?/gi, ' ');
  name = name.replace(/[-_]+/g, ' ').trim();
  name = name.replace(/\s+/g, ' ').trim();
  name = name.replace(/\b\w/g, c => c.toUpperCase());
  return name || 'Candidate';
}

router.post('/', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const candidateId = uuidv4();
    const candidateName = extractNameFromFilename(req.file.originalname);

    // Save original file + extracted text to disk
    const candidateDir = path.join(UPLOADS_DIR, candidateId);
    fs.mkdirSync(candidateDir, { recursive: true });
    fs.writeFileSync(path.join(candidateDir, req.file.originalname), req.file.buffer);

    const text = await parseFile(req.file.buffer, req.file.mimetype);
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Could not extract text from file' });
    }

    // Store full text for tuning
    fs.writeFileSync(path.join(candidateDir, 'extracted.txt'), text, 'utf8');

    // Embed chunks in Qdrant for Q&A (replaces any previous resume)
    const chunks = chunkText(text);
    const embeddings = [];
    for (const chunk of chunks) {
      const embedding = await getEmbedding(chunk);
      embeddings.push(embedding);
    }

    await ensureCollection();
    await upsertChunks(chunks, embeddings, { candidateId, candidateName });

    res.json({
      success: true,
      chunks: chunks.length,
      candidateId,
      candidateName,
      fileName: req.file.originalname,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
