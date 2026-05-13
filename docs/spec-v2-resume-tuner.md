# Spec v2 — AI Resume Tuner with MCP Tool Calling

## Overview

Local AI-powered resume tailoring assistant. Upload a resume, ask the AI anything — it autonomously decides whether to answer a question, tune the resume, send an application email, or do all of the above in one message.

---

## Architecture

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite |
| Backend | Node.js ESM + Express |
| Tool routing | Ollama `llama3.1` (tool/function calling) |
| Resume tuning | Ollama `phi4-mini` (streaming) |
| Embeddings | Ollama `nomic-embed-text` |
| Vector DB | Qdrant (local) |
| PDF | pdfkit |
| DOCX | docx npm package |
| Email | Nodemailer + Gmail SMTP |

---

## Complete Flow

```
Upload resume
  → User sends any message
  → llama3.1 routes the intent (tool call or direct answer)
      ├── Q&A → answer from RAG context
      ├── tune_resume tool → phi4-mini rewrites resume → PDF + DOCX generated
      └── send_email tool → attach PDF → send via Gmail SMTP
  → Frontend renders result inline in chat
```

---

## MCP Tool Calling

The `/chat` endpoint uses `llama3.1` with two tools defined. The AI decides autonomously which tool(s) to call based on the user message.

### Tool: `tune_resume`

Called when user asks to tune, optimize, tailor, customize, or rewrite their resume.

Parameters:
- `role` (required) — target job role, e.g. `"frontend engineer"`
- `company` (optional) — target company name

What happens:
1. Backend emits `{ type: 'tool_start', name: 'tune_resume', args }` SSE event
2. `phi4-mini` rewrites the resume (tokens stream live to the UI)
3. Sections parsed, original name/contact hard-enforced
4. PDF + DOCX generated, saved to `tuned/{tunedId}/`
5. Backend emits `{ type: 'files', tunedId }` and `{ type: 'email', subject, body }` SSE events

### Tool: `send_email`

Called when user provides a recruiter email address and wants to send their application.

Parameters:
- `to_email` (required) — recruiter's email address
- `tuned_id` (required) — ID from a prior `tune_resume` call

What happens:
1. Backend emits `{ type: 'tool_start', name: 'send_email', args }` SSE event
2. Reads `tuned/{tunedId}/resume.pdf` and `metadata.json`
3. Sends via nodemailer with PDF attached
4. Backend emits `{ type: 'tool_result', name: 'send_email', success, to }` SSE event

### Same-turn tune + send

When the user says "tune for X and send to recruiter@company.com" in a single message:
1. `llama3.1` calls `tune_resume` → backend executes, returns `tunedId`
2. `llama3.1` calls `send_email` with `tunedId` from step 1
3. Backend uses a `pendingTunedId` fallback if the AI omits the `tuned_id`

---

## Tool Calling Loop

`routes/chat.js` runs a loop (max 5 iterations):

```
callWithTools(messages)
  if tool_calls:
    for each tool call:
      execute tool → emit SSE events → push tool result to messages
    repeat loop
  else:
    emit final text response → done
```

---

## Personal Details Protection

Two-layer enforcement — AI never alters name, email, phone, address, or any contact info:

1. **Prompt** — `TUNE_SYSTEM` explicitly forbids changing `---NAME---` and `---CONTACT---`
2. **Code** — `extractOriginalDetails()` reads the original uploaded text and overwrites whatever the AI generated

---

## SSE Event Types

All communication from `/chat` is via Server-Sent Events:

| Event | Payload | Meaning |
|---|---|---|
| `token` | `{ token }` | AI text chunk (Q&A reply or final summary) |
| `tool_start` | `{ type, name, args }` | Tool about to execute |
| `token` (during tune) | `{ token }` | Tuned resume content streaming |
| `files` | `{ type, tunedId }` | PDF + DOCX ready |
| `email` | `{ type, subject, body }` | AI-generated email draft ready |
| `tool_result` | `{ type, name, success, to? }` | Tool execution result |

---

## Chat Examples

```
"Tune for senior frontend engineer"
"Optimize for backend developer role"
"Tailor for product manager at Acme Corp"
"Tune for data scientist and send to recruiter@company.com"
"What are my strongest skills?"
"How many years of experience do I have?"
```

---

## UI Behavior

- All messages go through a single chat input — no separate tune button
- When `tune_resume` tool fires: a **TuneResult** card appears inline with streaming preview
- After tuning: Download PDF + Download DOCX buttons appear; email form pre-filled from AI draft
- When `send_email` tool fires: status line shown in AI message bubble
- Regular Q&A renders as plain AI message bubbles

---

## AI Rules

Must NOT:
- invent fake experience, companies, or qualifications
- exaggerate skills unrealistically
- alter name, contact, address, phone, or any personal detail

Should:
- optimize wording, action verbs, ATS keywords
- reorder skills by relevance to target role
- tailor professional summary
- preserve all factual information

---

## Strict Scope

Only supports resume and career topics. For anything unrelated:

> "This assistant only supports resume optimization and career tasks."

---

## Environment

`backend/.env`:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
```

Use a Gmail App Password — not your regular Gmail password.

---

## Required Ollama Models

```bash
ollama pull llama3.1          # tool routing
ollama pull phi4-mini         # resume tuning
ollama pull nomic-embed-text  # embeddings
```
