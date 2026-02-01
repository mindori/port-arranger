import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function findElectronPath(): string | null {
  const require = createRequire(import.meta.url);

  // 1. 패키지 내부 node_modules에서 찾기
  const projectRoot = join(__dirname, '..', '..', '..');
  const localElectronBin = join(projectRoot, 'node_modules', '.bin', 'electron');
  if (existsSync(localElectronBin)) {
    return localElectronBin;
  }

  // 2. require.resolve로 electron 모듈 찾기
  try {
    const electronPath = require.resolve('electron');
    const electronDir = dirname(electronPath);

    // electron 패키지의 cli.js 실행
    const cliPath = join(electronDir, 'cli.js');
    if (existsSync(cliPath)) {
      return cliPath;
    }
  } catch {
    // electron 모듈을 찾을 수 없음
  }

  // 3. 전역 npm prefix에서 찾기
  const globalPaths = [
    '/usr/local/lib/node_modules/electron/cli.js',
    '/usr/lib/node_modules/electron/cli.js',
    join(process.env.HOME || '', '.npm-global/lib/node_modules/electron/cli.js'),
  ];

  for (const path of globalPaths) {
    if (existsSync(path)) {
      return path;
    }
  }

  return null;
}

function findProjectRoot(): string {
  // dist/cli/commands -> 프로젝트 루트
  return join(__dirname, '..', '..', '..');
}

export async function uiCommand(): Promise<void> {
  const electronPath = findElectronPath();

  if (!electronPath) {
    throw new Error(
      'Electron is not installed.\n' +
      'Please reinstall port-arranger: npm install -g port-arranger'
    );
  }

  const projectRoot = findProjectRoot();
  const mainPath = join(projectRoot, '.vite', 'build', 'index.cjs');

  if (!existsSync(mainPath)) {
    throw new Error(
      'GUI is not built.\n' +
      'Please reinstall port-arranger: npm install -g port-arranger'
    );
  }

  // Electron 프로세스를 detached 모드로 실행
  const isCliJs = electronPath.endsWith('cli.js');
  const command = isCliJs ? process.execPath : electronPath;
  const args = isCliJs ? [electronPath, mainPath] : [mainPath];

  const child = spawn(command, args, {
    detached: true,
    stdio: 'ignore',
    cwd: projectRoot,
  });

  child.unref();

  console.log('Port Arranger GUI launched.');
}
