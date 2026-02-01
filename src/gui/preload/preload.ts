import { contextBridge, ipcRenderer } from 'electron';
import type { ProcessMapping, ElectronAPI } from '../../shared/types';

const api: ElectronAPI = {
  getProcesses: () => ipcRenderer.invoke('get-processes'),

  onProcessesUpdate: (callback: (processes: Record<string, ProcessMapping>) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, processes: Record<string, ProcessMapping>) => {
      callback(processes);
    };
    ipcRenderer.on('processes-update', handler);

    return () => {
      ipcRenderer.removeListener('processes-update', handler);
    };
  },

  stopProcess: (name: string) => ipcRenderer.invoke('stop-process', name),

  restartProcess: (name: string) => ipcRenderer.invoke('restart-process', name),

  openBrowser: (port: number) => ipcRenderer.invoke('open-browser', port),

  setAlwaysOnTop: (value: boolean) => ipcRenderer.invoke('set-always-on-top', value),

  minimizeWindow: () => ipcRenderer.send('minimize-window'),

  closeWindow: () => ipcRenderer.send('close-window'),
};

contextBridge.exposeInMainWorld('electronAPI', api);
