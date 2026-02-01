import React from 'react';

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: 0,
  },
  grid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `
      linear-gradient(var(--grid-color) 1px, transparent 1px),
      linear-gradient(90deg, var(--grid-color) 1px, transparent 1px)
    `,
    backgroundSize: '40px 40px',
    opacity: 1,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `
      radial-gradient(
        ellipse at 50% 0%,
        transparent 0%,
        var(--bg-void) 70%
      ),
      radial-gradient(
        ellipse at 50% 100%,
        transparent 0%,
        var(--bg-void) 70%
      )
    `,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '200px',
    height: '100px',
    background: 'radial-gradient(ellipse, var(--accent-primary-dim) 0%, transparent 70%)',
    opacity: 0.3,
  },
};

export function GridBackground(): React.ReactElement {
  return (
    <div style={styles.container}>
      <div style={styles.grid} />
      <div style={styles.gradientOverlay} />
      <div style={styles.topGlow} />
    </div>
  );
}
