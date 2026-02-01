import type { InjectionResult, InjectionType, CommandPattern } from '../../shared/types.js';

// 포트 플래그 제거 헬퍼
const removePortFlag = (cmd: string, flag: string): string => {
  // --port 8000 또는 -p 8000 형태 제거
  const regex = new RegExp(`${flag}\\s+\\d+`, 'g');
  return cmd.replace(regex, '').replace(/\s+/g, ' ').trim();
};

// 명령어 패턴 정의
const patterns: CommandPattern[] = [
  // Next.js - 환경변수 방식
  {
    name: 'next',
    patterns: [/\bnext\s+dev\b/, /\bnext\s+start\b/, /\bnext\b/],
    injectionType: 'env',
    defaultPort: 3000,
    injectPort: (cmd) => cmd,
  },

  // Node.js (Express 등) - 환경변수 방식
  {
    name: 'node',
    patterns: [/\bnode\s+\S+\.js\b/, /\bnode\s+\S+\.mjs\b/, /\bnode\s+\S+\.cjs\b/],
    injectionType: 'env',
    defaultPort: 3000,
    injectPort: (cmd) => cmd,
  },

  // Vite - 플래그 방식
  {
    name: 'vite',
    patterns: [/\bvite\b/],
    injectionType: 'flag',
    defaultPort: 5173,
    injectPort: (cmd, port) => {
      const cleaned = removePortFlag(cmd, '--port');
      return `${cleaned} --port ${port}`;
    },
  },

  // npm run dev (vite 프로젝트) - 플래그 방식
  {
    name: 'npm-dev',
    patterns: [/\bnpm\s+run\s+dev\b/],
    injectionType: 'flag',
    defaultPort: 5173,
    injectPort: (cmd, port) => {
      // npm run dev -- --port 3001 형태로 전달
      const cleaned = cmd.replace(/\s+--\s+--port\s+\d+/, '');
      return `${cleaned} -- --port ${port}`;
    },
  },

  // yarn run dev - 플래그 방식
  {
    name: 'yarn-dev',
    patterns: [/\byarn\s+run\s+dev\b/, /\byarn\s+dev\b/],
    injectionType: 'flag',
    defaultPort: 5173,
    injectPort: (cmd, port) => {
      const cleaned = cmd.replace(/\s+--port\s+\d+/, '');
      return `${cleaned} --port ${port}`;
    },
  },

  // pnpm run dev - 플래그 방식
  {
    name: 'pnpm-dev',
    patterns: [/\bpnpm\s+run\s+dev\b/, /\bpnpm\s+dev\b/],
    injectionType: 'flag',
    defaultPort: 5173,
    injectPort: (cmd, port) => {
      const cleaned = cmd.replace(/\s+--port\s+\d+/, '');
      return `${cleaned} --port ${port}`;
    },
  },

  // uvicorn - 플래그 방식
  {
    name: 'uvicorn',
    patterns: [/\buvicorn\b/],
    injectionType: 'flag',
    defaultPort: 8000,
    injectPort: (cmd, port) => {
      const cleaned = removePortFlag(cmd, '--port');
      return `${cleaned} --port ${port}`;
    },
  },

  // FastAPI - 플래그 방식
  {
    name: 'fastapi',
    patterns: [/\bfastapi\s+(dev|run)\b/],
    injectionType: 'flag',
    defaultPort: 8000,
    injectPort: (cmd, port) => {
      const cleaned = removePortFlag(cmd, '--port');
      return `${cleaned} --port ${port}`;
    },
  },

  // Flask - 플래그 방식
  {
    name: 'flask',
    patterns: [/\bflask\s+run\b/],
    injectionType: 'flag',
    defaultPort: 5000,
    injectPort: (cmd, port) => {
      const cleaned = removePortFlag(cmd, '--port');
      return `${cleaned} --port ${port}`;
    },
  },

  // http-server (npm) - 플래그 방식 (-p)
  {
    name: 'http-server',
    patterns: [/\bhttp-server\b/],
    injectionType: 'flag',
    defaultPort: 8080,
    injectPort: (cmd, port) => {
      const cleaned = removePortFlag(cmd, '-p');
      return `${cleaned} -p ${port}`;
    },
  },

  // Python http.server - 인자 방식
  {
    name: 'http.server',
    patterns: [/python3?\s+-m\s+http\.server/],
    injectionType: 'arg',
    defaultPort: 8000,
    injectPort: (cmd, port) => {
      // 기존 포트 번호 제거 (http.server 뒤의 숫자)
      const cleaned = cmd.replace(/(http\.server)\s+\d+/, '$1');
      return `${cleaned} ${port}`;
    },
  },

  // Django runserver - 인자 방식
  {
    name: 'django',
    patterns: [/manage\.py\s+runserver/],
    injectionType: 'arg',
    defaultPort: 8000,
    injectPort: (cmd, port) => {
      // 기존 포트 번호 제거 (runserver 뒤의 host:port 또는 숫자)
      // host:port를 먼저 매칭해야 함 (0.0.0.0:8000 등)
      const cleaned = cmd.replace(/(runserver)\s+([\w.]+:\d+|\d+)/, '$1');
      return `${cleaned} ${port}`;
    },
  },

  // Docker Compose - compose 방식
  {
    name: 'docker-compose',
    patterns: [/docker\s+compose\s+(up|start|run)\b/],
    injectionType: 'compose',
    defaultPort: 0, // compose는 yml에서 파싱
    injectPort: (cmd) => cmd, // compose는 run.ts에서 별도 처리
  },
];

function findMatchingPattern(command: string): CommandPattern | null {
  for (const pattern of patterns) {
    for (const regex of pattern.patterns) {
      if (regex.test(command)) {
        return pattern;
      }
    }
  }
  return null;
}

// 도구별 기본 포트 조회
export function getDefaultPort(command: string): number {
  const matchedPattern = findMatchingPattern(command);
  return matchedPattern?.defaultPort ?? 3000;
}

export function injectPort(originalCommand: string, port: number): InjectionResult {
  const matchedPattern = findMatchingPattern(originalCommand);

  if (matchedPattern) {
    const injectionType = matchedPattern.injectionType;
    const env: Record<string, string> = {};

    if (injectionType === 'env') {
      env.PORT = String(port);
      return {
        command: originalCommand,
        env,
        injectionType,
        toolName: matchedPattern.name,
      };
    }

    return {
      command: matchedPattern.injectPort(originalCommand, port),
      env,
      injectionType,
      toolName: matchedPattern.name,
    };
  }

  // Fallback: 환경변수 방식
  return {
    command: originalCommand,
    env: { PORT: String(port) },
    injectionType: 'env',
    toolName: 'unknown',
  };
}
