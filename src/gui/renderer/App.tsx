import React from 'react';
import { TitleBar } from './components/TitleBar';
import { ProcessList } from './components/ProcessList';
import { useProcesses } from './hooks/useProcesses';

const styles: Record<string, React.CSSProperties> = {
  app: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: 'var(--bg-primary)',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  loading: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-secondary)',
  },
  error: {
    padding: '12px',
    margin: '12px',
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
    border: '1px solid var(--accent)',
    borderRadius: '8px',
    color: 'var(--accent)',
    fontSize: '13px',
  },
};

export default function App(): React.ReactElement {
  const { processes, loading, error, stopProcess, openBrowser } = useProcesses();

  return (
    <div style={styles.app}>
      <TitleBar />
      <div style={styles.content}>
        {error && <div style={styles.error}>{error}</div>}
        {loading ? (
          <div style={styles.loading}>로딩 중...</div>
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
