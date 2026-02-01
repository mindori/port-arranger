import { watch, type FSWatcher } from 'chokidar';
import { readFile } from 'fs/promises';
import { execSync } from 'child_process';
import { join } from 'path';
import { homedir } from 'os';
import type { State, ProcessMapping } from '../../shared/types';

const STATE_PATH = join(homedir(), '.port-arranger', 'state.json');

function getComposeServicesStatus(cwd: string): Map<string, boolean> {
  const statusMap = new Map<string, boolean>();
  try {
    // Electron 앱에서는 PATH가 제한될 수 있으므로 여러 경로 시도
    const paths = ['/usr/local/bin', '/opt/homebrew/bin', '/usr/bin'];
    const fullPath = `${paths.join(':')}:${process.env.PATH || ''}`;

    const output = execSync('docker compose ps -a --format json', {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PATH: fullPath },
      shell: '/bin/zsh',
    });

    const lines = output.trim().split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const container = JSON.parse(line);
        const serviceName = container.Service || container.Name;
        const state = container.State || '';
        const isRunning = state.toLowerCase() === 'running';
        // 이미 running으로 설정된 서비스는 덮어쓰지 않음 (created 등으로 덮어쓰기 방지)
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

type ProcessesCallback = (processes: Record<string, ProcessMapping>) => void;

let watcher: FSWatcher | null = null;
let pollingInterval: NodeJS.Timeout | null = null;
const listeners = new Set<ProcessesCallback>();
const POLLING_INTERVAL_MS = 3000; // Docker 상태 폴링 주기 (3초)

async function loadState(): Promise<Record<string, ProcessMapping>> {
  try {
    const content = await readFile(STATE_PATH, 'utf-8');
    const state = JSON.parse(content) as State;
    const mappings = state.mappings;

    // compose 프로젝트의 서비스별 상태 업데이트
    for (const mapping of Object.values(mappings)) {
      if (mapping.injectionType === 'compose' && mapping.composePorts?.length) {
        const serviceStatuses = getComposeServicesStatus(mapping.cwd);
        mapping.composePorts = mapping.composePorts.map((svc) => ({
          ...svc,
          running: serviceStatuses.get(svc.serviceName) ?? false,
        }));
      }
    }

    return mappings;
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

  // Docker 서비스 상태 변경 감지를 위한 주기적 폴링
  pollingInterval = setInterval(() => {
    notifyListeners();
  }, POLLING_INTERVAL_MS);
}

export function stopWatching(): void {
  if (watcher) {
    watcher.close();
    watcher = null;
  }
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
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
