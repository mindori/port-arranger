import React from 'react';
import type { ProcessMapping } from '../../../shared/types';
import { ProcessItem } from './ProcessItem';
import { EmptyState } from './EmptyState';

interface ProcessListProps {
  processes: Record<string, ProcessMapping>;
  onStop: (name: string) => void;
  onOpenBrowser: (port: number) => void;
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-primary)',
  },
  headerTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: 'var(--text-dim)',
  },
  headerCount: {
    fontFamily: 'var(--font-display)',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.1em',
    color: 'var(--accent-primary)',
    padding: '2px 8px',
    backgroundColor: 'var(--accent-primary-dim)',
    borderRadius: 'var(--radius-sm)',
  },
  container: {
    flex: 1,
    overflow: 'auto',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
};

export function ProcessList({
  processes,
  onStop,
  onOpenBrowser,
}: ProcessListProps): React.ReactElement {
  const entries = Object.entries(processes);

  if (entries.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <div style={styles.header}>
        <span style={styles.headerTitle}>Docking Bays</span>
        <span style={styles.headerCount}>{entries.length} ACTIVE</span>
      </div>
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
