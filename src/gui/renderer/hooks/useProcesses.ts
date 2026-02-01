import { useState, useEffect } from 'react';
import type { ProcessMapping } from '../../../shared/types';

interface UseProcessesResult {
  processes: Record<string, ProcessMapping>;
  loading: boolean;
  error: string | null;
  stopProcess: (name: string) => Promise<void>;
  openBrowser: (port: number) => Promise<void>;
}

export function useProcesses(): UseProcessesResult {
  const [processes, setProcesses] = useState<Record<string, ProcessMapping>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const data = await window.electronAPI.getProcesses();
        setProcesses(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadInitial();

    const unsubscribe = window.electronAPI.onProcessesUpdate((updated) => {
      setProcesses(updated);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const stopProcess = async (name: string) => {
    try {
      await window.electronAPI.stopProcess(name);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const openBrowser = async (port: number) => {
    try {
      await window.electronAPI.openBrowser(port);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return { processes, loading, error, stopProcess, openBrowser };
}
