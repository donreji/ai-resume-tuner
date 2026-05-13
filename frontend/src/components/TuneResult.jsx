import { useState } from 'react';

export default function TuneResult({ tunedId, streamedText, emailDraft, streaming }) {
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState(emailDraft?.subject || '');
  const [body, setBody] = useState(emailDraft?.body || '');
  const [sending, setSending] = useState(false);
  const [emailResult, setEmailResult] = useState(null);

  // Sync email draft when it arrives
  if (emailDraft && !subject) {
    setSubject(emailDraft.subject || '');
    setBody(emailDraft.body || '');
  }

  async function sendEmail() {
    if (!toEmail.trim() || sending) return;
    setSending(true);
    setEmailResult(null);
    try {
      const res = await fetch('/api/email/send-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toEmail: toEmail.trim(), subject, body, tunedId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEmailResult({ ok: true, msg: `Application sent to ${data.to}` });
    } catch (err) {
      setEmailResult({ ok: false, msg: err.message });
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>

      {/* Streaming preview / result */}
      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14, overflow: 'hidden',
      }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
          {streaming ? (
            <>
              <svg style={{ animation: 'spin 1s linear infinite', width: 14, height: 14, flexShrink: 0 }} viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="rgba(124,58,237,0.4)" strokeWidth="2" />
                <path d="M12 3a9 9 0 0 1 9 9" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span style={{ color: '#a78bfa', fontSize: 13, fontWeight: 500 }}>Tuning resume…</span>
            </>
          ) : (
            <>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span style={{ color: '#6ee7b7', fontSize: 13, fontWeight: 500 }}>Resume tuned successfully</span>
            </>
          )}
        </div>
        <pre style={{
          padding: '14px 16px', margin: 0, fontSize: 11.5, lineHeight: 1.65,
          color: '#9ca3af', fontFamily: 'ui-monospace, monospace',
          maxHeight: 240, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {streamedText || ' '}
          {streaming && <span style={{ display: 'inline-block', width: 7, height: 13, background: '#7c3aed', borderRadius: 2, animation: 'pulse 1s infinite', verticalAlign: 'middle', marginLeft: 2 }} />}
        </pre>
      </div>

      {/* Download buttons */}
      {tunedId && !streaming && (
        <div style={{ display: 'flex', gap: 8 }}>
          <a
            href={`/api/tuned/${tunedId}/pdf`}
            style={{
              flex: 1, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.35)',
              borderRadius: 10, padding: '9px 0', color: '#c4b5fd', fontSize: 13, fontWeight: 500,
              textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF
          </a>
          <a
            href={`/api/tuned/${tunedId}/docx`}
            style={{
              flex: 1, background: 'rgba(79,70,229,0.15)', border: '1px solid rgba(79,70,229,0.35)',
              borderRadius: 10, padding: '9px 0', color: '#a5b4fc', fontSize: 13, fontWeight: 500,
              textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download DOCX
          </a>
        </div>
      )}

      {/* Email section */}
      {tunedId && !streaming && (
        <div style={{
          background: 'rgba(79,70,229,0.07)', border: '1px solid rgba(79,70,229,0.2)',
          borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <p style={{ color: '#c4b5fd', fontSize: 13, fontWeight: 600, margin: 0 }}>Send application to recruiter</p>

          {emailResult ? (
            <p style={{ margin: 0, fontSize: 13, color: emailResult.ok ? '#6ee7b7' : '#f87171' }}>
              {emailResult.msg}
            </p>
          ) : (
            <>
              <input
                type="email"
                value={toEmail}
                onChange={e => setToEmail(e.target.value)}
                placeholder="Recruiter email address"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 13, outline: 'none' }}
              />
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Email subject"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 13, outline: 'none' }}
              />
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={5}
                placeholder="Email body"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '8px 12px', color: '#d1d5db', fontSize: 12, outline: 'none', resize: 'vertical', lineHeight: 1.6 }}
              />
              <button
                onClick={sendEmail}
                disabled={sending || !toEmail.trim()}
                style={{
                  background: sending || !toEmail.trim() ? 'rgba(124,58,237,0.3)' : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                  border: 'none', borderRadius: 8, padding: '10px 0', color: '#fff',
                  fontSize: 13, fontWeight: 600, cursor: sending || !toEmail.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {sending ? 'Sending…' : 'Send Application Email'}
              </button>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
      `}</style>
    </div>
  );
}
