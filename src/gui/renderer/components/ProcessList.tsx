import React from 'react';
import type { ProcessMapping } from '../../../shared/types';
import { ProcessItem } from './ProcessItem';

interface ProcessListProps {
  processes: Record<string, ProcessMapping>;
  onStop: (name: string) => void;
  onOpenBrowser: (port: number) => void;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    overflow: 'auto',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  empty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-secondary)',
    gap: '12px',
    padding: '40px',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  emptyHint: {
    fontSize: '13px',
    lineHeight: 1.5,
  },
  code: {
    backgroundColor: 'var(--bg-item)',
    padding: '4px 8px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '12px',
  },
  count: {
    padding: '4px 12px',
    fontSize: '12px',
    color: 'var(--text-secondary)',
    borderBottom: '1px solid var(--border)',
  },
};

export function ProcessList({
  processes,
  onStop,
  onOpenBrowser,
}: ProcessListProps): React.ReactElement {
  const entries = Object.entries(processes);

  if (entries.length === 0) {
    return (
      <div style={styles.empty}>
        <span style={styles.emptyTitle}>실행 중인 프로세스 없음</span>
        <span style={styles.emptyHint}>
          터미널에서 <code style={styles.code}>pa run</code> 명령으로
          <br />
          개발 서버를 실행하세요
        </span>
      </div>
    );
  }

  return (
    <>
      <div style={styles.count}>{entries.length}개의 프로세스</div>
      <div style={styles.container}>
        {entries.map(([name, process]) => (
          <ProcessItem
            key={name}
            name={name}
            process={process}
            onStop={onStop}
            onOpenBrowser={onOpenBrowser}
          />
        ))}
      </div>
    </>
  );
}
