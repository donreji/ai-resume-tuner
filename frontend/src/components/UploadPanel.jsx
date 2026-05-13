import { useState, useRef } from 'react';

const ACCEPTED = '.pdf,.doc,.docx';

const card = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 20,
  padding: 24,
  backdropFilter: 'blur(12px)',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

export default function UploadPanel({ currentResume, onUploadSuccess, onReplace }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [state, setState] = useState('idle'); // idle | uploading | error
  const [errorMsg, setErrorMsg] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  function selectFile(file) {
    if (!file) return;
    setSelectedFile(file);
    setState('idle');
    setErrorMsg('');
  }

  function handleReplace() {
    setSelectedFile(null);
    setState('idle');
    setErrorMsg('');
    onReplace();
  }

  async function processUpload() {
    if (!selectedFile || state === 'uploading') return;
    setState('uploading');
    setErrorMsg('');
    const form = new FormData();
    form.append('resume', selectedFile);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setSelectedFile(null);
      setState('idle');
      onUploadSuccess({ candidateId: data.candidateId, candidateName: data.candidateName, fileName: data.fileName });
    } catch (err) {
      setErrorMsg(err.message);
      setState('error');
    }
  }

  // === Showing uploaded resume (ready state) ===
  if (currentResume) {
    return (
      <div style={card}>
        <div>
          <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: 0 }}>Resume Tuner AI</h2>
          <p style={{ color: '#6b7280', fontSize: 13, margin: '3px 0 0' }}>Ready to tune for any role</p>
        </div>

        {/* Current resume card */}
        <div style={{
          background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.25)',
          borderRadius: 14, padding: '16px 18px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ color: '#6ee7b7', fontSize: 14, fontWeight: 600, margin: 0 }}>{currentResume.candidateName}</p>
              <p style={{ color: '#4b5563', fontSize: 11, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentResume.fileName}</p>
            </div>
          </div>
          <p style={{ color: '#6b7280', fontSize: 12, margin: 0 }}>Resume loaded and ready for tuning</p>
        </div>

        {/* How-to tips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            ['Tune', 'Type "tune for [role]" in the chat'],
            ['Q&A', 'Ask anything about your resume'],
            ['Email', 'Send tuned resume to a recruiter'],
          ].map(([label, desc]) => (
            <div key={label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 6, padding: '1px 7px', fontSize: 10, fontWeight: 700, color: '#c4b5fd', flexShrink: 0, marginTop: 1 }}>{label}</span>
              <span style={{ color: '#4b5563', fontSize: 12, lineHeight: 1.5 }}>{desc}</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleReplace}
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 14px', color: '#6b7280', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'; e.currentTarget.style.color = '#c4b5fd'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#6b7280'; }}
        >
          Replace resume
        </button>
      </div>
    );
  }

  // === No resume yet — select + upload ===
  return (
    <div style={card}>
      <div>
        <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: 0 }}>Upload Your Resume</h2>
        <p style={{ color: '#6b7280', fontSize: 13, margin: '3px 0 0' }}>Select a file, then click Process</p>
      </div>

      {/* Drop zone */}
      <div
        style={{
          border: `2px dashed ${dragging ? '#7c3aed' : selectedFile ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.12)'}`,
          borderRadius: 14, padding: '28px 20px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
          cursor: state === 'uploading' ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          background: dragging ? 'rgba(124,58,237,0.08)' : selectedFile ? 'rgba(124,58,237,0.04)' : 'rgba(255,255,255,0.02)',
          minHeight: 130,
        }}
        onDragOver={e => { e.preventDefault(); if (state !== 'uploading') setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); if (state !== 'uploading') selectFile(e.dataTransfer.files[0]); }}
        onClick={() => state !== 'uploading' && inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept={ACCEPTED} style={{ display: 'none' }}
          onChange={e => { selectFile(e.target.files[0]); e.target.value = ''; }} />

        {state === 'uploading' ? (
          <>
            <svg style={{ animation: 'spin 1s linear infinite', width: 36, height: 36 }} viewBox="0 0 24 24" fill="none">
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <circle cx="12" cy="12" r="9" stroke="rgba(124,58,237,0.3)" strokeWidth="2" />
              <path d="M12 3a9 9 0 0 1 9 9" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p style={{ color: '#c4b5fd', fontSize: 13, margin: 0 }}>Processing resume…</p>
          </>
        ) : selectedFile ? (
          <>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#c4b5fd" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#e5e7eb', fontSize: 13, fontWeight: 500, margin: '0 0 2px', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</p>
              <p style={{ color: '#6b7280', fontSize: 11, margin: 0 }}>Click to change file</p>
            </div>
          </>
        ) : (
          <>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#a78bfa" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#d1d5db', fontSize: 13, fontWeight: 500, margin: '0 0 2px' }}>Drop your resume here</p>
              <p style={{ color: '#4b5563', fontSize: 12, margin: 0 }}>PDF or DOCX · click to browse</p>
            </div>
          </>
        )}
      </div>

      {/* Error message */}
      {state === 'error' && (
        <p style={{ color: '#f87171', fontSize: 12, margin: 0 }}>{errorMsg}</p>
      )}

      {/* Process button — only shown once a file is selected */}
      {selectedFile && state !== 'uploading' && (
        <button
          onClick={processUpload}
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: 'none',
            borderRadius: 10, padding: '11px 0', color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          Process Resume
        </button>
      )}

      {!selectedFile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {['PDF or DOCX format', 'AI reads and embeds your resume', 'Then tune it for any job role'].map(tip => (
            <div key={tip} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#7c3aed', flexShrink: 0 }} />
              <span style={{ color: '#4b5563', fontSize: 12 }}>{tip}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
