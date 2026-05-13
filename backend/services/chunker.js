const CHUNK_SIZE = 500;
const OVERLAP = 100;

export function chunkText(text) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const chunks = [];
  let start = 0;

  while (start < normalized.length) {
    const end = Math.min(start + CHUNK_SIZE, normalized.length);
    chunks.push(normalized.slice(start, end).trim());
    if (end === normalized.length) break;
    start += CHUNK_SIZE - OVERLAP;
  }

  return chunks.filter(c => c.length > 20);
}
