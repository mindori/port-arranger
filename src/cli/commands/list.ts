import chalk from 'chalk';
import { getAllProcesses } from '../core/state.js';
import { isProcessRunning } from '../core/process-manager.js';

export async function listCommand(): Promise<void> {
  const processes = await getAllProcesses();
  const entries = Object.entries(processes);

  if (entries.length === 0) {
    console.log(chalk.gray('실행 중인 프로세스가 없습니다.'));
    console.log(chalk.gray('pa run "<명령어>"로 프로세스를 시작하세요.'));
    return;
  }

  console.log(chalk.bold('\n실행 중인 프로세스:\n'));

  // 테이블 헤더
  console.log(
    chalk.gray(
      padEnd('이름', 20) +
      padEnd('포트', 8) +
      padEnd('PID', 10) +
      padEnd('상태', 10) +
      '명령어'
    )
  );
  console.log(chalk.gray('─'.repeat(80)));

  for (const [name, mapping] of entries) {
    const running = isProcessRunning(mapping.pid);
    const status = running
      ? chalk.green('실행중')
      : chalk.red('중지됨');

    const port = chalk.cyan(String(mapping.port));
    const pid = String(mapping.pid);
    const cmd = truncate(mapping.originalCommand, 30);

    console.log(
      padEnd(name, 20) +
      padEnd(port, 8) +
      padEnd(pid, 10) +
      padEnd(status, 10) +
      chalk.gray(cmd)
    );
  }

  console.log();
}

function padEnd(str: string, length: number): string {
  // ANSI 코드 제거 후 길이 계산
  const plainStr = str.replace(/\x1b\[[0-9;]*m/g, '');
  const padding = Math.max(0, length - plainStr.length);
  return str + ' '.repeat(padding);
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.slice(0, maxLength - 3) + '...';
}
