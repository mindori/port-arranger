import chalk from 'chalk';
import { getAllProcesses } from '../core/state.js';
import { isProcessRunning, getComposeServicesStatus } from '../core/process-manager.js';

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

    const pid = String(mapping.pid);
    const cmd = truncate(mapping.originalCommand, 30);

    // compose인 경우 서비스별로 하위 표시
    if (mapping.injectionType === 'compose' && mapping.composePorts?.length) {
      // 각 서비스의 실제 상태 조회
      const serviceStatuses = await getComposeServicesStatus(mapping.cwd);

      // 실행 중인 서비스 수 계산
      const services = mapping.composePorts;
      const runningCount = services.filter(s => serviceStatuses.get(s.serviceName)).length;
      const totalCount = services.length;

      // 프로젝트 레벨 상태: 항상 N/M 형식으로 표시
      let projectStatus: string;
      if (runningCount === totalCount) {
        projectStatus = chalk.green(`${runningCount}/${totalCount}`);
      } else if (runningCount > 0) {
        projectStatus = chalk.yellow(`${runningCount}/${totalCount}`);
      } else {
        projectStatus = chalk.red(`${runningCount}/${totalCount}`);
      }

      console.log(
        padEnd(name, 20) +
        padEnd(chalk.gray('-'), 8) +
        padEnd(pid, 10) +
        padEnd(projectStatus, 10) +
        chalk.gray(cmd)
      );

      // 서비스별 표시 (상태 포함)
      for (let i = 0; i < services.length; i++) {
        const svc = services[i];
        const isLast = i === services.length - 1;
        const prefix = isLast ? '  └─ ' : '  ├─ ';
        const svcRunning = serviceStatuses.get(svc.serviceName) ?? false;
        const svcStatus = svcRunning ? chalk.green('●') : chalk.red('●');
        const portColor = svcRunning ? chalk.cyan : chalk.gray;

        console.log(
          chalk.gray(prefix) +
          svcStatus + ' ' +
          padEnd(svc.serviceName, 13) +
          portColor(String(svc.port))
        );
      }
    } else {
      const port = chalk.cyan(String(mapping.port));

      console.log(
        padEnd(name, 20) +
        padEnd(port, 8) +
        padEnd(pid, 10) +
        padEnd(status, 10) +
        chalk.gray(cmd)
      );
    }
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
