import React, { useState } from 'react';

const styles: Record<string, React.CSSProperties> = {
  titleBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    backgroundColor: 'var(--bg-deep)',
    WebkitAppRegion: 'drag',
    borderBottom: '1px solid var(--border-primary)',
    position: 'relative',
    zIndex: 10,
  } as React.CSSProperties,
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  diamond: {
    color: 'var(--accent-primary)',
    fontSize: '10px',
    filter: 'drop-shadow(0 0 4px var(--accent-primary))',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'var(--text-primary)',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    WebkitAppRegion: 'no-drag',
  } as React.CSSProperties,
  pinButton: {
    padding: '4px 10px',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'var(--font-display)',
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    transition: 'all var(--transition-fast)',
  },
  pinActive: {
    backgroundColor: 'var(--accent-primary)',
    color: 'var(--bg-void)',
    boxShadow: 'var(--glow-accent)',
  },
  pinInactive: {
    backgroundColor: 'var(--bg-panel)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-primary)',
  },
  controlButton: {
    width: '24px',
    height: '24px',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 300,
    transition: 'all var(--transition-fast)',
    backgroundColor: 'var(--bg-panel)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-primary)',
  },
  closeButton: {
    backgroundColor: 'var(--status-stopped-dim)',
    color: 'var(--status-stopped)',
    border: '1px solid var(--status-stopped)',
  },
  gradientLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: 'linear-gradient(90deg, transparent, var(--accent-primary), transparent)',
    opacity: 0.5,
  },
};

export function TitleBar(): React.ReactElement {
  const [alwaysOnTop, setAlwaysOnTop] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const handleToggleAlwaysOnTop = async () => {
    const newValue = !alwaysOnTop;
    setAlwaysOnTop(newValue);
    await window.electronAPI.setAlwaysOnTop(newValue);
  };

  const handleMinimize = () => {
    window.electronAPI.minimizeWindow();
  };

  const handleClose = () => {
    window.electronAPI.closeWindow();
  };

  return (
    <div style={styles.titleBar}>
      <div style={styles.titleContainer}>
        <span style={styles.diamond}>{'\u25C6'}</span>
        <span style={styles.title}>PORT ARRANGER</span>
      </div>
      <div style={styles.controls}>
        <button
          onClick={handleToggleAlwaysOnTop}
          style={{
            ...styles.pinButton,
            ...(alwaysOnTop ? styles.pinActive : styles.pinInactive),
          }}
          title="Always on top"
        >
          PIN
        </button>
        <button
          onClick={handleMinimize}
          style={{
            ...styles.controlButton,
            ...(hoveredButton === 'minimize' ? { backgroundColor: 'var(--bg-card-hover)' } : {}),
          }}
          onMouseEnter={() => setHoveredButton('minimize')}
          onMouseLeave={() => setHoveredButton(null)}
          title="Minimize"
        >
          -
        </button>
        <button
          onClick={handleClose}
          style={{
            ...styles.controlButton,
            ...styles.closeButton,
            ...(hoveredButton === 'close' ? {
              backgroundColor: 'var(--status-stopped)',
              color: 'var(--text-primary)',
            } : {}),
          }}
          onMouseEnter={() => setHoveredButton('close')}
          onMouseLeave={() => setHoveredButton(null)}
          title="Close"
        >
          {'\u00D7'}
        </button>
      </div>
      <div style={styles.gradientLine as React.CSSProperties} />
    </div>
  );
}
