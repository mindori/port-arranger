import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { homedir } from 'os';
import type { State, ProcessMapping } from '../../shared/types.js';

const DEFAULT_STATE_DIR = join(homedir(), '.port-arranger');
const DEFAULT_STATE_PATH = join(DEFAULT_STATE_DIR, 'state.json');

let statePath = DEFAULT_STATE_PATH;

// 테스트용 상태 파일 경로 설정
export function setStatePath(path: string): void {
  statePath = path;
}

// 기본 경로로 리셋
export function resetStatePath(): void {
  statePath = DEFAULT_STATE_PATH;
}

export function getStatePath(): string {
  return statePath;
}

const emptyState: State = { mappings: {} };

export async function loadState(): Promise<State> {
  try {
    const content = await readFile(statePath, 'utf-8');
    return JSON.parse(content) as State;
  } catch (error) {
    // 파일이 없거나 읽기 실패 시 빈 상태 반환
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { ...emptyState };
    }
    throw error;
  }
}

export async function saveState(state: State): Promise<void> {
  // 디렉토리가 없으면 생성
  const dir = dirname(statePath);
  await mkdir(dir, { recursive: true });

  await writeFile(statePath, JSON.stringify(state, null, 2), 'utf-8');
}

export async function addProcess(name: string, mapping: ProcessMapping): Promise<void> {
  const state = await loadState();
  const newState: State = {
    ...state,
    mappings: {
      ...state.mappings,
      [name]: mapping,
    },
  };
  await saveState(newState);
}

export async function removeProcess(name: string): Promise<void> {
  const state = await loadState();
  const { [name]: _, ...rest } = state.mappings;
  const newState: State = {
    ...state,
    mappings: rest,
  };
  await saveState(newState);
}

export async function getAllProcesses(): Promise<Record<string, ProcessMapping>> {
  const state = await loadState();
  return state.mappings;
}

export async function getProcess(name: string): Promise<ProcessMapping | undefined> {
  const state = await loadState();
  return state.mappings[name];
}
