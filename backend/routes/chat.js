import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';
import { getEmbedding, callWithTools, TOOL_SYSTEM } from '../services/ollama.js';
import { searchChunks, collectionExists } from '../services/qdrant.js';
import { streamTune, parseSections, extractOriginalDetails } from '../services/resumeTuner.js';
import { generatePDF } from '../services/pdfGenerator.js';
import { generateDOCX } from '../services/docxGenerator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const TUNED_DIR = path.join(__dirname, '..', 'tuned');

const router = express.Router();

function sse(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

async function executeTuneResume(args, resumeText, res) {
  const { role, company = '' } = args;
  sse(res, { type: 'tool_start', name: 'tune_resume', args });

  const fullText = await streamTune(resumeText, role, company, res);
  const sections = parseSections(fullText);

  const originals = extractOriginalDetails(resumeText);
  if (originals.name) sections.name = originals.name;
  if (originals.contact) sections.contact = originals.contact;

  const tunedId = uuidv4();
  const tunedDir = path.join(TUNED_DIR, tunedId);
  fs.mkdirSync(tunedDir, { recursive: true });

  await generatePDF(sections, path.join(tunedDir, 'resume.pdf'));
  await generateDOCX(sections, path.join(tunedDir, 'resume.docx'));

  const emailSubject = sections.emailSubject || `Application for ${role} Position`;
  const emailBody = sections.emailBody || '';

  fs.writeFileSync(path.join(tunedDir, 'metadata.json'), JSON.stringify({
    role, company, candidateName: sections.name || '', emailSubject, emailBody,
  }));

  sse(res, { type: 'files', tunedId });
  sse(res, { type: 'email', subject: emailSubject, body: emailBody });

  return { success: true, tunedId, emailSubject, emailBody };
}

async function executeSendEmail(args, res) {
  const { to_email, tuned_id } = args;
  sse(res, { type: 'tool_start', name: 'send_email', args });

  if (!(process.env.EMAIL_USER && process.env.EMAIL_PASS)) {
    const result = { success: false, error: 'Email not configured in backend/.env' };
    sse(res, { type: 'tool_result', name: 'send_email', ...result });
    return result;
  }

  const pdfPath = path.join(TUNED_DIR, tuned_id, 'resume.pdf');
  if (!fs.existsSync(pdfPath)) {
    const result = { success: false, error: 'Tuned resume not found — please tune first' };
    sse(res, { type: 'tool_result', name: 'send_email', ...result });
    return result;
  }

  let meta = {};
  try { meta = JSON.parse(fs.readFileSync(path.join(TUNED_DIR, tuned_id, 'metadata.json'), 'utf8')); } catch { /* use defaults */ }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: to_email,
    subject: meta.emailSubject || 'Job Application',
    text: meta.emailBody || '',
    attachments: [{ filename: 'resume.pdf', path: pdfPath }],
  });

  const result = { success: true, to: to_email };
  sse(res, { type: 'tool_result', name: 'send_email', ...result });
  return result;
}

router.post('/', async (req, res) => {
  const { question, candidateId } = req.body;
  if (!question) return res.status(400).json({ error: 'question is required' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const hasData = await collectionExists();
    if (!hasData) {
      sse(res, { token: 'No resume uploaded yet. Please upload your resume first.' });
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    const queryEmbedding = await getEmbedding(question);
    const chunks = await searchChunks(queryEmbedding, 8);
    const context = chunks.join('\n\n---\n\n');

    let resumeText = '';
    if (candidateId) {
      const extractedPath = path.join(UPLOADS_DIR, candidateId, 'extracted.txt');
      if (fs.existsSync(extractedPath)) resumeText = fs.readFileSync(extractedPath, 'utf8');
    }

    const userContent = context ? `Resume Context:\n${context}\n\nUser: ${question}` : question;
    let messages = [
      { role: 'system', content: TOOL_SYSTEM },
      { role: 'user', content: userContent },
    ];

    let pendingTunedId = null;

    // Tool calling loop — max 5 iterations
    for (let i = 0; i < 5; i++) {
      const msg = await callWithTools(messages);
      messages.push(msg);

      if (!msg.tool_calls?.length) {
        if (msg.content) sse(res, { token: msg.content });
        break;
      }

      for (const tc of msg.tool_calls) {
        const { name, arguments: args } = tc.function;
        let toolResult;

        if (name === 'tune_resume') {
          if (!resumeText) {
            toolResult = { success: false, error: 'Resume text not available — please upload first' };
            sse(res, { type: 'tool_result', name, ...toolResult });
          } else {
            toolResult = await executeTuneResume(args, resumeText, res);
            if (toolResult.tunedId) pendingTunedId = toolResult.tunedId;
          }
        } else if (name === 'send_email') {
          // Use pendingTunedId if AI omitted it (same-turn tune + send)
          const effectiveArgs = (!args.tuned_id && pendingTunedId)
            ? { ...args, tuned_id: pendingTunedId }
            : args;
          toolResult = await executeSendEmail(effectiveArgs, res);
        } else {
          toolResult = { error: `Unknown tool: ${name}` };
        }

        messages.push({ role: 'tool', content: JSON.stringify(toolResult) });
      }
    }

    res.write('data: [DONE]\n\n');
  } catch (err) {
    console.error('Chat error:', err);
    sse(res, { error: err.message });
    res.write('data: [DONE]\n\n');
  } finally {
    res.end();
  }
});

export default router;
