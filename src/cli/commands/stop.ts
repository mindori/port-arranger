import chalk from 'chalk';
import { getAllProcesses, removeProcess, getProcess } from '../core/state.js';
import { killProcess, isProcessRunning } from '../core/process-manager.js';

interface StopOptions {
  all?: boolean;
}

export async function stopCommand(
  name: string | undefined,
  options: StopOptions
): Promise<void> {
  if (options.all) {
    await stopAllProcesses();
    return;
  }

  if (!name) {
    console.log(chalk.red('프로세스 이름을 지정하거나 --all 옵션을 사용하세요.'));
    console.log(chalk.gray('사용법: pa stop <이름> 또는 pa stop --all'));
    return;
  }

  await stopSingleProcess(name);
}

async function stopSingleProcess(name: string): Promise<void> {
  const mapping = await getProcess(name);

  if (!mapping) {
    console.log(chalk.red(`'${name}' 프로세스를 찾을 수 없습니다.`));
    console.log(chalk.gray('pa list로 실행 중인 프로세스를 확인하세요.'));
    return;
  }

  const { pid } = mapping;

  if (!isProcessRunning(pid)) {
    console.log(chalk.yellow(`'${name}' 프로세스가 이미 종료되었습니다.`));
    await removeProcess(name);
    console.log(chalk.gray('상태 목록에서 제거됨'));
    return;
  }

  try {
    await killProcess(pid);
    await removeProcess(name);
    console.log(chalk.green(`✓ '${name}' 프로세스 종료됨 (PID: ${pid})`));
  } catch (error) {
    console.log(chalk.red(`프로세스 종료 실패: ${(error as Error).message}`));
  }
}

async function stopAllProcesses(): Promise<void> {
  const processes = await getAllProcesses();
  const entries = Object.entries(processes);

  if (entries.length === 0) {
    console.log(chalk.gray('종료할 프로세스가 없습니다.'));
    return;
  }

  console.log(chalk.blue(`${entries.length}개 프로세스 종료 중...`));

  let successCount = 0;
  let failCount = 0;

  for (const [name, mapping] of entries) {
    try {
      if (isProcessRunning(mapping.pid)) {
        await killProcess(mapping.pid);
      }
      await removeProcess(name);
      console.log(chalk.green(`  ✓ ${name} (PID: ${mapping.pid})`));
      successCount++;
    } catch (error) {
      console.log(chalk.red(`  ✗ ${name}: ${(error as Error).message}`));
      failCount++;
    }
  }

  console.log();
  if (failCount === 0) {
    console.log(chalk.green(`✓ 모든 프로세스 종료 완료 (${successCount}개)`));
  } else {
    console.log(chalk.yellow(`완료: ${successCount}개 성공, ${failCount}개 실패`));
  }
}
