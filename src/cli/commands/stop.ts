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
    console.log(chalk.red('Specify a process name or use --all option.'));
    console.log(chalk.gray('Usage: pa stop <name> or pa stop --all'));
    return;
  }

  await stopSingleProcess(name);
}

async function stopSingleProcess(name: string): Promise<void> {
  const mapping = await getProcess(name);

  if (!mapping) {
    console.log(chalk.red(`Process '${name}' not found.`));
    console.log(chalk.gray("Use 'pa list' to see running processes."));
    return;
  }

  const { pid } = mapping;

  if (!isProcessRunning(pid)) {
    console.log(chalk.yellow(`Process '${name}' already stopped.`));
    await removeProcess(name);
    console.log(chalk.gray('Removed from state'));
    return;
  }

  try {
    await killProcess(pid);
    await removeProcess(name);
    console.log(chalk.green(`✓ Process '${name}' stopped (PID: ${pid})`));
  } catch (error) {
    console.log(chalk.red(`Failed to stop process: ${(error as Error).message}`));
  }
}

async function stopAllProcesses(): Promise<void> {
  const processes = await getAllProcesses();
  const entries = Object.entries(processes);

  if (entries.length === 0) {
    console.log(chalk.gray('No processes to stop.'));
    return;
  }

  console.log(chalk.blue(`Stopping ${entries.length} processes...`));

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
    console.log(chalk.green(`✓ All processes stopped (${successCount})`));
  } else {
    console.log(chalk.yellow(`Complete: ${successCount} succeeded, ${failCount} failed`));
  }
}
