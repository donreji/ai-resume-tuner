import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import uploadRouter from './routes/upload.js';
import chatRouter from './routes/chat.js';
import tuneRouter from './routes/tune.js';
import tunedRouter from './routes/tuned.js';
import emailRouter from './routes/email.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/upload', uploadRouter);
app.use('/chat', chatRouter);
app.use('/tune', tuneRouter);
app.use('/tuned', tunedRouter);
app.use('/email', emailRouter);

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
