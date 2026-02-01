import React from 'react';
import type { ProcessMapping } from '../../../shared/types';

interface ProcessItemProps {
  name: string;
  process: ProcessMapping;
  onStop: (name: string) => void;
  onOpenBrowser: (port: number) => void;
}

const styles: Record<string, React.CSSProperties> = {
  item: {
    display: 'flex',
    flexDirection: 'column',
    padding: '12px',
    backgroundColor: 'var(--bg-item)',
    borderRadius: '8px',
    gap: '8px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'var(--success)',
  },
  info: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  port: {
    cursor: 'pointer',
    color: 'var(--accent)',
    textDecoration: 'underline',
    background: 'none',
    border: 'none',
    fontSize: '12px',
    padding: 0,
  },
  command: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    fontFamily: 'monospace',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    marginTop: '4px',
  },
  button: {
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
    transition: 'all 0.15s',
  },
  stopButton: {
    backgroundColor: 'var(--accent)',
    color: 'white',
  },
  services: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginTop: '4px',
    paddingLeft: '8px',
    borderLeft: '2px solid var(--border)',
  },
  serviceItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
  },
  serviceName: {
    color: 'var(--text-secondary)',
  },
  servicePort: {
    color: 'var(--accent)',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    fontSize: '12px',
    padding: 0,
  },
  servicePortStopped: {
    color: 'var(--text-secondary)',
    cursor: 'default',
    background: 'none',
    border: 'none',
    fontSize: '12px',
    padding: 0,
  },
  serviceStatusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    marginRight: '6px',
    flexShrink: 0,
  },
  serviceNameContainer: {
    display: 'flex',
    alignItems: 'center',
  },
};

export function ProcessItem({
  name,
  process,
  onStop,
  onOpenBrowser,
}: ProcessItemProps): React.ReactElement {
  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isCompose = process.injectionType === 'compose' && process.composePorts?.length;

  // compose인 경우 실행 중인 서비스 수 계산
  const runningCount = isCompose
    ? process.composePorts?.filter((s) => s.running).length ?? 0
    : 0;
  const totalCount = isCompose ? process.composePorts?.length ?? 0 : 0;

  // 상태 표시 계산
  const getStatusInfo = (): { color: string; text: string } => {
    if (!isCompose) {
      return { color: 'var(--success)', text: '실행 중' };
    }
    // compose는 항상 N/M 형식으로 표시
    const text = `${runningCount}/${totalCount}`;
    if (runningCount === totalCount) {
      return { color: 'var(--success)', text };
    }
    if (runningCount > 0) {
      return { color: 'var(--warning, #f59e0b)', text };
    }
    return { color: 'var(--error, #ef4444)', text };
  };

  const statusInfo = getStatusInfo();

  return (
    <div style={styles.item}>
      <div style={styles.header}>
        <span style={styles.name}>{name}</span>
        <div style={styles.status}>
          <span style={{ ...styles.statusDot, backgroundColor: statusInfo.color }} />
          <span>{statusInfo.text}</span>
        </div>
      </div>

      <div style={styles.info}>
        {!isCompose && (
          <span>
            포트:{' '}
            <button
              style={styles.port}
              onClick={() => onOpenBrowser(process.port)}
              title="브라우저에서 열기"
            >
              {process.port}
            </button>
          </span>
        )}
        <span>PID: {process.pid}</span>
        <span>시작: {formatTime(process.startedAt)}</span>
      </div>

      <div style={styles.command} title={process.originalCommand}>
        {process.originalCommand}
      </div>

      {isCompose && process.composePorts && (
        <div style={styles.services as React.CSSProperties}>
          {process.composePorts.map((service) => {
            const isRunning = service.running ?? false;
            const dotColor = isRunning ? 'var(--success)' : 'var(--error, #ef4444)';
            const portStyle = isRunning ? styles.servicePort : styles.servicePortStopped;

            return (
              <div key={service.serviceName} style={styles.serviceItem}>
                <div style={styles.serviceNameContainer as React.CSSProperties}>
                  <span
                    style={{
                      ...styles.serviceStatusDot,
                      backgroundColor: dotColor,
                    }}
                  />
                  <span style={styles.serviceName}>{service.serviceName}</span>
                </div>
                {isRunning ? (
                  <button
                    style={portStyle}
                    onClick={() => onOpenBrowser(service.port)}
                    title={`${service.serviceName}를 브라우저에서 열기`}
                  >
                    {service.port}
                  </button>
                ) : (
                  <span style={portStyle}>{service.port}</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={styles.actions}>
        <button
          style={{ ...styles.button, ...styles.stopButton }}
          onClick={() => onStop(name)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent)';
          }}
        >
          중지
        </button>
      </div>
    </div>
  );
}
