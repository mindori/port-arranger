import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer, Server } from 'net';
import { findAvailablePort, clearSessionAllocatedPorts } from './port-finder.js';
import { setStatePath, addProcess, loadState, saveState } from './state.js';
import { join } from 'path';
import { tmpdir } from 'os';
import { rm } from 'fs/promises';

describe('findAvailablePort', () => {
  let server: Server | null = null;
  // 테스트용으로 높은 포트 번호 사용 (충돌 방지)
  const TEST_PORT = 19876;

  beforeEach(() => {
    // 각 테스트 전에 세션 상태 초기화
    clearSessionAllocatedPorts();
  });

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => {
        server!.close(() => resolve());
      });
      server = null;
    }
  });

  const occupyPort = (port: number): Promise<Server> => {
    return new Promise((resolve, reject) => {
      const s = createServer();
      s.listen(port, () => {
        resolve(s);
      });
      s.on('error', reject);
    });
  };

  it('지정한 포트가 사용 가능하면 그대로 반환해야 한다', async () => {
    const port = await findAvailablePort(TEST_PORT);
    expect(port).toBe(TEST_PORT);
  });

  it('지정한 포트가 사용 중이면 다른 포트를 반환해야 한다', async () => {
    server = await occupyPort(TEST_PORT);
    const port = await findAvailablePort(TEST_PORT);
    expect(port).not.toBe(TEST_PORT);
    expect(port).toBeGreaterThan(0);
  });

  it('포트 번호는 유효한 범위 내에 있어야 한다', async () => {
    const port = await findAvailablePort(TEST_PORT);
    expect(port).toBeGreaterThanOrEqual(1);
    expect(port).toBeLessThanOrEqual(65535);
  });

  it('기본 포트(3000)를 사용할 때 유효한 포트를 반환해야 한다', async () => {
    const port = await findAvailablePort();
    expect(port).toBeGreaterThanOrEqual(1);
    expect(port).toBeLessThanOrEqual(65535);
  });
});

describe('findAvailablePort - 상태 파일 참조', () => {
  const TEST_PORT = 19877;
  let testStatePath: string;

  beforeEach(async () => {
    // 세션 상태 초기화
    clearSessionAllocatedPorts();
    // 테스트용 임시 상태 파일 설정
    testStatePath = join(tmpdir(), `pa-test-${Date.now()}.json`);
    setStatePath(testStatePath);
    // 빈 상태로 초기화
    await saveState({ mappings: {} });
  });

  afterEach(async () => {
    // 테스트 상태 파일 정리
    try {
      await rm(testStatePath);
    } catch {
      // 파일이 없어도 무시
    }
  });

  it('상태 파일에 있는 실행 중인 프로세스의 포트를 피해야 한다', async () => {
    // 상태 파일에 TEST_PORT 사용 중 기록 (현재 프로세스 PID로 실행 중 상태)
    await addProcess('test-app', {
      port: TEST_PORT,
      pid: process.pid, // 현재 프로세스 PID (실행 중으로 판단)
      command: 'node test.js',
      originalCommand: 'node test.js',
      injectionType: 'env',
      cwd: '/tmp',
      startedAt: new Date().toISOString(),
      status: 'running',
    });

    const port = await findAvailablePort(TEST_PORT);
    expect(port).not.toBe(TEST_PORT); // TEST_PORT가 아닌 다른 포트 반환
  });

  it('상태 파일에 있지만 종료된 프로세스의 포트는 사용 가능해야 한다', async () => {
    // 상태 파일에 TEST_PORT 기록하지만 존재하지 않는 PID
    await addProcess('dead-app', {
      port: TEST_PORT,
      pid: 99999999, // 존재하지 않는 PID
      command: 'node test.js',
      originalCommand: 'node test.js',
      injectionType: 'env',
      cwd: '/tmp',
      startedAt: new Date().toISOString(),
      status: 'running',
    });

    const port = await findAvailablePort(TEST_PORT);
    // 실제 TEST_PORT가 사용 가능하면 TEST_PORT 반환
    expect(port).toBe(TEST_PORT);
  });
});
