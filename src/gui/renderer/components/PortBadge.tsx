import React, { useState } from 'react';

interface PortBadgeProps {
  port: number;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: {
    fontSize: '12px',
    padding: '2px 6px',
  },
  md: {
    fontSize: '16px',
    padding: '4px 10px',
  },
  lg: {
    fontSize: '20px',
    padding: '6px 14px',
  },
};

export function PortBadge({
  port,
  onClick,
  size = 'md',
  disabled = false,
}: PortBadgeProps): React.ReactElement {
  const [isHovered, setIsHovered] = useState(false);

  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '2px',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontSize: '9px',
    fontWeight: 500,
    letterSpacing: '0.15em',
    color: 'var(--text-dim)',
    textTransform: 'uppercase',
  };

  const portStyle: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    letterSpacing: '0.05em',
    color: disabled ? 'var(--text-dim)' : 'var(--accent-secondary)',
    background: isHovered && !disabled ? 'var(--accent-secondary-dim)' : 'transparent',
    borderRadius: 'var(--radius-sm)',
    transition: 'all var(--transition-fast)',
    boxShadow: isHovered && !disabled ? 'var(--glow-secondary)' : 'none',
    ...sizeStyles[size],
  };

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  return (
    <div
      style={containerStyle}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={disabled ? undefined : `Open http://localhost:${port}`}
    >
      <span style={labelStyle}>BAY</span>
      <span style={portStyle}>{port}</span>
    </div>
  );
}
