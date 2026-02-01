import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';
import type { ComposePortMapping, ComposeServicePorts, AllocatedComposePort } from '../../shared/types.js';

const OVERRIDE_FILENAME = '.pa-compose-override.yml';

interface ComposeService {
  ports?: (string | number | PortObject)[];
  [key: string]: unknown;
}

interface PortObject {
  target: number;
  published?: number | string;
  protocol?: 'tcp' | 'udp';
}

interface ComposeConfig {
  services?: Record<string, ComposeService>;
  [key: string]: unknown;
}

/**
 * 포트 문자열을 파싱하여 호스트/컨테이너 포트 추출
 * 지원 형식:
 * - "3000" → 3000:3000
 * - "3000:8000" → 3000:8000
 * - "127.0.0.1:3000:8000" → 3000:8000 (IP 무시)
 * - "3000:8000/tcp" → 3000:8000 (tcp)
 */
export function parsePortString(portStr: string | number): ComposePortMapping {
  if (typeof portStr === 'number') {
    return { hostPort: portStr, containerPort: portStr };
  }

  // 프로토콜 분리
  let protocol: 'tcp' | 'udp' | undefined;
  let portPart = portStr;
  if (portStr.endsWith('/tcp')) {
    protocol = 'tcp';
    portPart = portStr.slice(0, -4);
  } else if (portStr.endsWith('/udp')) {
    protocol = 'udp';
    portPart = portStr.slice(0, -4);
  }

  const parts = portPart.split(':');

  if (parts.length === 1) {
    // "3000" 형태
    const port = parseInt(parts[0], 10);
    return { hostPort: port, containerPort: port, protocol };
  }

  if (parts.length === 2) {
    // "3000:8000" 형태
    return {
      hostPort: parseInt(parts[0], 10),
      containerPort: parseInt(parts[1], 10),
      protocol,
    };
  }

  if (parts.length === 3) {
    // "127.0.0.1:3000:8000" 형태 (IP:hostPort:containerPort)
    return {
      hostPort: parseInt(parts[1], 10),
      containerPort: parseInt(parts[2], 10),
      protocol,
    };
  }

  throw new Error(`Unsupported port format: ${portStr}`);
}

/**
 * 포트 객체(long syntax)를 파싱
 */
function parsePortObject(portObj: PortObject): ComposePortMapping {
  return {
    hostPort: portObj.published ? parseInt(String(portObj.published), 10) : portObj.target,
    containerPort: portObj.target,
    protocol: portObj.protocol,
  };
}

/**
 * docker-compose.yml 파일을 파싱
 */
export function parseComposeFile(cwd: string, filename = 'docker-compose.yml'): ComposeConfig {
  const composePath = join(cwd, filename);

  if (!existsSync(composePath)) {
    throw new Error(`Docker Compose 파일을 찾을 수 없습니다: ${composePath}`);
  }

  const content = readFileSync(composePath, 'utf-8');
  const config = yaml.load(content) as ComposeConfig;

  if (!config || typeof config !== 'object') {
    throw new Error('유효하지 않은 Docker Compose 파일입니다');
  }

  return config;
}

/**
 * 서비스 이름 목록 추출 (명령어에서 특정 서비스가 지정된 경우)
 */
export function extractServiceNames(command: string): string[] {
  // "docker compose up service1 service2" 형태에서 서비스명 추출
  const match = command.match(/docker\s+compose\s+(up|start|run)\s+(.+)/);

  if (!match) {
    return []; // 서비스 지정 없음 = 모든 서비스
  }

  const servicesPart = match[2];
  // 옵션 플래그 제거 (-d, --detach 등)
  const services = servicesPart
    .split(/\s+/)
    .filter(s => !s.startsWith('-') && s.length > 0);

  return services;
}

/**
 * 특정 서비스의 포트 매핑 추출
 */
export function extractServicePorts(config: ComposeConfig, serviceName: string): ComposePortMapping[] {
  const service = config.services?.[serviceName];

  if (!service) {
    throw new Error(`서비스를 찾을 수 없습니다: ${serviceName}`);
  }

  if (!service.ports || service.ports.length === 0) {
    return [];
  }

  return service.ports.map(port => {
    if (typeof port === 'object' && 'target' in port) {
      return parsePortObject(port as PortObject);
    }
    return parsePortString(port as string | number);
  });
}

/**
 * 모든 서비스의 포트 매핑 추출
 */
export function getAllServicePorts(config: ComposeConfig, serviceNames?: string[]): ComposeServicePorts[] {
  const services = config.services || {};
  const targetServices = serviceNames && serviceNames.length > 0
    ? serviceNames
    : Object.keys(services);

  const result: ComposeServicePorts[] = [];

  for (const serviceName of targetServices) {
    try {
      const ports = extractServicePorts(config, serviceName);
      if (ports.length > 0) {
        result.push({ serviceName, ports });
      }
    } catch {
      // 서비스가 없으면 무시
    }
  }

  return result;
}

/**
 * Override YAML 파일 생성
 */
export function generateOverrideYaml(allocatedPorts: Map<string, AllocatedComposePort[]>): string {
  const services: Record<string, { ports: string[] }> = {};

  for (const [serviceName, ports] of allocatedPorts) {
    const portStrings = ports.map(p => {
      const protocol = p.protocol ? `/${p.protocol}` : '';
      return `"${p.newHostPort}:${p.containerPort}${protocol}"`;
    });

    services[serviceName] = {
      ports: portStrings,
    };
  }

  // YAML 직접 생성 (js-yaml의 dump는 커스텀 태그를 지원하지 않음)
  // Docker Compose v2.24+에서 !override는 이전 파일의 배열을 완전히 대체함
  let yamlContent = 'services:\n';

  for (const [serviceName, config] of Object.entries(services)) {
    yamlContent += `  ${serviceName}:\n`;
    yamlContent += `    ports: !override\n`;
    for (const port of config.ports) {
      yamlContent += `      - ${port}\n`;
    }
  }

  return yamlContent;
}

/**
 * Override 파일 작성
 */
export function writeOverrideFile(cwd: string, content: string): string {
  const overridePath = join(cwd, OVERRIDE_FILENAME);
  writeFileSync(overridePath, content, 'utf-8');
  return overridePath;
}

/**
 * docker compose 명령어를 override 파일을 포함하도록 변환
 */
export function transformComposeCommand(originalCommand: string, overridePath: string): string {
  // "docker compose up" → "docker compose -f docker-compose.yml -f .pa-compose-override.yml up"
  const match = originalCommand.match(/^(docker\s+compose)\s+(up|start|run)(.*)$/);

  if (!match) {
    return originalCommand;
  }

  const [, dockerCompose, subcommand, rest] = match;
  return `${dockerCompose} -f docker-compose.yml -f ${OVERRIDE_FILENAME} ${subcommand}${rest}`;
}

/**
 * Override 파일 경로 반환
 */
export function getOverrideFilePath(cwd: string): string {
  return join(cwd, OVERRIDE_FILENAME);
}
