import express from 'express';
import { getEmbedding, streamChat } from '../services/ollama.js';
import { searchChunks, collectionExists } from '../services/qdrant.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: 'question is required' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const hasData = await collectionExists();
    if (!hasData) {
      res.write(`data: ${JSON.stringify({ token: 'No resume uploaded yet. Please upload your resume first.' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    const queryEmbedding = await getEmbedding(question);
    const chunks = await searchChunks(queryEmbedding, 8);
    const context = chunks.join('\n\n---\n\n');

    await streamChat(context, question, res);
    res.write('data: [DONE]\n\n');
  } catch (err) {
    console.error('Chat error:', err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.write('data: [DONE]\n\n');
  } finally {
    res.end();
  }
});

export default router;
