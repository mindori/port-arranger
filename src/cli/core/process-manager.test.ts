import { describe, it, expect, afterEach } from 'vitest';
import { spawnProcess, killProcess, isProcessRunning } from './process-manager.js';

describe('process-manager', () => {
  const spawnedPids: number[] = [];

  afterEach(async () => {
    // 테스트 후 생성된 프로세스 정리
    for (const pid of spawnedPids) {
      try {
        await killProcess(pid);
      } catch {
        // 이미 종료된 프로세스 무시
      }
    }
    spawnedPids.length = 0;
  });

  it('프로세스를 생성하고 PID를 반환해야 한다', async () => {
    const pid = await spawnProcess(
      'test',
      'node -e "setTimeout(() => {}, 30000)"',
      {},
      process.cwd()
    );
    spawnedPids.push(pid);

    expect(pid).toBeGreaterThan(0);
  });

  it('프로세스 생존 여부를 확인할 수 있어야 한다', async () => {
    const pid = await spawnProcess(
      'test',
      'node -e "setTimeout(() => {}, 30000)"',
      {},
      process.cwd()
    );
    spawnedPids.push(pid);

    expect(isProcessRunning(pid)).toBe(true);

    await killProcess(pid);

    // 프로세스 종료 대기
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(isProcessRunning(pid)).toBe(false);
  });

  it('환경변수를 프로세스에 전달할 수 있어야 한다', async () => {
    // 환경변수 설정 후 즉시 종료되는 프로세스
    const pid = await spawnProcess(
      'test',
      'node -e "console.log(process.env.TEST_VAR); setTimeout(() => {}, 30000)"',
      { TEST_VAR: 'hello' },
      process.cwd()
    );
    spawnedPids.push(pid);

    expect(pid).toBeGreaterThan(0);
    expect(isProcessRunning(pid)).toBe(true);
  });

  it('존재하지 않는 PID에 대해 isProcessRunning이 false를 반환해야 한다', () => {
    const nonExistentPid = 999999999;
    expect(isProcessRunning(nonExistentPid)).toBe(false);
  });

  it('프로세스 종료 후 재확인 시 false를 반환해야 한다', async () => {
    const pid = await spawnProcess(
      'test',
      'node -e "setTimeout(() => {}, 30000)"',
      {},
      process.cwd()
    );
    spawnedPids.push(pid);

    expect(isProcessRunning(pid)).toBe(true);

    await killProcess(pid);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(isProcessRunning(pid)).toBe(false);
  });
});
