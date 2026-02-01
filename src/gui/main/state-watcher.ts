import { watch, type FSWatcher } from 'chokidar';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import type { State, ProcessMapping } from '../../shared/types';

const STATE_PATH = join(homedir(), '.port-arranger', 'state.json');

type ProcessesCallback = (processes: Record<string, ProcessMapping>) => void;

let watcher: FSWatcher | null = null;
const listeners = new Set<ProcessesCallback>();

async function loadState(): Promise<Record<string, ProcessMapping>> {
  try {
    const content = await readFile(STATE_PATH, 'utf-8');
    const state = JSON.parse(content) as State;
    return state.mappings;
  } catch {
    return {};
  }
}

async function notifyListeners(): Promise<void> {
  const processes = await loadState();
  listeners.forEach((callback) => callback(processes));
}

export function startWatching(): void {
  if (watcher) return;

  watcher = watch(STATE_PATH, {
    persistent: true,
    ignoreInitial: false,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50,
    },
  });

  watcher.on('add', () => notifyListeners());
  watcher.on('change', () => notifyListeners());
  watcher.on('unlink', () => {
    listeners.forEach((callback) => callback({}));
  });
}

export function stopWatching(): void {
  if (watcher) {
    watcher.close();
    watcher = null;
  }
  listeners.clear();
}

export function addListener(callback: ProcessesCallback): () => void {
  listeners.add(callback);
  // 즉시 현재 상태 전달
  loadState().then(callback);

  return () => {
    listeners.delete(callback);
  };
}

export async function getProcesses(): Promise<Record<string, ProcessMapping>> {
  return loadState();
}
