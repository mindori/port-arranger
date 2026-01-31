import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { mkdtemp, rm, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import {
  loadState,
  saveState,
  addProcess,
  removeProcess,
  getAllProcesses,
  setStatePath,
} from './state.js';
import type { ProcessMapping } from '../../shared/types.js';

describe('state', () => {
  let tempDir: string;
  let testStatePath: string;

  const mockMapping: ProcessMapping = {
    port: 3001,
    pid: 12345,
    command: 'next dev',
    originalCommand: 'next dev',
    injectionType: 'env',
    cwd: '/test/project',
    startedAt: new Date().toISOString(),
    status: 'running',
  };

  beforeEach(async () => {
    // 임시 디렉토리 생성
    tempDir = await mkdtemp(join(tmpdir(), 'port-arranger-test-'));
    testStatePath = join(tempDir, 'state.json');
    setStatePath(testStatePath);
  });

  afterEach(async () => {
    // 임시 디렉토리 삭제
    await rm(tempDir, { recursive: true, force: true });
  });

  it('빈 상태에서 시작해야 한다', async () => {
    const state = await loadState();
    expect(state.mappings).toEqual({});
  });

  it('상태를 저장하고 불러올 수 있어야 한다', async () => {
    const state = { mappings: { myproject: mockMapping } };
    await saveState(state);
    const loaded = await loadState();
    expect(loaded.mappings['myproject']).toEqual(mockMapping);
  });

  it('프로세스를 추가할 수 있어야 한다', async () => {
    await addProcess('myproject', mockMapping);
    const state = await loadState();
    expect(state.mappings['myproject']).toBeDefined();
    expect(state.mappings['myproject'].port).toBe(3001);
  });

  it('프로세스를 제거할 수 있어야 한다', async () => {
    await addProcess('myproject', mockMapping);
    await removeProcess('myproject');
    const state = await loadState();
    expect(state.mappings['myproject']).toBeUndefined();
  });

  it('존재하지 않는 프로세스 제거 시 에러가 발생하지 않아야 한다', async () => {
    await expect(removeProcess('nonexistent')).resolves.not.toThrow();
  });

  it('모든 프로세스를 조회할 수 있어야 한다', async () => {
    const mapping2: ProcessMapping = {
      ...mockMapping,
      port: 3002,
      pid: 12346,
    };

    await addProcess('project1', mockMapping);
    await addProcess('project2', mapping2);

    const processes = await getAllProcesses();
    expect(Object.keys(processes)).toHaveLength(2);
    expect(processes['project1'].port).toBe(3001);
    expect(processes['project2'].port).toBe(3002);
  });

  it('상태 파일이 유효한 JSON이어야 한다', async () => {
    await addProcess('myproject', mockMapping);
    const content = await readFile(testStatePath, 'utf-8');
    expect(() => JSON.parse(content)).not.toThrow();
  });
});
