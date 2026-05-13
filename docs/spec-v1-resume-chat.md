Create a simple modern AI Resume Chat web application using local RAG with Ollama and Qdrant.

Tech Stack:
- Vite + React
- JavaScript
- Tailwind CSS
- Node.js + Express backend
- Ollama
- LangChain
- Qdrant Vector Database
- pdf-parse
- mammoth (DOCX parsing)
- Responsive dark modern UI

==================================================
GOAL
==================================================

Build a simple local AI Resume Chat application where:

1. User uploads a resume (PDF/DOCX)
2. Backend extracts text from resume
3. Resume text is chunked
4. Embeddings are generated locally
5. Embeddings are stored in Qdrant
6. User asks questions about the candidate
7. AI answers ONLY based on the uploaded resume using RAG

Everything should run locally.

==================================================
WHY QDRANT
==================================================

Use Qdrant as the vector database because:
- fast semantic search
- lightweight local setup
- scalable later
- clean API
- production-friendly
- better long-term choice for RAG systems

==================================================
WHY NODE.JS BACKEND
==================================================

Use Node.js + Express backend because:
- simpler integration with Vite frontend
- single language across frontend/backend
- easier Ollama integration
- better MVP development speed

Do NOT use Python backend.

==================================================
ARCHITECTURE
==================================================

Frontend:
- Vite React app
- Upload UI
- AI chat interface

Backend:
- Express server
- Resume parsing
- RAG pipeline
- Ollama communication
- Qdrant integration

==================================================
MAIN FLOW
==================================================

Upload Resume
→ Extract Resume Text
→ Chunk Text
→ Generate Embeddings using nomic-embed-text
→ Store vectors in Qdrant
→ User asks question
→ Retrieve relevant chunks from Qdrant
→ Send context + question to phi4-mini
→ Generate answer

==================================================
OLLAMA MODELS
==================================================

Use local Ollama models:

Chat Model:
- phi4-mini

Embedding Model:
- nomic-embed-text

==================================================
AI RULES
==================================================

AI must:
- answer ONLY from resume context
- never hallucinate
- never invent skills or experience
- respond:
  "Information not found in resume"
  if answer does not exist

Responses should be:
- concise
- factual
- recruiter-friendly

==================================================
UI REQUIREMENTS
==================================================

Create a single-page application only.

No:
- dashboard
- authentication
- admin panel
- unnecessary routing

==================================================
PAGE LAYOUT
==================================================

TOP:
- App title
- Subtitle

MAIN CONTENT:
Responsive two-column layout.

LEFT SIDE:
- Drag & drop resume upload
- Upload button
- File preview
- Upload progress
- Resume processed state

RIGHT SIDE:
- AI chat interface
- Chat messages
- User question input
- Send button
- Suggested questions

==================================================
SUGGESTED QUESTIONS
==================================================

Provide clickable example prompts:

- Summarize this candidate
- What skills are mentioned?
- Does candidate know Node.js?
- What frontend experience exists?
- Any backend experience?
- Any leadership experience?
- What projects are mentioned?
- Is AWS mentioned?
- How many years of experience?

==================================================
CHAT FLOW
==================================================

When user asks question:

1. Retrieve relevant chunks from Qdrant
2. Send retrieved context + user question to phi4-mini
3. Generate answer
4. Stream response to frontend

==================================================
PROMPT TEMPLATE
==================================================

Use this system prompt:

"You are an AI resume assistant.

Answer questions ONLY from the provided resume context.

If the answer is not found in the resume,
respond with:
'Information not found in resume.'

Do not make assumptions.
Do not hallucinate.
Keep responses concise and factual."

==================================================
BACKEND REQUIREMENTS
==================================================

Implement:
- Express server
- File upload API
- PDF parsing
- DOCX parsing
- Resume chunking
- Embedding generation
- Qdrant vector storage
- Semantic retrieval
- Ollama integration
- Streaming responses

==================================================
API ENDPOINTS
==================================================

Create:

POST /upload
- upload and process resume

POST /chat
- ask questions about uploaded resume

GET /health
- health check

==================================================
QDRANT SETUP
==================================================

Use local Qdrant instance.

Example Docker command:

docker run -p 6333:6333 qdrant/qdrant

Store:
- chunk text
- embeddings
- metadata

==================================================
UI STYLE
==================================================

Design should feel:
- modern
- premium
- futuristic
- minimal
- AI-powered

Use:
- dark theme
- subtle gradients
- glassmorphism cards
- rounded 2xl corners
- smooth hover effects
- elegant typography
- organized spacing

Avoid:
- clutter
- generic admin dashboards
- excessive animations

==================================================
IMPORTANT
==================================================

Keep architecture:
- simple
- clean
- beginner friendly
- maintainable

Avoid:
- agents
- MCP
- LangGraph
- microservices
- unnecessary abstractions

Focus on:
- working local RAG
- clean UX
- fast resume chat experience
- practical implementation