import { describe, it, expect } from 'vitest';
import { injectPort, getDefaultPort } from './port-injector.js';

describe('injectPort', () => {
  // 환경변수 방식 (PORT=X)
  describe('환경변수 방식 (env)', () => {
    it('next dev → PORT 환경변수', () => {
      const result = injectPort('next dev', 3001);
      expect(result.env.PORT).toBe('3001');
      expect(result.command).toBe('next dev');
      expect(result.toolName).toBe('next');
      expect(result.injectionType).toBe('env');
    });

    it('npx next dev → PORT 환경변수', () => {
      const result = injectPort('npx next dev', 3001);
      expect(result.env.PORT).toBe('3001');
      expect(result.toolName).toBe('next');
    });

    it('node server.js → PORT 환경변수', () => {
      const result = injectPort('node server.js', 3001);
      expect(result.env.PORT).toBe('3001');
      expect(result.toolName).toBe('node');
      expect(result.injectionType).toBe('env');
    });

    it('node index.js → PORT 환경변수', () => {
      const result = injectPort('node index.js', 3001);
      expect(result.env.PORT).toBe('3001');
    });
  });

  // 플래그 방식 (--port X)
  describe('플래그 방식 (flag)', () => {
    it('vite → --port 플래그', () => {
      const result = injectPort('vite', 3001);
      expect(result.command).toBe('vite --port 3001');
      expect(result.toolName).toBe('vite');
      expect(result.injectionType).toBe('flag');
    });

    it('vite dev → --port 플래그', () => {
      const result = injectPort('vite dev', 3001);
      expect(result.command).toBe('vite dev --port 3001');
      expect(result.toolName).toBe('vite');
    });

    it('npx vite → --port 플래그', () => {
      const result = injectPort('npx vite', 3001);
      expect(result.command).toBe('npx vite --port 3001');
      expect(result.toolName).toBe('vite');
    });

    it('uvicorn main:app → --port 플래그', () => {
      const result = injectPort('uvicorn main:app', 8001);
      expect(result.command).toBe('uvicorn main:app --port 8001');
      expect(result.toolName).toBe('uvicorn');
      expect(result.injectionType).toBe('flag');
    });

    it('fastapi dev → --port 플래그', () => {
      const result = injectPort('fastapi dev', 8001);
      expect(result.command).toBe('fastapi dev --port 8001');
      expect(result.toolName).toBe('fastapi');
    });

    it('flask run → --port 플래그', () => {
      const result = injectPort('flask run', 5001);
      expect(result.command).toBe('flask run --port 5001');
      expect(result.toolName).toBe('flask');
    });

    it('npx http-server → -p 플래그', () => {
      const result = injectPort('npx http-server', 8080);
      expect(result.command).toBe('npx http-server -p 8080');
      expect(result.toolName).toBe('http-server');
    });

    it('http-server → -p 플래그', () => {
      const result = injectPort('http-server .', 8080);
      expect(result.command).toBe('http-server . -p 8080');
      expect(result.toolName).toBe('http-server');
    });
  });

  // 인자 방식 (마지막 인자로 포트)
  describe('인자 방식 (arg)', () => {
    it('python -m http.server → 마지막 인자', () => {
      const result = injectPort('python -m http.server', 8000);
      expect(result.command).toBe('python -m http.server 8000');
      expect(result.toolName).toBe('http.server');
      expect(result.injectionType).toBe('arg');
    });

    it('python3 -m http.server → 마지막 인자', () => {
      const result = injectPort('python3 -m http.server', 8000);
      expect(result.command).toBe('python3 -m http.server 8000');
      expect(result.toolName).toBe('http.server');
    });

    it('manage.py runserver → 포트 인자', () => {
      const result = injectPort('python manage.py runserver', 8000);
      expect(result.command).toBe('python manage.py runserver 8000');
      expect(result.toolName).toBe('django');
    });

    it('./manage.py runserver → 포트 인자', () => {
      const result = injectPort('./manage.py runserver', 8000);
      expect(result.command).toBe('./manage.py runserver 8000');
      expect(result.toolName).toBe('django');
    });
  });

  // Fallback
  describe('fallback (인식되지 않는 명령어)', () => {
    it('인식 안 되는 명령어 → PORT 환경변수', () => {
      const result = injectPort('my-custom-server', 3001);
      expect(result.env.PORT).toBe('3001');
      expect(result.command).toBe('my-custom-server');
      expect(result.toolName).toBe('unknown');
      expect(result.injectionType).toBe('env');
    });

    it('임의의 스크립트 → PORT 환경변수', () => {
      const result = injectPort('./start.sh', 3001);
      expect(result.env.PORT).toBe('3001');
      expect(result.toolName).toBe('unknown');
    });
  });

  // 기존 포트 옵션이 있는 경우
  describe('기존 포트 옵션 처리', () => {
    it('vite --port 3000 → 포트 교체', () => {
      const result = injectPort('vite --port 3000', 3001);
      expect(result.command).toBe('vite --port 3001');
    });

    it('uvicorn main:app --port 8000 → 포트 교체', () => {
      const result = injectPort('uvicorn main:app --port 8000', 8001);
      expect(result.command).toBe('uvicorn main:app --port 8001');
    });

    it('python http.server 기존 포트 → 포트 교체', () => {
      const result = injectPort('python3 -m http.server 3000', 3002);
      expect(result.command).toBe('python3 -m http.server 3002');
      expect(result.injectionType).toBe('arg');
    });

    it('flask run --port 5000 → 포트 교체', () => {
      const result = injectPort('flask run --port 5000', 5001);
      expect(result.command).toBe('flask run --port 5001');
    });

    it('fastapi dev --port 8000 → 포트 교체', () => {
      const result = injectPort('fastapi dev --port 8000', 8001);
      expect(result.command).toBe('fastapi dev --port 8001');
    });

    it('http-server -p 8080 → 포트 교체', () => {
      const result = injectPort('http-server -p 8080', 9000);
      expect(result.command).toBe('http-server -p 9000');
    });

    it('django runserver 기존 포트 → 포트 교체', () => {
      const result = injectPort('python manage.py runserver 8000', 8001);
      expect(result.command).toBe('python manage.py runserver 8001');
    });

    it('django runserver host:port → 포트 교체', () => {
      const result = injectPort('python manage.py runserver 0.0.0.0:8000', 8001);
      expect(result.command).toBe('python manage.py runserver 8001');
    });
  });

  // npm run dev 방식
  describe('npm run dev 방식', () => {
    it('npm run dev → -- --port 플래그', () => {
      const result = injectPort('npm run dev', 3001);
      expect(result.command).toBe('npm run dev -- --port 3001');
      expect(result.injectionType).toBe('flag');
    });

    it('npm run dev에 이미 포트가 지정된 경우 교체해야 한다', () => {
      const result = injectPort('npm run dev -- --port 3000', 3001);
      expect(result.command).toBe('npm run dev -- --port 3001');
    });
  });

  // yarn/pnpm run dev 방식
  describe('yarn/pnpm run dev 방식', () => {
    it('yarn run dev → --port 플래그', () => {
      const result = injectPort('yarn run dev', 3001);
      expect(result.command).toBe('yarn run dev --port 3001');
      expect(result.injectionType).toBe('flag');
    });

    it('pnpm run dev → --port 플래그', () => {
      const result = injectPort('pnpm run dev', 3001);
      expect(result.command).toBe('pnpm run dev --port 3001');
      expect(result.injectionType).toBe('flag');
    });

    it('yarn dev (shortcut) → --port 플래그', () => {
      const result = injectPort('yarn dev', 3001);
      expect(result.command).toBe('yarn dev --port 3001');
      expect(result.toolName).toBe('yarn-dev');
    });

    it('pnpm dev (shortcut) → --port 플래그', () => {
      const result = injectPort('pnpm dev', 3001);
      expect(result.command).toBe('pnpm dev --port 3001');
      expect(result.toolName).toBe('pnpm-dev');
    });
  });

  // Docker Compose 방식
  describe('Docker Compose 방식 (compose)', () => {
    it('docker compose up → compose 타입', () => {
      const result = injectPort('docker compose up', 3001);
      expect(result.injectionType).toBe('compose');
      expect(result.toolName).toBe('docker-compose');
      expect(result.command).toBe('docker compose up'); // 원본 유지
    });

    it('docker compose up -d → compose 타입', () => {
      const result = injectPort('docker compose up -d', 3001);
      expect(result.injectionType).toBe('compose');
      expect(result.toolName).toBe('docker-compose');
    });

    it('docker compose up service1 service2 → compose 타입', () => {
      const result = injectPort('docker compose up web api', 3001);
      expect(result.injectionType).toBe('compose');
      expect(result.toolName).toBe('docker-compose');
    });

    it('docker compose start → compose 타입', () => {
      const result = injectPort('docker compose start web', 3001);
      expect(result.injectionType).toBe('compose');
      expect(result.toolName).toBe('docker-compose');
    });

    it('docker compose run → compose 타입', () => {
      const result = injectPort('docker compose run api', 3001);
      expect(result.injectionType).toBe('compose');
      expect(result.toolName).toBe('docker-compose');
    });
  });
});

describe('getDefaultPort', () => {
  describe('도구별 기본 포트 반환', () => {
    it('next dev → 3000', () => {
      expect(getDefaultPort('next dev')).toBe(3000);
    });

    it('node server.js → 3000', () => {
      expect(getDefaultPort('node server.js')).toBe(3000);
    });

    it('vite → 5173', () => {
      expect(getDefaultPort('vite')).toBe(5173);
    });

    it('npm run dev → 5173', () => {
      expect(getDefaultPort('npm run dev')).toBe(5173);
    });

    it('yarn dev → 5173', () => {
      expect(getDefaultPort('yarn dev')).toBe(5173);
    });

    it('pnpm dev → 5173', () => {
      expect(getDefaultPort('pnpm dev')).toBe(5173);
    });

    it('uvicorn main:app → 8000', () => {
      expect(getDefaultPort('uvicorn main:app')).toBe(8000);
    });

    it('fastapi dev main.py → 8000', () => {
      expect(getDefaultPort('fastapi dev main.py')).toBe(8000);
    });

    it('flask run → 5000', () => {
      expect(getDefaultPort('flask run')).toBe(5000);
    });

    it('http-server → 8080', () => {
      expect(getDefaultPort('http-server .')).toBe(8080);
    });

    it('python -m http.server → 8000', () => {
      expect(getDefaultPort('python -m http.server')).toBe(8000);
    });

    it('python manage.py runserver → 8000', () => {
      expect(getDefaultPort('python manage.py runserver')).toBe(8000);
    });

    it('docker compose up -d → 0 (yml에서 파싱)', () => {
      expect(getDefaultPort('docker compose up -d')).toBe(0);
    });
  });

  describe('알 수 없는 명령어는 3000 반환', () => {
    it('my-custom-server → 3000', () => {
      expect(getDefaultPort('my-custom-server')).toBe(3000);
    });

    it('./start.sh → 3000', () => {
      expect(getDefaultPort('./start.sh')).toBe(3000);
    });
  });
});
