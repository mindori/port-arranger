import React from 'react';
import type { ProcessMapping } from '../../../shared/types';

interface ProcessItemProps {
  name: string;
  process: ProcessMapping;
  onStop: (name: string) => void;
  onOpenBrowser: (port: number) => void;
}

const styles: Record<string, React.CSSProperties> = {
  item: {
    display: 'flex',
    flexDirection: 'column',
    padding: '12px',
    backgroundColor: 'var(--bg-item)',
    borderRadius: '8px',
    gap: '8px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'var(--success)',
  },
  info: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  port: {
    cursor: 'pointer',
    color: 'var(--accent)',
    textDecoration: 'underline',
    background: 'none',
    border: 'none',
    fontSize: '12px',
    padding: 0,
  },
  command: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    fontFamily: 'monospace',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    marginTop: '4px',
  },
  button: {
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
    transition: 'all 0.15s',
  },
  stopButton: {
    backgroundColor: 'var(--accent)',
    color: 'white',
  },
};

export function ProcessItem({
  name,
  process,
  onStop,
  onOpenBrowser,
}: ProcessItemProps): React.ReactElement {
  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={styles.item}>
      <div style={styles.header}>
        <span style={styles.name}>{name}</span>
        <div style={styles.status}>
          <span style={styles.statusDot} />
          <span>실행 중</span>
        </div>
      </div>

      <div style={styles.info}>
        <span>
          포트:{' '}
          <button
            style={styles.port}
            onClick={() => onOpenBrowser(process.port)}
            title="브라우저에서 열기"
          >
            {process.port}
          </button>
        </span>
        <span>PID: {process.pid}</span>
        <span>시작: {formatTime(process.startedAt)}</span>
      </div>

      <div style={styles.command} title={process.originalCommand}>
        {process.originalCommand}
      </div>

      <div style={styles.actions}>
        <button
          style={{ ...styles.button, ...styles.stopButton }}
          onClick={() => onStop(name)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent)';
          }}
        >
          중지
        </button>
      </div>
    </div>
  );
}
