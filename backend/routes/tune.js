import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { streamTune, parseSections, extractOriginalDetails } from '../services/resumeTuner.js';
import { generatePDF } from '../services/pdfGenerator.js';
import { generateDOCX } from '../services/docxGenerator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const TUNED_DIR = path.join(__dirname, '..', 'tuned');

const router = express.Router();

router.post('/', async (req, res) => {
  const { candidateId, role, company } = req.body;

  if (!candidateId || !role) {
    return res.status(400).json({ error: 'candidateId and role are required' });
  }

  const extractedPath = path.join(UPLOADS_DIR, candidateId, 'extracted.txt');
  if (!fs.existsSync(extractedPath)) {
    return res.status(404).json({ error: 'Resume text not found. Please re-upload your resume.' });
  }

  const resumeText = fs.readFileSync(extractedPath, 'utf8');

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    // Stream AI-tuned resume (tokens sent to client as they arrive)
    const fullText = await streamTune(resumeText, role, company || '', res);

    // Parse structured sections from full AI output
    const sections = parseSections(fullText);

    // Hard-enforce original personal details — AI is never trusted with these.
    // Extract name + contact directly from the original resume text and overwrite.
    const originals = extractOriginalDetails(resumeText);
    if (originals.name) sections.name = originals.name;
    if (originals.contact) sections.contact = originals.contact;

    // Generate downloadable files
    const tunedId = uuidv4();
    const tunedDir = path.join(TUNED_DIR, tunedId);
    fs.mkdirSync(tunedDir, { recursive: true });

    await generatePDF(sections, path.join(tunedDir, 'resume.pdf'));
    await generateDOCX(sections, path.join(tunedDir, 'resume.docx'));

    // Save metadata for email endpoint
    fs.writeFileSync(path.join(tunedDir, 'metadata.json'), JSON.stringify({
      role,
      company: company || '',
      candidateName: sections.name || '',
      emailSubject: sections.emailSubject || `Application for ${role} Position`,
      emailBody: sections.emailBody || '',
    }));

    res.write(`data: ${JSON.stringify({ type: 'files', tunedId })}\n\n`);
    res.write(`data: ${JSON.stringify({
      type: 'email',
      subject: sections.emailSubject || `Application for ${role} Position`,
      body: sections.emailBody || '',
    })}\n\n`);
    res.write('data: [DONE]\n\n');
  } catch (err) {
    console.error('Tune error:', err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.write('data: [DONE]\n\n');
  } finally {
    res.end();
  }
});

export default router;
