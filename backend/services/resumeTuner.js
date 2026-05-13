const OLLAMA_URL = 'http://localhost:11434';
const CHAT_MODEL = 'phi4-mini';

const TUNE_SYSTEM = `You are an expert professional resume writer. Rewrite and optimize the provided resume for the specific target role.

STRICT RULES:
1. COPY ---NAME--- and ---CONTACT--- EXACTLY as they appear in the original resume. Do NOT change the name, email, phone number, address, LinkedIn URL, website, or any personal detail — not even punctuation or formatting. Copy them character-for-character.
2. Preserve ALL factual details: real companies, actual job titles, actual dates, real education, genuine achievements.
3. NEVER invent experience, fake companies, or qualifications.
4. NEVER exaggerate skills unrealistically.
5. ONLY optimize: professional summary wording, bullet point phrasing, action verbs, skill ordering, and ATS keywords — nothing else.
6. Start your output IMMEDIATELY with ---NAME--- — no preamble, no extra text.

OUTPUT FORMAT — use EXACTLY these markers in order:

---NAME---
[COPY full name from resume — do not alter]

---CONTACT---
[COPY exactly from original — email, phone, address, linkedin, location — do NOT change anything]

---SUMMARY---
[2-3 sentences tailored professional summary for the target role]

---EXPERIENCE---
[Company Name | Job Title | Start Date – End Date]
- [Action-verb achievement bullet]
- [Action-verb achievement bullet]

[Next company entry…]

---SKILLS---
[Comma-separated skills, most relevant to target role listed first]

---EDUCATION---
[Institution | Degree | Year]

---EMAIL_SUBJECT---
Application for [Role] Position

---EMAIL_BODY---
Dear Hiring Team,

I am excited to apply for the [Role] position. Please find attached my resume tailored specifically for this opportunity.

[One sentence connecting candidate's real experience to the role.]

I would welcome the chance to discuss how my background aligns with your team's needs.

Best regards,
[Full Name]

---END---`;

// Extract the original name and contact block from the raw resume text.
// These are used to OVERWRITE whatever the AI generated, ensuring no personal
// detail ever changes during tuning.
export function extractOriginalDetails(rawText) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  // Name: first non-empty line
  const name = lines[0] || '';

  // Contact block: collect lines from the top that look like contact info
  // (contain @, phone patterns, linkedin, http, or short location-like text)
  // Stop at the first line that looks like a section heading or long sentence.
  const contactLines = [];
  for (let i = 1; i < Math.min(lines.length, 12); i++) {
    const l = lines[i];
    // Stop if it looks like a section heading (all caps, or long prose)
    if (/^[A-Z\s]{4,}$/.test(l) && l.length < 40) break;
    if (l.split(' ').length > 8) break;
    if (
      /@/.test(l) ||
      /\+?\d[\d\s\-().]{6,}/.test(l) ||
      /linkedin|github|http|www/i.test(l) ||
      /[a-z]{2,},\s*[a-z]/i.test(l) || // "City, Country"
      l.length < 80
    ) {
      contactLines.push(l);
    }
  }

  return {
    name,
    contact: contactLines.join(' | ').replace(/\s*\|\s*\|\s*/g, ' | ').trim(),
  };
}

export function parseSections(text) {
  const ORDER = ['NAME', 'CONTACT', 'SUMMARY', 'EXPERIENCE', 'SKILLS', 'EDUCATION', 'EMAIL_SUBJECT', 'EMAIL_BODY', 'END'];
  const KEY_MAP = {
    NAME: 'name', CONTACT: 'contact', SUMMARY: 'summary',
    EXPERIENCE: 'experience', SKILLS: 'skills', EDUCATION: 'education',
    EMAIL_SUBJECT: 'emailSubject', EMAIL_BODY: 'emailBody',
  };

  const result = {};

  for (let i = 0; i < ORDER.length - 1; i++) {
    const key = ORDER[i];
    const marker = `---${key}---`;
    const nextMarker = `---${ORDER[i + 1]}---`;

    const start = text.indexOf(marker);
    if (start === -1) { result[KEY_MAP[key] || key.toLowerCase()] = ''; continue; }

    const contentStart = start + marker.length;
    const end = text.indexOf(nextMarker, contentStart);
    result[KEY_MAP[key]] = (end === -1 ? text.slice(contentStart) : text.slice(contentStart, end)).trim();
  }

  return result;
}

// Streams tuned resume tokens to client (filtering out section markers).
// Returns full accumulated text for parsing.
export async function streamTune(resumeText, role, company, expressRes) {
  const userMessage = `Target Role: ${role}${company ? `\nTarget Company: ${company}` : ''}\n\nOriginal Resume:\n${resumeText}`;

  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: CHAT_MODEL,
      stream: true,
      messages: [
        { role: 'system', content: TUNE_SYSTEM },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value).split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const json = JSON.parse(line);
        if (json.message?.content) {
          const token = json.message.content;
          accumulated += token;
          // Strip section markers so preview shows clean content
          const display = token.replace(/---[A-Z_]+---\n?/g, '');
          if (display) {
            expressRes.write(`data: ${JSON.stringify({ token: display })}\n\n`);
          }
        }
        if (json.done) return accumulated;
      } catch {
        // skip malformed lines
      }
    }
  }

  return accumulated;
}
