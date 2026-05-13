const OLLAMA_URL = 'http://localhost:11434';
const EMBED_MODEL = 'nomic-embed-text';
const CHAT_MODEL = 'phi4-mini';
const TOOL_MODEL = 'llama3.1';

// Used by the /chat Q&A endpoint
const QA_SYSTEM_PROMPT = `You are an AI resume coach. You can ONLY answer questions about:
- The candidate's uploaded resume
- Career advice related to the resume
- Job interview preparation
- Skills and experience from the resume

If asked anything unrelated to resumes, careers, or the uploaded resume, respond ONLY with:
"This assistant only supports resume optimization and candidate screening tasks."

Answer concisely and factually based only on the provided resume context. Do not invent information.`;

export async function getEmbedding(text) {
  const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: text }),
  });
  const data = await res.json();
  return data.embedding;
}

export const TOOL_SYSTEM = `You are an AI resume coach. Help job seekers with their resumes using these tools when needed:
- tune_resume: Call when the user asks to tune, optimize, tailor, customize, or rewrite their resume for a role.
- send_email: Call when the user provides a recruiter email and wants to send their application. Use the tuned_id returned by tune_resume.

If the user asks to tune AND send email in the same message, call tune_resume first, then send_email with the returned tuned_id.
For general questions about the resume, answer directly using the provided context.
Only respond to resume and career-related topics. For anything else reply: "This assistant only supports resume optimization and career tasks."`;

export const RESUME_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'tune_resume',
      description: 'Rewrite and optimize the resume for a specific job role. Call this when the user asks to tune, optimize, tailor, customize, or rewrite their resume.',
      parameters: {
        type: 'object',
        properties: {
          role: { type: 'string', description: 'Target job role, e.g. "frontend engineer", "product manager"' },
          company: { type: 'string', description: 'Optional target company name' },
        },
        required: ['role'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_email',
      description: 'Send the tuned resume as a job application email to a recruiter. Requires tuned_id from a prior tune_resume call.',
      parameters: {
        type: 'object',
        properties: {
          to_email: { type: 'string', description: "Recruiter's email address" },
          tuned_id: { type: 'string', description: 'The tuned resume ID returned by tune_resume' },
        },
        required: ['to_email', 'tuned_id'],
      },
    },
  },
];

export async function callWithTools(messages) {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: TOOL_MODEL,
      stream: false,
      tools: RESUME_TOOLS,
      messages,
    }),
  });
  const data = await res.json();
  return data.message; // { role, content, tool_calls? }
}

export async function streamChat(context, question, expressRes) {
  const userMessage = `Resume Context:\n${context}\n\nQuestion: ${question}`;

  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: CHAT_MODEL,
      stream: true,
      messages: [
        { role: 'system', content: QA_SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value).split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const json = JSON.parse(line);
        if (json.message?.content) {
          expressRes.write(`data: ${JSON.stringify({ token: json.message.content })}\n\n`);
        }
        if (json.done) return;
      } catch {
        // skip malformed
      }
    }
  }
}
