import { useState } from 'react';
import UploadPanel from './components/UploadPanel';
import ChatPanel from './components/ChatPanel';

export default function App() {
  // { candidateId, candidateName, fileName }
  const [currentResume, setCurrentResume] = useState(null);
  const [sessionKey, setSessionKey] = useState(0);

  function handleStartNew() {
    setCurrentResume(null);
    setSessionKey(k => k + 1);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #0a0d1a 100%)' }}>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'radial-gradient(ellipse at 20% 20%, rgba(139,92,246,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(99,102,241,0.06) 0%, transparent 60%)'
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <header style={{ textAlign: 'center', padding: '36px 24px 28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 style={{
              fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', margin: 0,
              background: 'linear-gradient(135deg, #ffffff 30%, #a78bfa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>
              Resume Tuner AI
            </h1>
          </div>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
            Upload your resume · Tune for any role · Download + send to recruiter
          </p>
        </header>

        <main style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 28px 48px',
          display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20,
        }}>
          <UploadPanel
            key={sessionKey}
            currentResume={currentResume}
            onUploadSuccess={setCurrentResume}
            onReplace={() => setCurrentResume(null)}
          />
          <ChatPanel key={sessionKey} currentResume={currentResume} onStartNew={handleStartNew} />
        </main>
      </div>
    </div>
  );
}
