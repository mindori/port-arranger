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
      reject(new Error(`프로세스 시작 실패: ${error.message}`));
    });

    // 프로세스가 시작되면 PID 반환
    if (child.pid) {
      child.unref();
      resolve(child.pid);
    } else {
      reject(new Error('프로세스 PID를 얻을 수 없습니다'));
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
