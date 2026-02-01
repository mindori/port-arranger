import { ipcMain, shell, BrowserWindow } from 'electron';
import { readFile, writeFile } from 'fs/promises';
import { execSync } from 'child_process';
import { join } from 'path';
import { homedir } from 'os';
import treeKill from 'tree-kill';
import type { State } from '../../shared/types';

const STATE_PATH = join(homedir(), '.port-arranger', 'state.json');

async function loadState(): Promise<State> {
  try {
    const content = await readFile(STATE_PATH, 'utf-8');
    return JSON.parse(content) as State;
  } catch {
    return { mappings: {} };
  }
}

async function saveState(state: State): Promise<void> {
  await writeFile(STATE_PATH, JSON.stringify(state, null, 2), 'utf-8');
}

function killProcess(pid: number): Promise<void> {
  return new Promise((resolve, reject) => {
    treeKill(pid, 'SIGTERM', (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function stopComposeProcess(cwd: string, pid: number): void {
  try {
    execSync('docker compose down', { cwd, stdio: 'pipe' });
  } catch {
    // fallback: 프로세스만 kill
    treeKill(pid, 'SIGTERM');
  }
}

export function setupIpcHandlers(mainWindow: BrowserWindow): void {
  ipcMain.handle('stop-process', async (_event, name: string) => {
    const state = await loadState();
    const mapping = state.mappings[name];

    if (!mapping) {
      throw new Error(`Process not found: ${name}`);
    }

    if (mapping.injectionType === 'compose') {
      stopComposeProcess(mapping.cwd, mapping.pid);
    } else {
      await killProcess(mapping.pid);
    }

    const { [name]: _, ...rest } = state.mappings;
    await saveState({ ...state, mappings: rest });
  });

  ipcMain.handle('restart-process', async (_event, name: string) => {
    const state = await loadState();
    const mapping = state.mappings[name];

    if (!mapping) {
      throw new Error(`Process not found: ${name}`);
    }

    // 프로세스 종료 후 재시작은 CLI를 통해 해야 함
    // GUI에서는 단순히 중지만 수행
    if (mapping.injectionType === 'compose') {
      stopComposeProcess(mapping.cwd, mapping.pid);
    } else {
      await killProcess(mapping.pid);
    }

    const { [name]: _, ...rest } = state.mappings;
    await saveState({ ...state, mappings: rest });
  });

  ipcMain.handle('open-browser', async (_event, port: number) => {
    await shell.openExternal(`http://localhost:${port}`);
  });

  ipcMain.handle('set-always-on-top', async (_event, value: boolean) => {
    mainWindow.setAlwaysOnTop(value);
  });

  ipcMain.on('minimize-window', () => {
    mainWindow.minimize();
  });

  ipcMain.on('close-window', () => {
    mainWindow.close();
  });
}
