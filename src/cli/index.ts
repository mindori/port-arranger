#!/usr/bin/env node

import { Command } from 'commander';
import { runCommand } from './commands/run.js';
import { listCommand } from './commands/list.js';
import { stopCommand } from './commands/stop.js';
import { uiCommand } from './commands/ui.js';

const program = new Command();

program
  .name('pa')
  .description('포트 충돌 없이 여러 개발 서버를 동시에 실행')
  .version('0.0.1');

program
  .command('run')
  .description('개발 서버 실행')
  .argument('<command>', '실행할 명령어')
  .option('-n, --name <name>', '프로젝트 이름 (기본: 현재 디렉토리명)')
  .option('-p, --port <port>', '선호 포트 번호', parseInt)
  .option('--dry-run', '실행하지 않고 명령어만 출력')
  .action(async (command: string, options) => {
    try {
      await runCommand(command, options);
    } catch (error) {
      console.error('오류:', (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('list')
  .alias('ls')
  .description('실행 중인 프로세스 목록')
  .action(async () => {
    try {
      await listCommand();
    } catch (error) {
      console.error('오류:', (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('stop')
  .description('프로세스 종료')
  .argument('[name]', '종료할 프로세스 이름')
  .option('-a, --all', '모든 프로세스 종료')
  .action(async (name: string | undefined, options) => {
    try {
      await stopCommand(name, options);
    } catch (error) {
      console.error('오류:', (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('ui')
  .description('GUI 대시보드 실행')
  .action(async () => {
    try {
      await uiCommand();
    } catch (error) {
      console.error('오류:', (error as Error).message);
      process.exit(1);
    }
  });

program.parse();
