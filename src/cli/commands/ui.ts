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
      'Electron이 설치되어 있지 않습니다.\n' +
      'npm install을 실행한 후 다시 시도하세요.'
    );
  }

  // Vite 빌드 결과물 확인
  const mainPath = join(projectRoot, '.vite', 'build', 'index.cjs');

  if (!existsSync(mainPath)) {
    throw new Error(
      'GUI가 빌드되지 않았습니다.\n' +
      'npm run build:gui를 실행한 후 다시 시도하세요.'
    );
  }

  // Electron 프로세스를 detached 모드로 실행
  const child = spawn(electronPath, [mainPath], {
    detached: true,
    stdio: 'ignore',
    cwd: projectRoot,
  });

  child.unref();

  console.log('Port Arranger GUI가 실행되었습니다.');
}
