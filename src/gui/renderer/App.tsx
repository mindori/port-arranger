import React from 'react';
import { TitleBar } from './components/TitleBar';
import { ProcessList } from './components/ProcessList';
import { GridBackground } from './components/GridBackground';
import { useProcesses } from './hooks/useProcesses';

const styles: Record<string, React.CSSProperties> = {
  app: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: 'var(--bg-void)',
    position: 'relative',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
  },
  loading: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-display)',
    fontSize: '12px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--text-dim)',
  },
  error: {
    padding: '12px',
    margin: '12px',
    backgroundColor: 'var(--status-stopped-dim)',
    border: '1px solid var(--status-stopped)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--status-stopped)',
    fontFamily: 'var(--font-body)',
    fontSize: '12px',
  },
};

export default function App(): React.ReactElement {
  const { processes, loading, error, stopProcess, openBrowser } = useProcesses();

  return (
    <div style={styles.app}>
      <GridBackground />
      <TitleBar />
      <div style={styles.content}>
        {error && <div style={styles.error}>{error}</div>}
        {loading ? (
          <div style={styles.loading}>Scanning Docking Bays...</div>
        ) : (
          <ProcessList
            processes={processes}
            onStop={stopProcess}
            onOpenBrowser={openBrowser}
          />
        )}
      </div>
    </div>
  );
}
