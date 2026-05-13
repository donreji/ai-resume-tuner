import express from 'express';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TUNED_DIR = path.join(__dirname, '..', 'tuned');

const router = express.Router();

function makeTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

function credentialsConfigured() {
  return !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

// Send tuned resume as job application email
router.post('/send-application', async (req, res) => {
  const { toEmail, subject, body, tunedId } = req.body;

  if (!toEmail) return res.status(400).json({ error: 'toEmail is required' });
  if (!tunedId) return res.status(400).json({ error: 'tunedId is required' });
  if (!credentialsConfigured()) {
    return res.status(500).json({ error: 'Email not configured. Set EMAIL_USER and EMAIL_PASS in backend/.env' });
  }

  const pdfPath = path.join(TUNED_DIR, tunedId, 'resume.pdf');
  if (!fs.existsSync(pdfPath)) {
    return res.status(404).json({ error: 'Tuned resume file not found. Please re-run the tune step.' });
  }

  // Read metadata for candidate name fallback
  let meta = {};
  try {
    meta = JSON.parse(fs.readFileSync(path.join(TUNED_DIR, tunedId, 'metadata.json'), 'utf8'));
  } catch { /* use defaults */ }

  const emailSubject = subject || meta.emailSubject || 'Job Application';
  const emailBody = body || meta.emailBody || '';

  try {
    const transporter = makeTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: toEmail,
      subject: emailSubject,
      text: emailBody,
      attachments: [{ filename: 'resume.pdf', path: pdfPath }],
    });

    res.json({ success: true, to: toEmail, subject: emailSubject });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
