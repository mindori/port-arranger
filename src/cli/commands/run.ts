import { basename } from 'path';
import chalk from 'chalk';
import { findAvailablePort } from '../core/port-finder.js';
import { injectPort, getDefaultPort } from '../core/port-injector.js';
import { spawnProcess } from '../core/process-manager.js';
import { addProcess } from '../core/state.js';
import {
  parseComposeFile,
  getAllServicePorts,
  extractServiceNames,
  generateOverrideYaml,
  writeOverrideFile,
  transformComposeCommand,
} from '../core/compose-parser.js';
import type { ProcessMapping, AllocatedComposePort, ComposeServicePort } from '../../shared/types.js';

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
  const cwd = process.cwd();

  // 포트 주입 (패턴 인식)
  const injection = injectPort(command, options.port || 3000);

  // Docker Compose 처리
  if (injection.injectionType === 'compose') {
    await runComposeCommand(command, projectName, cwd, options);
    return;
  }

  // 일반 명령어 처리
  await runNormalCommand(command, injection, projectName, cwd, options);
}

async function runNormalCommand(
  command: string,
  injection: ReturnType<typeof injectPort>,
  projectName: string,
  cwd: string,
  options: RunOptions
): Promise<void> {
  const defaultPort = getDefaultPort(command);
  const preferredPort = options.port || defaultPort;
  const availablePort = await findAvailablePort(preferredPort);

  // 포트 재주입 (실제 할당된 포트로)
  const finalInjection = injectPort(command, availablePort);

  console.log(chalk.blue(`[${projectName}]`) + ` Port ${chalk.green(availablePort)} assigned`);

  if (options.dryRun) {
    console.log(chalk.yellow('\n[dry-run] Not actually executing'));
    return;
  }

  const pid = await spawnProcess(projectName, finalInjection.command, finalInjection.env, cwd);

  const mapping: ProcessMapping = {
    port: availablePort,
    pid,
    command: finalInjection.command,
    originalCommand: command,
    injectionType: finalInjection.injectionType,
    cwd,
    startedAt: new Date().toISOString(),
    status: 'running',
  };

  await addProcess(projectName, mapping);

  console.log(chalk.green(`\n✓ Process started (PID: ${pid})`));
  console.log(chalk.gray(`http://localhost:${availablePort}`));
}

async function runComposeCommand(
  command: string,
  projectName: string,
  cwd: string,
  options: RunOptions
): Promise<void> {
  console.log(chalk.blue(`[${projectName}]`) + ' Docker Compose mode');

  // 1. docker-compose.yml 파싱
  const config = parseComposeFile(cwd);
  const serviceNames = extractServiceNames(command);
  const servicePorts = getAllServicePorts(config, serviceNames.length > 0 ? serviceNames : undefined);

  if (servicePorts.length === 0) {
    console.log(chalk.yellow('No services with exposed ports. Running original command.'));
    if (!options.dryRun) {
      const pid = await spawnProcess(projectName, command, {}, cwd);
      await addProcess(projectName, {
        port: 0,
        pid,
        command,
        originalCommand: command,
        injectionType: 'compose',
        cwd,
        startedAt: new Date().toISOString(),
        status: 'running',
      });
    }
    return;
  }

  // 2. 각 서비스의 각 포트에 대해 사용 가능한 포트 할당
  const allocatedPorts = new Map<string, AllocatedComposePort[]>();
  const portSummary: string[] = [];

  for (const service of servicePorts) {
    const allocated: AllocatedComposePort[] = [];

    for (const port of service.ports) {
      const newHostPort = await findAvailablePort(port.hostPort);
      allocated.push({
        ...port,
        originalHostPort: port.hostPort,
        newHostPort,
      });

      if (port.hostPort !== newHostPort) {
        portSummary.push(
          `  ${chalk.cyan(service.serviceName)}: ${chalk.yellow(port.hostPort)} → ${chalk.green(newHostPort)}`
        );
      } else {
        portSummary.push(
          `  ${chalk.cyan(service.serviceName)}: ${chalk.green(port.hostPort)}`
        );
      }
    }

    allocatedPorts.set(service.serviceName, allocated);
  }

  // 3. 포트 충돌이 있는 경우에만 override 파일 생성
  const hasConflict = Array.from(allocatedPorts.values())
    .flat()
    .some(p => p.originalHostPort !== p.newHostPort);

  let finalCommand = command;

  if (hasConflict) {
    const overrideYaml = generateOverrideYaml(allocatedPorts);
    const overridePath = writeOverrideFile(cwd, overrideYaml);
    finalCommand = transformComposeCommand(command, overridePath);
    console.log(chalk.gray(`Override 파일 생성: ${overridePath}`));
  }

  // 4. 포트 할당 결과 출력
  console.log(chalk.blue('\nPort assignments:'));
  for (const line of portSummary) {
    console.log(line);
  }

  if (options.dryRun) {
    console.log(chalk.yellow('\n[dry-run] Not actually executing'));
    console.log(chalk.gray(`Command: ${finalCommand}`));
    return;
  }

  // 5. 프로세스 실행
  const pid = await spawnProcess(projectName, finalCommand, {}, cwd);

  // 6. 상태 저장 (첫 번째 서비스의 첫 번째 포트를 대표 포트로 사용)
  const firstService = servicePorts[0];
  const firstAllocated = allocatedPorts.get(firstService.serviceName)?.[0];
  const representativePort = firstAllocated?.newHostPort || 0;

  // compose 서비스별 포트 정보 수집
  const composePorts: ComposeServicePort[] = [];
  for (const service of servicePorts) {
    const allocated = allocatedPorts.get(service.serviceName);
    if (allocated && allocated.length > 0) {
      composePorts.push({
        serviceName: service.serviceName,
        port: allocated[0].newHostPort,
      });
    }
  }

  const mapping: ProcessMapping = {
    port: representativePort,
    pid,
    command: finalCommand,
    originalCommand: command,
    injectionType: 'compose',
    cwd,
    startedAt: new Date().toISOString(),
    status: 'running',
    composePorts,
  };

  await addProcess(projectName, mapping);

  console.log(chalk.green(`\n✓ Docker Compose started (PID: ${pid})`));

  // 각 서비스별 URL 출력
  for (const service of servicePorts) {
    const allocated = allocatedPorts.get(service.serviceName);
    if (allocated) {
      for (const port of allocated) {
        console.log(chalk.gray(`${service.serviceName}: http://localhost:${port.newHostPort}`));
      }
    }
  }
}
