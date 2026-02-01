import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function uiCommand(): Promise<void> {
  // Electron 실행 파일 경로 찾기
  const projectRoot = join(__dirname, '..', '..', '..');
  const electronPath = join(projectRoot, 'node_modules', '.bin', 'electron');

  if (!existsSync(electronPath)) {
    throw new Error(
      'Electron is not installed.\n' +
      'Run npm install and try again.'
    );
  }

  // Vite 빌드 결과물 확인
  const mainPath = join(projectRoot, '.vite', 'build', 'index.cjs');

  if (!existsSync(mainPath)) {
    throw new Error(
      'GUI is not built.\n' +
      'Run npm run build:gui and try again.'
    );
  }

  // Electron 프로세스를 detached 모드로 실행
  const child = spawn(electronPath, [mainPath], {
    detached: true,
    stdio: 'ignore',
    cwd: projectRoot,
  });

  child.unref();

  console.log('Port Arranger GUI launched.');
}
