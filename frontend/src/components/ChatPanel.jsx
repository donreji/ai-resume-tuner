import { useState, useRef, useEffect } from 'react';
import TuneResult from './TuneResult';

const SUGGESTIONS = [
  'Tune for frontend engineer',
  'Optimize for backend developer role',
  'Tailor for product manager position',
  'What are my strongest skills?',
  'Summarize my experience',
  'Tune for data scientist role',
  'How many years of experience do I have?',
  'Optimize for full-stack developer',
];

// Detect tune/optimize intent and extract role from message
function detectTuneIntent(message) {
  const tuneKeywords = /\b(tune|optimize|tailor|rewrite|customize|adapt|update)\b/i;
  if (!tuneKeywords.test(message)) return null;

  // Try to extract role: "tune for X role", "optimize for X position", "tune for X"
  const roleMatch = message.match(/(?:for\s+(?:the\s+)?|for\s+)([a-zA-Z\s\-\/]+?)(?:\s+role|\s+position|\s+job)?\s*(?:and|,|at\s|\.|$)/i);
  const role = roleMatch ? roleMatch[1].trim() : '';

  // Try to extract company: "at CompanyName"
  const companyMatch = message.match(/\bat\s+([A-Z][a-zA-Z\s]+?)(?:\s*,|\s*\.|$)/);
  const company = companyMatch ? companyMatch[1].trim() : '';

  return { isTune: true, role, company };
}

const card = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 20,
  backdropFilter: 'blur(12px)',
  display: 'flex',
  flexDirection: 'column',
  height: 700,
  overflow: 'hidden',
  position: 'relative',
};

export default function ChatPanel({ currentResume, onStartNew }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef(null);

  const resumeReady = !!currentResume;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text) {
    if (!text.trim() || streaming || !resumeReady) return;
    setInput('');
    setStreaming(true);

    const tuneIntent = detectTuneIntent(text);

    if (tuneIntent) {
      await handleTune(text, tuneIntent);
    } else {
      await handleChat(text);
    }

    setStreaming(false);
  }

  async function handleChat(question) {
    setMessages(prev => [...prev, { role: 'user', content: question }, { role: 'ai', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') break;
          try {
            const { token, error } = JSON.parse(payload);
            if (error) throw new Error(error);
            if (token) {
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...updated[updated.length - 1], content: updated[updated.length - 1].content + token };
                return updated;
              });
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: 'ai', content: `Error: ${err.message}` }; return u; });
    }
  }

  async function handleTune(originalText, { role, company }) {
    const label = role ? `Tuning for "${role}"…` : 'Tuning resume…';
    // Add tune message slot
    setMessages(prev => [...prev,
      { role: 'user', content: originalText },
      { role: 'tune', label, streamedText: '', tunedId: null, emailDraft: null, streaming: true },
    ]);

    try {
      const res = await fetch('/api/tune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: currentResume.candidateId, role: role || 'the specified role', company }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') break;
          try {
            const parsed = JSON.parse(payload);
            if (parsed.error) throw new Error(parsed.error);

            if (parsed.token) {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                updated[updated.length - 1] = { ...last, streamedText: last.streamedText + parsed.token };
                return updated;
              });
            }
            if (parsed.type === 'files') {
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...updated[updated.length - 1], tunedId: parsed.tunedId };
                return updated;
              });
            }
            if (parsed.type === 'email') {
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  emailDraft: { subject: parsed.subject, body: parsed.body },
                  streaming: false,
                };
                return updated;
              });
            }
          } catch (e) {
            if (e.message) {
              setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: 'tune', streamedText: `Error: ${e.message}`, tunedId: null, emailDraft: null, streaming: false }; return u; });
            }
          }
        }
      }
    } catch (err) {
      setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: 'tune', streamedText: `Error: ${err.message}`, tunedId: null, emailDraft: null, streaming: false }; return u; });
    }
  }

  return (
    <div style={card}>
      {/* Disabled overlay */}
      {!resumeReady && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 10, borderRadius: 20, background: 'rgba(10,10,15,0.75)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#a78bfa" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>Upload your resume to get started</p>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: 0 }}>AI Resume Assistant</h2>
          <p style={{ color: '#6b7280', fontSize: 13, margin: '3px 0 0' }}>Ask about your resume · type "tune for [role]" to optimize</p>
        </div>
        <button
          onClick={onStartNew}
          title="Clear everything and start over"
          style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '6px 12px', color: '#9ca3af', fontSize: 12, fontWeight: 500,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s', whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
        >
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Start New
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.length === 0 && resumeReady && (
          <div style={{ textAlign: 'center', paddingTop: 20 }}>
            <p style={{ color: '#374151', fontSize: 13 }}>Ask a question or type "tune for [role]" to optimize your resume</p>
          </div>
        )}

        {messages.map((msg, i) => {
          if (msg.role === 'user') {
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ maxWidth: '78%', padding: '10px 14px', borderRadius: '16px 16px 4px 16px', fontSize: 14, lineHeight: 1.6, background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff' }}>
                  {msg.content}
                </div>
              </div>
            );
          }

          if (msg.role === 'tune') {
            return (
              <div key={i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.3))', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#a78bfa" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span style={{ color: '#9ca3af', fontSize: 13 }}>{msg.label || 'Tuning resume…'}</span>
                </div>
                <TuneResult
                  tunedId={msg.tunedId}
                  streamedText={msg.streamedText}
                  emailDraft={msg.emailDraft}
                  streaming={msg.streaming}
                />
              </div>
            );
          }

          // Regular AI message
          return (
            <div key={i} style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginRight: 8, marginTop: 2, background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.3))', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#a78bfa" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .116 2.9-1.379 2.8l-1.768-.25" />
                </svg>
              </div>
              <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: '16px 16px 16px 4px', fontSize: 14, lineHeight: 1.65, wordBreak: 'break-word', background: 'rgba(255,255,255,0.06)', color: '#d1d5db', border: '1px solid rgba(255,255,255,0.08)', whiteSpace: 'pre-wrap' }}>
                {msg.content || (streaming && i === messages.length - 1
                  ? <span style={{ display: 'inline-block', width: 8, height: 14, background: '#7c3aed', borderRadius: 2, animation: 'pulse 1s infinite', verticalAlign: 'middle' }} />
                  : null)}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {resumeReady && messages.length === 0 && (
        <div style={{ padding: '0 20px 12px', display: 'flex', flexWrap: 'wrap', gap: 6, flexShrink: 0 }}>
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => sendMessage(s)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '5px 12px', color: '#9ca3af', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.2)'; e.currentTarget.style.color = '#c4b5fd'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '12px 20px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} style={{ display: 'flex', gap: 10 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={resumeReady ? 'Ask about your resume or "tune for frontend engineer"…' : 'Upload resume first'}
            disabled={!resumeReady || streaming}
            style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 16px', color: '#fff', fontSize: 14, outline: 'none', opacity: (!resumeReady || streaming) ? 0.4 : 1 }}
            onFocus={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.6)'}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
          <button
            type="submit"
            disabled={!resumeReady || streaming || !input.trim()}
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: 'none', borderRadius: 12, padding: '10px 18px', color: '#fff', fontSize: 14, fontWeight: 500, cursor: (!resumeReady || streaming || !input.trim()) ? 'not-allowed' : 'pointer', opacity: (!resumeReady || streaming || !input.trim()) ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
            Send
          </button>
        </form>
      </div>

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        div::-webkit-scrollbar{width:4px}
        div::-webkit-scrollbar-track{background:transparent}
        div::-webkit-scrollbar-thumb{background:rgba(124,58,237,0.3);border-radius:2px}
      `}</style>
    </div>
  );
}
