const OLLAMA_URL = 'http://localhost:11434';
const EMBED_MODEL = 'nomic-embed-text';
const CHAT_MODEL = 'phi4-mini';

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
