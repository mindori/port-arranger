import detectPort from 'detect-port';

const DEFAULT_PORT = 3000;

export async function findAvailablePort(preferredPort: number = DEFAULT_PORT): Promise<number> {
  const availablePort = await detectPort(preferredPort);
  return availablePort;
}
