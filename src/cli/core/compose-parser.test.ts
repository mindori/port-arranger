import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  parsePortString,
  parseComposeFile,
  extractServiceNames,
  extractServicePorts,
  getAllServicePorts,
  generateOverrideYaml,
  writeOverrideFile,
  transformComposeCommand,
} from './compose-parser.js';
import type { AllocatedComposePort } from '../../shared/types.js';

describe('compose-parser', () => {
  describe('parsePortString', () => {
    it('숫자만 있는 경우 호스트와 컨테이너 포트가 같다', () => {
      expect(parsePortString('3000')).toEqual({
        hostPort: 3000,
        containerPort: 3000,
      });
    });

    it('숫자 타입도 처리한다', () => {
      expect(parsePortString(8080)).toEqual({
        hostPort: 8080,
        containerPort: 8080,
      });
    });

    it('host:container 형태를 파싱한다', () => {
      expect(parsePortString('3000:8000')).toEqual({
        hostPort: 3000,
        containerPort: 8000,
      });
    });

    it('ip:host:container 형태를 파싱한다 (IP 무시)', () => {
      expect(parsePortString('127.0.0.1:3000:8000')).toEqual({
        hostPort: 3000,
        containerPort: 8000,
      });
    });

    it('프로토콜을 파싱한다', () => {
      expect(parsePortString('3000:8000/tcp')).toEqual({
        hostPort: 3000,
        containerPort: 8000,
        protocol: 'tcp',
      });

      expect(parsePortString('5432:5432/udp')).toEqual({
        hostPort: 5432,
        containerPort: 5432,
        protocol: 'udp',
      });
    });

    it('지원하지 않는 형식은 에러를 던진다', () => {
      expect(() => parsePortString('a:b:c:d')).toThrow('지원하지 않는 포트 형식');
    });
  });

  describe('extractServiceNames', () => {
    it('서비스 이름을 추출한다', () => {
      expect(extractServiceNames('docker compose up web')).toEqual(['web']);
      expect(extractServiceNames('docker compose up web api')).toEqual(['web', 'api']);
    });

    it('옵션 플래그를 제외한다', () => {
      expect(extractServiceNames('docker compose up -d web')).toEqual(['web']);
      expect(extractServiceNames('docker compose up --detach web api')).toEqual(['web', 'api']);
    });

    it('서비스 지정 없으면 빈 배열 반환', () => {
      expect(extractServiceNames('docker compose up')).toEqual([]);
      expect(extractServiceNames('docker compose up -d')).toEqual([]);
    });

    it('start/run 명령도 인식한다', () => {
      expect(extractServiceNames('docker compose start web')).toEqual(['web']);
      expect(extractServiceNames('docker compose run api')).toEqual(['api']);
    });
  });

  describe('transformComposeCommand', () => {
    it('up 명령어에 override 파일을 추가한다', () => {
      const result = transformComposeCommand(
        'docker compose up llm',
        '.pa-compose-override.yml'
      );
      expect(result).toBe(
        'docker compose -f docker-compose.yml -f .pa-compose-override.yml up llm'
      );
    });

    it('start 명령어도 변환한다', () => {
      const result = transformComposeCommand(
        'docker compose start web api',
        '.pa-compose-override.yml'
      );
      expect(result).toBe(
        'docker compose -f docker-compose.yml -f .pa-compose-override.yml start web api'
      );
    });

    it('인식되지 않는 명령어는 원본 반환', () => {
      const result = transformComposeCommand(
        'docker compose logs',
        '.pa-compose-override.yml'
      );
      expect(result).toBe('docker compose logs');
    });
  });

  describe('generateOverrideYaml', () => {
    it('단일 서비스의 override YAML을 생성한다', () => {
      const allocatedPorts = new Map<string, AllocatedComposePort[]>();
      allocatedPorts.set('web', [
        {
          hostPort: 3001,
          containerPort: 8000,
          originalHostPort: 3000,
          newHostPort: 3001,
        },
      ]);

      const yaml = generateOverrideYaml(allocatedPorts);
      expect(yaml).toContain('services:');
      expect(yaml).toContain('web:');
      expect(yaml).toContain('ports: !override');
      expect(yaml).toContain('"3001:8000"');
    });

    it('다중 서비스의 override YAML을 생성한다', () => {
      const allocatedPorts = new Map<string, AllocatedComposePort[]>();
      allocatedPorts.set('web', [
        {
          hostPort: 3001,
          containerPort: 8000,
          originalHostPort: 3000,
          newHostPort: 3001,
        },
      ]);
      allocatedPorts.set('api', [
        {
          hostPort: 3002,
          containerPort: 8001,
          originalHostPort: 3001,
          newHostPort: 3002,
        },
      ]);

      const yaml = generateOverrideYaml(allocatedPorts);
      expect(yaml).toContain('web:');
      expect(yaml).toContain('api:');
      expect(yaml).toContain('"3001:8000"');
      expect(yaml).toContain('"3002:8001"');
    });

    it('프로토콜을 포함한다', () => {
      const allocatedPorts = new Map<string, AllocatedComposePort[]>();
      allocatedPorts.set('db', [
        {
          hostPort: 5433,
          containerPort: 5432,
          protocol: 'tcp',
          originalHostPort: 5432,
          newHostPort: 5433,
        },
      ]);

      const yaml = generateOverrideYaml(allocatedPorts);
      expect(yaml).toContain('"5433:5432/tcp"');
    });
  });

  describe('parseComposeFile / extractServicePorts / getAllServicePorts', () => {
    let tmpDir: string;

    beforeEach(() => {
      tmpDir = join(tmpdir(), `pa-test-${Date.now()}`);
      mkdirSync(tmpDir, { recursive: true });
    });

    afterEach(() => {
      rmSync(tmpDir, { recursive: true, force: true });
    });

    it('docker-compose.yml 파일을 파싱한다', () => {
      const composeContent = `
services:
  web:
    image: nginx
    ports:
      - "3000:80"
  api:
    image: node
    ports:
      - "3001:8000"
`;
      writeFileSync(join(tmpDir, 'docker-compose.yml'), composeContent);

      const config = parseComposeFile(tmpDir);
      expect(config.services).toBeDefined();
      expect(config.services?.web).toBeDefined();
      expect(config.services?.api).toBeDefined();
    });

    it('없는 파일은 에러를 던진다', () => {
      expect(() => parseComposeFile(tmpDir)).toThrow('Docker Compose 파일을 찾을 수 없습니다');
    });

    it('서비스의 포트를 추출한다', () => {
      const composeContent = `
services:
  web:
    ports:
      - "3000:80"
      - "3001:443"
`;
      writeFileSync(join(tmpDir, 'docker-compose.yml'), composeContent);

      const config = parseComposeFile(tmpDir);
      const ports = extractServicePorts(config, 'web');

      expect(ports).toHaveLength(2);
      expect(ports[0]).toEqual({ hostPort: 3000, containerPort: 80 });
      expect(ports[1]).toEqual({ hostPort: 3001, containerPort: 443 });
    });

    it('없는 서비스는 에러를 던진다', () => {
      const composeContent = `
services:
  web:
    ports:
      - "3000:80"
`;
      writeFileSync(join(tmpDir, 'docker-compose.yml'), composeContent);

      const config = parseComposeFile(tmpDir);
      expect(() => extractServicePorts(config, 'nonexistent')).toThrow('서비스를 찾을 수 없습니다');
    });

    it('모든 서비스의 포트를 가져온다', () => {
      const composeContent = `
services:
  web:
    ports:
      - "3000:80"
  api:
    ports:
      - "3001:8000"
  db:
    image: postgres
`;
      writeFileSync(join(tmpDir, 'docker-compose.yml'), composeContent);

      const config = parseComposeFile(tmpDir);
      const allPorts = getAllServicePorts(config);

      expect(allPorts).toHaveLength(2); // db는 포트 없음
      expect(allPorts.find(s => s.serviceName === 'web')).toBeDefined();
      expect(allPorts.find(s => s.serviceName === 'api')).toBeDefined();
    });

    it('특정 서비스만 필터링한다', () => {
      const composeContent = `
services:
  web:
    ports:
      - "3000:80"
  api:
    ports:
      - "3001:8000"
`;
      writeFileSync(join(tmpDir, 'docker-compose.yml'), composeContent);

      const config = parseComposeFile(tmpDir);
      const filtered = getAllServicePorts(config, ['web']);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].serviceName).toBe('web');
    });

    it('long syntax 포트를 파싱한다', () => {
      const composeContent = `
services:
  web:
    ports:
      - target: 80
        published: 3000
        protocol: tcp
`;
      writeFileSync(join(tmpDir, 'docker-compose.yml'), composeContent);

      const config = parseComposeFile(tmpDir);
      const ports = extractServicePorts(config, 'web');

      expect(ports).toHaveLength(1);
      expect(ports[0]).toEqual({
        hostPort: 3000,
        containerPort: 80,
        protocol: 'tcp',
      });
    });
  });

  describe('writeOverrideFile', () => {
    let tmpDir: string;

    beforeEach(() => {
      tmpDir = join(tmpdir(), `pa-test-${Date.now()}`);
      mkdirSync(tmpDir, { recursive: true });
    });

    afterEach(() => {
      rmSync(tmpDir, { recursive: true, force: true });
    });

    it('override 파일을 작성한다', () => {
      const content = 'test content';
      const path = writeOverrideFile(tmpDir, content);

      expect(path).toContain('.pa-compose-override.yml');
    });
  });
});
