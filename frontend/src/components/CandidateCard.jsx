export default function CandidateCard({ candidate }) {
  const { candidateId, candidateName, fileName, score } = candidate;

  const viewUrl = `/api/candidates/${candidateId}/view`;
  const downloadUrl = `/api/candidates/${candidateId}/file`;

  return (
    <div style={{
      background: 'rgba(124,58,237,0.08)',
      border: '1px solid rgba(124,58,237,0.25)',
      borderRadius: 12,
      padding: '12px 14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(79,70,229,0.4))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#c4b5fd" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <span style={{ color: '#e5e7eb', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {candidateName}
          </span>
          {score != null && (
            <span style={{
              background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: 20, padding: '1px 8px', color: '#6ee7b7', fontSize: 11, fontWeight: 600, flexShrink: 0,
            }}>
              {score}% match
            </span>
          )}
        </div>
        <p style={{ color: '#6b7280', fontSize: 11, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {fileName}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <a
          href={viewUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)',
            borderRadius: 8, padding: '5px 10px', color: '#c4b5fd', fontSize: 12, fontWeight: 500,
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View
        </a>
        <a
          href={downloadUrl}
          style={{
            background: 'rgba(79,70,229,0.2)', border: '1px solid rgba(79,70,229,0.4)',
            borderRadius: 8, padding: '5px 10px', color: '#a5b4fc', fontSize: 12, fontWeight: 500,
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </a>
      </div>
    </div>
  );
}
