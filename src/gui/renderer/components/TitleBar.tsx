import React, { useState } from 'react';

const styles: Record<string, React.CSSProperties> = {
  titleBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    backgroundColor: 'var(--bg-secondary)',
    WebkitAppRegion: 'drag',
    borderBottom: '1px solid var(--border)',
  } as React.CSSProperties,
  title: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    WebkitAppRegion: 'no-drag',
  } as React.CSSProperties,
  controlButton: {
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    transition: 'background-color 0.15s',
  },
  toggle: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    transition: 'all 0.15s',
  },
  toggleActive: {
    backgroundColor: 'var(--accent)',
    color: 'white',
  },
  toggleInactive: {
    backgroundColor: 'var(--bg-item)',
    color: 'var(--text-secondary)',
  },
};

export function TitleBar(): React.ReactElement {
  const [alwaysOnTop, setAlwaysOnTop] = useState(false);

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
      <span style={styles.title}>Port Arranger</span>
      <div style={styles.controls}>
        <button
          onClick={handleToggleAlwaysOnTop}
          style={{
            ...styles.toggle,
            ...(alwaysOnTop ? styles.toggleActive : styles.toggleInactive),
          }}
          title="항상 위에"
        >
          PIN
        </button>
        <button
          onClick={handleMinimize}
          style={{
            ...styles.controlButton,
            backgroundColor: 'var(--bg-item)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--border)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-item)';
          }}
          title="최소화"
        >
          -
        </button>
        <button
          onClick={handleClose}
          style={{
            ...styles.controlButton,
            backgroundColor: 'var(--accent)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent)';
          }}
          title="닫기"
        >
          x
        </button>
      </div>
    </div>
  );
}
