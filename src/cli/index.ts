#!/usr/bin/env node

import { Command } from 'commander';
import { runCommand } from './commands/run.js';
import { listCommand } from './commands/list.js';
import { stopCommand } from './commands/stop.js';
import { uiCommand } from './commands/ui.js';

const program = new Command();

program
  .name('pa')
  .description('Run multiple dev servers simultaneously without port conflicts')
  .version('0.0.1');

program
  .command('run')
  .description('Run a development server')
  .argument('<command>', 'Command to execute')
  .option('-n, --name <name>', 'Project name (default: current directory)')
  .option('-p, --port <port>', 'Preferred port number', parseInt)
  .option('--dry-run', 'Print command without executing')
  .action(async (command: string, options) => {
    try {
      await runCommand(command, options);
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('list')
  .alias('ls')
  .description('List running processes')
  .action(async () => {
    try {
      await listCommand();
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('stop')
  .description('Stop a process')
  .argument('[name]', 'Name of process to stop')
  .option('-a, --all', 'Stop all processes')
  .action(async (name: string | undefined, options) => {
    try {
      await stopCommand(name, options);
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('ui')
  .description('Launch GUI dashboard')
  .action(async () => {
    try {
      await uiCommand();
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

program.parse();
