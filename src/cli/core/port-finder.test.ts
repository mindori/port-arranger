import { describe, it, expect, afterEach } from 'vitest';
import { createServer, Server } from 'net';
import { findAvailablePort } from './port-finder.js';

describe('findAvailablePort', () => {
  let server: Server | null = null;
  // 테스트용으로 높은 포트 번호 사용 (충돌 방지)
  const TEST_PORT = 19876;

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
