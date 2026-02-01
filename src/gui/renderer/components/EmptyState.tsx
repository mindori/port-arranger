import React from 'react';

const asciiArt = `
     .  *  .      .        *
  .    _____     .    *
    .'     '.   .        .
   /  o   o  \\      *
  |     <     |  .      .
  |  \\___/   |    .
   \\  ___   / *      .
    '._____.'     .
  .      *     .      *
`;

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center',
    animation: 'fade-in 0.5s ease-out',
  },
  ascii: {
    fontFamily: 'var(--font-body)',
    fontSize: '10px',
    lineHeight: 1.3,
    color: 'var(--text-dim)',
    whiteSpace: 'pre',
    marginBottom: '24px',
    opacity: 0.6,
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '14px',
    fontWeight: 600,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: 'var(--text-secondary)',
    marginBottom: '16px',
  },
  description: {
    fontFamily: 'var(--font-body)',
    fontSize: '12px',
    color: 'var(--text-dim)',
    lineHeight: 1.6,
    maxWidth: '280px',
  },
  examples: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '12px',
  },
  codeBlock: {
    display: 'inline-block',
    padding: '8px 16px',
    backgroundColor: 'var(--bg-panel)',
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-body)',
    fontSize: '12px',
    color: 'var(--accent-secondary)',
  },
  hint: {
    marginTop: '20px',
    fontFamily: 'var(--font-body)',
    fontSize: '11px',
    color: 'var(--text-dim)',
    opacity: 0.7,
  },
};

export function EmptyState(): React.ReactElement {
  return (
    <div style={styles.container}>
      <pre style={styles.ascii}>{asciiArt}</pre>
      <div style={styles.title}>No Vessels Docked</div>
      <div style={styles.description}>
        No processes currently docked.
        <br />
        Start any dev server:
      </div>
      <div style={styles.examples}>
        <code style={styles.codeBlock}>pa run "npm run dev"</code>
        <code style={styles.codeBlock}>pa run "python -m http.server"</code>
        <code style={styles.codeBlock}>pa run "docker compose up -d"</code>
      </div>
      <div style={styles.hint}>
        Ports are automatically assigned to avoid conflicts
      </div>
    </div>
  );
}
