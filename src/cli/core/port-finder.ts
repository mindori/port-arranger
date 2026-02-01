import detectPort from 'detect-port';
import { getAllProcesses } from './state.js';
import { isProcessRunning } from './process-manager.js';

const DEFAULT_PORT = 3000;

// 세션 내에서 이미 할당된 포트 추적 (compose 등에서 여러 포트를 순차 할당 시 사용)
const sessionAllocatedPorts = new Set<number>();

async function getUsedPorts(): Promise<Set<number>> {
  const processes = await getAllProcesses();
  const usedPorts = new Set<number>();

  for (const [, mapping] of Object.entries(processes)) {
    // 실행 중인 프로세스의 포트만 추가
    if (mapping.status === 'running' && isProcessRunning(mapping.pid)) {
      usedPorts.add(mapping.port);
    }
  }

  return usedPorts;
}

export async function findAvailablePort(
  preferredPort: number = DEFAULT_PORT,
  excludePorts?: Set<number>
): Promise<number> {
  const usedPorts = await getUsedPorts();

  // 세션 내 할당된 포트와 excludePorts 병합
  const allExcluded = new Set([
    ...usedPorts,
    ...sessionAllocatedPorts,
    ...(excludePorts || []),
  ]);

  let port = preferredPort;
  const maxAttempts = 100;

  for (let i = 0; i < maxAttempts; i++) {
    // 1. 제외 목록에서 이미 사용 중인지 확인
    if (allExcluded.has(port)) {
      port++;
      continue;
    }

    // 2. 시스템에서 실제로 사용 가능한지 확인
    const availablePort = await detectPort(port);
    if (availablePort === port) {
      sessionAllocatedPorts.add(port);
      return port;
    }

    // detect-port가 다른 포트를 제안하면 해당 포트도 확인
    if (!allExcluded.has(availablePort)) {
      sessionAllocatedPorts.add(availablePort);
      return availablePort;
    }

    port = availablePort + 1;
  }

  throw new Error('Could not find an available port');
}

// 세션 종료 시 할당된 포트 초기화 (테스트용)
export function clearSessionAllocatedPorts(): void {
  sessionAllocatedPorts.clear();
}
