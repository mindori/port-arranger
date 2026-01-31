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
    injectPort: (cmd) => cmd,
  },

  // Node.js (Express 등) - 환경변수 방식
  {
    name: 'node',
    patterns: [/\bnode\s+\S+\.js\b/, /\bnode\s+\S+\.mjs\b/, /\bnode\s+\S+\.cjs\b/],
    injectionType: 'env',
    injectPort: (cmd) => cmd,
  },

  // Vite - 플래그 방식
  {
    name: 'vite',
    patterns: [/\bvite\b/],
    injectionType: 'flag',
    injectPort: (cmd, port) => {
      const cleaned = removePortFlag(cmd, '--port');
      return `${cleaned} --port ${port}`;
    },
  },

  // uvicorn - 플래그 방식
  {
    name: 'uvicorn',
    patterns: [/\buvicorn\b/],
    injectionType: 'flag',
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
    injectPort: (cmd, port) => `${cmd} ${port}`,
  },

  // Django runserver - 인자 방식
  {
    name: 'django',
    patterns: [/manage\.py\s+runserver/],
    injectionType: 'arg',
    injectPort: (cmd, port) => `${cmd} ${port}`,
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
