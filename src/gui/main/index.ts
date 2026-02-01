import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { startWatching, stopWatching, addListener, getProcesses } from './state-watcher';
import { setupIpcHandlers } from './ipc-handlers';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 410,
    height: 500,
    minWidth: 320,
    minHeight: 300,
    frame: false,
    transparent: false,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // 렌더러 로드
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // IPC 핸들러 설정
  setupIpcHandlers(mainWindow);

  // 상태 파일 감시 시작
  startWatching();

  // 프로세스 목록 가져오기 핸들러
  ipcMain.handle('get-processes', async () => {
    return getProcesses();
  });

  // 상태 업데이트 리스너
  const removeListener = addListener((processes) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('processes-update', processes);
    }
  });

  mainWindow.on('closed', () => {
    removeListener();
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopWatching();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
