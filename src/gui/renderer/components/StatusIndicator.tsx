import React from 'react';

export type StatusType = 'running' | 'partial' | 'stopped';

interface StatusIndicatorProps {
  status: StatusType;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const sizeMap = {
  xs: 5,
  sm: 6,
  md: 8,
  lg: 10,
};

const statusConfig: Record<StatusType, { color: string; icon: string; glowClass: string }> = {
  running: {
    color: 'var(--status-running)',
    icon: '\u25CF', // ●
    glowClass: 'status-glow-running',
  },
  partial: {
    color: 'var(--status-partial)',
    icon: '\u25D0', // ◐
    glowClass: 'status-glow-partial',
  },
  stopped: {
    color: 'var(--status-stopped)',
    icon: '\u25CB', // ○
    glowClass: 'status-glow-stopped',
  },
};

export function StatusIndicator({
  status,
  size = 'md',
  animated = true,
}: StatusIndicatorProps): React.ReactElement {
  const config = statusConfig[status];
  const pixelSize = sizeMap[size];

  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: pixelSize * 1.5,
    height: pixelSize * 1.5,
    fontSize: `${pixelSize}px`,
    color: config.color,
    lineHeight: 1,
  };

  return (
    <span
      style={style}
      className={animated && status !== 'stopped' ? config.glowClass : undefined}
      title={status === 'running' ? 'Running' : status === 'partial' ? 'Partial' : 'Stopped'}
    >
      {config.icon}
    </span>
  );
}
