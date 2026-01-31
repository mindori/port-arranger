import { describe, it, expect } from 'vitest';
import { injectPort } from './port-injector.js';

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
  });
});
