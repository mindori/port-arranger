import { spawn } from 'child_process';
import treeKill from 'tree-kill';

export async function spawnProcess(
  name: string,
  command: string,
  env: Record<string, string>,
  cwd: string
): Promise<number> {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(' ').filter(Boolean);

    const child = spawn(cmd, args, {
      cwd,
      env: { ...process.env, ...env },
      detached: true,
      stdio: 'ignore',
    });

    child.on('error', (error) => {
      reject(new Error(`Failed to start process: ${error.message}`));
    });

    // 프로세스가 시작되면 PID 반환
    if (child.pid) {
      child.unref();
      resolve(child.pid);
    } else {
      reject(new Error('Could not get process PID'));
    }
  });
}

export async function killProcess(pid: number): Promise<void> {
  return new Promise((resolve, reject) => {
    treeKill(pid, 'SIGTERM', (err) => {
      if (err) {
        // 프로세스가 이미 종료된 경우 무시
        if (err.message?.includes('No such process') ||
            err.message?.includes('ESRCH')) {
          resolve();
          return;
        }
        reject(err);
        return;
      }
      resolve();
    });
  });
}

export function isProcessRunning(pid: number): boolean {
  try {
    // kill(pid, 0)은 프로세스 존재 여부만 확인 (실제로 시그널을 보내지 않음)
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export interface ComposeServiceStatus {
  serviceName: string;
  running: boolean;
}

export async function getComposeServicesStatus(cwd: string): Promise<Map<string, boolean>> {
  const { execSync } = await import('child_process');
  const statusMap = new Map<string, boolean>();

  try {
    // docker compose ps -a --format json으로 서비스 상태 조회 (중지된 것 포함)
    const output = execSync('docker compose ps -a --format json', {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // 각 줄이 JSON 객체
    const lines = output.trim().split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const container = JSON.parse(line);
        const serviceName = container.Service || container.Name;
        const state = container.State || '';
        const isRunning = state.toLowerCase() === 'running';
        // 이미 running으로 설정된 서비스는 덮어쓰지 않음
        if (!statusMap.has(serviceName) || isRunning) {
          statusMap.set(serviceName, isRunning);
        }
      } catch {
        // JSON 파싱 실패 시 무시
      }
    }
  } catch {
    // docker compose ps 실패 시 빈 맵 반환
  }

  return statusMap;
}
