import { basename } from 'path';
import chalk from 'chalk';
import { findAvailablePort } from '../core/port-finder.js';
import { injectPort } from '../core/port-injector.js';
import { spawnProcess } from '../core/process-manager.js';
import { addProcess } from '../core/state.js';
import type { ProcessMapping } from '../../shared/types.js';

interface RunOptions {
  name?: string;
  dryRun?: boolean;
  port?: number;
}

export async function runCommand(
  command: string,
  options: RunOptions
): Promise<void> {
  const projectName = options.name || basename(process.cwd());
  const preferredPort = options.port || 3000;

  // 빈 포트 찾기
  const availablePort = await findAvailablePort(preferredPort);

  // 포트 주입
  const injection = injectPort(command, availablePort);

  console.log(chalk.blue(`[${projectName}]`) + ` 포트 ${chalk.green(availablePort)} 할당`);

  // dry-run 모드
  if (options.dryRun) {
    console.log(chalk.yellow('\n[dry-run] 실제 실행하지 않음'));
    return;
  }

  // 프로세스 실행
  const cwd = process.cwd();
  const pid = await spawnProcess(projectName, injection.command, injection.env, cwd);

  // 상태 저장
  const mapping: ProcessMapping = {
    port: availablePort,
    pid,
    command: injection.command,
    originalCommand: command,
    injectionType: injection.injectionType,
    cwd,
    startedAt: new Date().toISOString(),
    status: 'running',
  };

  await addProcess(projectName, mapping);

  console.log(chalk.green(`\n✓ 프로세스 시작됨 (PID: ${pid})`));
  console.log(chalk.gray(`http://localhost:${availablePort}`));
}
