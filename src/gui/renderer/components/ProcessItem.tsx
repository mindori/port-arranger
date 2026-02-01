import React, { useState } from 'react';
import type { ProcessMapping } from '../../../shared/types';
import { StatusIndicator, StatusType } from './StatusIndicator';
import { PortBadge } from './PortBadge';
import { ActionButton } from './ActionButton';

interface ProcessItemProps {
  name: string;
  process: ProcessMapping;
  onStop: (name: string) => void;
  onOpenBrowser: (port: number) => void;
}

const styles: Record<string, React.CSSProperties> = {
  // 컴팩트 한 줄 레이아웃
  item: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--bg-card)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    transition: 'all var(--transition-fast)',
    animation: 'fade-in 0.3s ease-out',
  },
  statusBar: {
    width: '4px',
    alignSelf: 'stretch',
    flexShrink: 0,
    transition: 'all var(--transition-fast)',
  },
  content: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    gap: '12px',
    minWidth: 0,
  },
  // 이름 영역 (flex: 1로 남은 공간 차지)
  nameSection: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: 0,
    overflow: 'hidden',
  },
  name: {
    fontFamily: 'var(--font-display)',
    fontSize: '13px',
    fontWeight: 600,
    letterSpacing: '0.05em',
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  fleetBadge: {
    fontFamily: 'var(--font-display)',
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.1em',
    padding: '2px 8px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--accent-secondary-dim)',
    color: 'var(--accent-secondary)',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  expandButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    padding: 0,
    background: 'none',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-dim)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    flexShrink: 0,
  },
  // 오른쪽 영역 (포트 + 버튼)
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
  },
  // Docker Compose 서비스 리스트
  serviceListContainer: {
    padding: '0 12px 10px 20px',
    marginLeft: '4px',
  },
  serviceList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    paddingLeft: '8px',
    borderLeft: '1px solid var(--border-primary)',
  },
  serviceItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px 8px',
    borderRadius: 'var(--radius-sm)',
    transition: 'background-color var(--transition-fast)',
  },
  serviceNameContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: 0,
  },
  serviceName: {
    fontFamily: 'var(--font-body)',
    fontSize: '11px',
    color: 'var(--text-secondary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  servicePort: {
    fontFamily: 'var(--font-display)',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.03em',
    color: 'var(--accent-secondary)',
    cursor: 'pointer',
    padding: '2px 6px',
    borderRadius: 'var(--radius-sm)',
    transition: 'all var(--transition-fast)',
    background: 'none',
    border: 'none',
    flexShrink: 0,
  },
  servicePortDisabled: {
    color: 'var(--text-dim)',
    cursor: 'default',
  },
};

export function ProcessItem({
  name,
  process,
  onStop,
  onOpenBrowser,
}: ProcessItemProps): React.ReactElement {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [serviceHovered, setServiceHovered] = useState<string | null>(null);

  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInjectionLabel = (): string => {
    switch (process.injectionType) {
      case 'env': return 'ENV';
      case 'flag': return 'FLAG';
      case 'compose': return 'COMPOSE';
      default: return 'AUTO';
    }
  };

  const isCompose = process.injectionType === 'compose' && process.composePorts?.length;

  const runningCount = isCompose
    ? process.composePorts?.filter((s) => s.running).length ?? 0
    : 0;
  const totalCount = isCompose ? process.composePorts?.length ?? 0 : 0;

  const getStatus = (): StatusType => {
    if (!isCompose) return 'running';
    if (runningCount === totalCount) return 'running';
    if (runningCount > 0) return 'partial';
    return 'stopped';
  };

  const status = getStatus();
  const statusColor = status === 'running'
    ? 'var(--status-running)'
    : status === 'partial'
      ? 'var(--status-partial)'
      : 'var(--status-stopped)';

  // tooltip 용 메타 정보
  const tooltipText = `PID: ${process.pid} | START: ${formatTime(process.startedAt)} | TYPE: ${getInjectionLabel()}\n${process.originalCommand}`;

  return (
    <div>
      {/* 메인 한 줄 레이아웃 */}
      <div
        style={{
          ...styles.item,
          backgroundColor: isHovered ? 'var(--bg-card-hover)' : 'var(--bg-card)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={tooltipText}
      >
        <div
          style={{
            ...styles.statusBar,
            backgroundColor: statusColor,
            boxShadow: `inset 0 0 10px ${statusColor}, 0 0 5px ${statusColor}`,
          }}
          className={status === 'running' ? 'status-glow-running' : undefined}
        />
        <div style={styles.content}>
          <StatusIndicator status={status} size="sm" />
          <div style={styles.nameSection}>
            <span style={styles.name}>{name}</span>
            {isCompose && (
              <>
                <span style={styles.fleetBadge}>
                  FLEET {runningCount}/{totalCount}
                </span>
                <button
                  style={{
                    ...styles.expandButton,
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                  onClick={() => setIsExpanded(!isExpanded)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-dim)';
                  }}
                  title={isExpanded ? 'Collapse' : 'Expand'}
                >
                  ▼
                </button>
              </>
            )}
          </div>
          <div style={styles.actions}>
            {!isCompose && (
              <PortBadge
                port={process.port}
                onClick={() => onOpenBrowser(process.port)}
                size="sm"
              />
            )}
            <ActionButton
              variant="danger"
              size="sm"
              onClick={() => onStop(name)}
            >
              STOP
            </ActionButton>
          </div>
        </div>
      </div>

      {/* Docker Compose 서비스 리스트 (펼쳤을 때) */}
      {isCompose && isExpanded && process.composePorts && (
        <div style={styles.serviceListContainer}>
          <div style={styles.serviceList as React.CSSProperties}>
            {process.composePorts.map((service) => {
              const isRunning = service.running ?? false;
              const isServiceHovered = serviceHovered === service.serviceName;
              return (
                <div
                  key={service.serviceName}
                  style={{
                    ...styles.serviceItem,
                    backgroundColor: isServiceHovered ? 'var(--bg-card-hover)' : 'transparent',
                  }}
                  onMouseEnter={() => setServiceHovered(service.serviceName)}
                  onMouseLeave={() => setServiceHovered(null)}
                >
                  <div style={styles.serviceNameContainer as React.CSSProperties}>
                    <StatusIndicator
                      status={isRunning ? 'running' : 'stopped'}
                      size="xs"
                      animated={isRunning}
                    />
                    <span style={styles.serviceName}>{service.serviceName}</span>
                  </div>
                  {isRunning ? (
                    <button
                      style={styles.servicePort}
                      onClick={() => onOpenBrowser(service.port)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--accent-secondary-dim)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      title={`Open BAY ${service.port}`}
                    >
                      BAY {service.port}
                    </button>
                  ) : (
                    <span style={{ ...styles.servicePort, ...styles.servicePortDisabled }}>
                      BAY {service.port}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
