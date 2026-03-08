export default function V50ArchitecturePage() {
  return (
    <div style={{
      background: '#1e1e2e',
      minHeight: '100vh',
      padding: '16px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '12px',
      }}>
        <h1 style={{
          color: '#e2e8f0',
          fontSize: '16px',
          fontWeight: 600,
          margin: 0,
          fontFamily: 'monospace',
        }}>
          V50 아키텍처 전체구조도
        </h1>
        <span style={{
          background: '#2d3748',
          color: '#a0aec0',
          fontSize: '12px',
          padding: '2px 8px',
          borderRadius: '4px',
        }}>
          내부 문서
        </span>
      </div>
      <div style={{
        overflowX: 'auto',
        overflowY: 'auto',
        background: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #2d3748',
      }}>
        <img
          src="/v50-architecture.svg"
          alt="V50 아키텍처 전체구조도"
          style={{
            display: 'block',
            maxWidth: 'none',
            width: '1900px',
          }}
        />
      </div>
    </div>
  );
}
