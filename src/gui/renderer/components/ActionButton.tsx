import React, { useState } from 'react';

type ButtonVariant = 'primary' | 'danger' | 'ghost';

interface ActionButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
  disabled?: boolean;
  title?: string;
}

const variantStyles: Record<ButtonVariant, { base: React.CSSProperties; hover: React.CSSProperties }> = {
  primary: {
    base: {
      backgroundColor: 'var(--accent-primary-dim)',
      color: 'var(--accent-primary)',
      border: '1px solid var(--accent-primary)',
    },
    hover: {
      backgroundColor: 'var(--accent-primary)',
      color: 'var(--bg-void)',
      boxShadow: 'var(--glow-accent)',
    },
  },
  danger: {
    base: {
      backgroundColor: 'var(--status-stopped-dim)',
      color: 'var(--status-stopped)',
      border: '1px solid var(--status-stopped)',
    },
    hover: {
      backgroundColor: 'var(--status-stopped)',
      color: 'var(--text-primary)',
      boxShadow: 'var(--glow-status-stopped)',
    },
  },
  ghost: {
    base: {
      backgroundColor: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border-primary)',
    },
    hover: {
      backgroundColor: 'var(--bg-panel)',
      color: 'var(--text-primary)',
      boxShadow: 'none',
    },
  },
};

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: {
    padding: '4px 10px',
    fontSize: '11px',
  },
  md: {
    padding: '6px 14px',
    fontSize: '12px',
  },
};

export function ActionButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  title,
}: ActionButtonProps): React.ReactElement {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const variantStyle = variantStyles[variant];

  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    borderRadius: 'var(--radius-sm)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all var(--transition-fast)',
    transform: isPressed && !disabled ? 'scale(0.96)' : 'scale(1)',
    ...sizeStyles[size],
    ...variantStyle.base,
    ...(isHovered && !disabled ? variantStyle.hover : {}),
  };

  return (
    <button
      style={style}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}
