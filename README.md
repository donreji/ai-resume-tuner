# AI Resume Tuner

A local AI-powered resume tailoring assistant. Upload your resume, optimize it for any job role, download a professionally formatted PDF or DOCX, and send a job application email — all from a single interface.

---

## Features

- **Resume Q&A** — Ask anything about your uploaded resume
- **Role-based tuning** — AI rewrites your resume for a specific job role (ATS-optimized, stronger bullet points, tailored summary)
- **PDF & DOCX generation** — Download your tuned resume in both formats instantly
- **Auto-generated email** — AI drafts a professional job application email with your resume attached
- **Email sending** — Send directly to a recruiter's inbox via Gmail SMTP
- **Personal details protected** — Name, contact info, address are never altered during tuning
- **Strict scope** — Rejects off-topic questions; only resume and hiring tasks are answered

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, plain CSS-in-JS |
| Backend | Node.js (ESM), Express |
| AI / LLM | Ollama (`phi4-mini` for chat/tuning, `nomic-embed-text` for embeddings) |
| Vector DB | Qdrant (local) |
| PDF generation | pdfkit |
| DOCX generation | docx |
| Email | Nodemailer + Gmail App Password |
| File parsing | pdf-parse, mammoth |

---

## Prerequisites

- **Node.js** v18+
- **Ollama** running locally at `http://localhost:11434`
  - Pull required models:
    ```bash
    ollama pull phi4-mini
    ollama pull nomic-embed-text
    ```
- **Qdrant** running locally at `http://localhost:6333`
  ```bash
  docker run -p 6333:6333 qdrant/qdrant
  ```
- A **Gmail account** with an [App Password](https://myaccount.google.com/apppasswords) for sending emails

---

## Installation

### 1. Clone the repo

```bash
git clone <repo-url>
cd ai-resume-tuner
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 4. Configure environment variables

Edit `backend/.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
```

> Use a [Gmail App Password](https://myaccount.google.com/apppasswords), not your regular Gmail password.

---

## Running the App

Start both servers (in separate terminals):

```bash
# Terminal 1 — backend
cd backend
npm run dev

# Terminal 2 — frontend
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## How to Use

### 1. Upload your resume
Drop a PDF or DOCX file, then click **Process Resume**. The AI reads and embeds your resume.

### 2. Ask questions (optional)
Type any question about your resume — experience, skills, years, projects, etc.

### 3. Tune for a role
Type a message like:
```
tune for frontend engineer
optimize for backend developer role
tailor for product manager at Acme Corp
```
The AI rewrites your resume for that role in real time.

### 4. Download
Click **Download PDF** or **Download DOCX** to save your tuned resume.

### 5. Send application email
Enter the recruiter's email address. The AI pre-fills the subject and body — edit if needed — then click **Send Application Email**. Your tuned resume PDF is attached automatically.

### 6. Start over
Click **Start New** (top-right of the chat panel) to reset everything.

---

## Project Structure

```
ai-resume-tuner/
├── backend/
│   ├── routes/
│   │   ├── upload.js        # Resume upload + text extraction + embedding
│   │   ├── chat.js          # Resume Q&A (vector search + Ollama)
│   │   ├── tune.js          # Resume tuning SSE endpoint
│   │   ├── tuned.js         # Serve generated PDF / DOCX
│   │   └── email.js         # Send application email with attachment
│   ├── services/
│   │   ├── resumeTuner.js   # Ollama streaming + section parser
│   │   ├── pdfGenerator.js  # pdfkit PDF generation
│   │   ├── docxGenerator.js # docx package DOCX generation
│   │   ├── ollama.js        # Embedding + chat streaming
│   │   ├── qdrant.js        # Vector store operations
│   │   ├── parser.js        # PDF / DOCX text extraction
│   │   └── chunker.js       # Text chunking for embeddings
│   ├── uploads/             # Uploaded resume files (gitignored)
│   ├── tuned/               # Generated tuned resumes (gitignored)
│   ├── server.js
│   └── .env                 # Email credentials (gitignored)
├── frontend/
│   └── src/
│       ├── App.jsx
│       └── components/
│           ├── UploadPanel.jsx   # File select + upload UI
│           ├── ChatPanel.jsx     # Chat + tune intent detection
│           └── TuneResult.jsx    # Tuned resume preview + download + email
├── .gitignore
└── README.md
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/upload` | Upload and process a resume |
| `POST` | `/chat` | Ask a question about the uploaded resume |
| `POST` | `/tune` | Tune resume for a role (SSE stream) |
| `GET` | `/tuned/:id/pdf` | Download tuned resume as PDF |
| `GET` | `/tuned/:id/docx` | Download tuned resume as DOCX |
| `POST` | `/email/send-application` | Send tuned resume to recruiter |

---

## Notes

- All AI processing is **fully local** — no data leaves your machine except the outbound email.
- Each new resume upload replaces the previous one in the vector store.
- The tuning AI is instructed never to alter your name, email, phone, address, or any personal contact details.
