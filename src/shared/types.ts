// 포트 주입 방식
export type InjectionType = 'env' | 'flag' | 'arg';

// 프로세스 상태
export type ProcessStatus = 'running' | 'stopped';

// 프로세스 매핑 정보
export interface ProcessMapping {
  port: number;
  pid: number;
  command: string;           // 실제 실행된 명령어
  originalCommand: string;   // 원본 명령어
  injectionType: InjectionType;
  cwd: string;               // 작업 디렉토리
  startedAt: string;         // ISO 8601 형식
  status: ProcessStatus;
}

// 상태 파일 전체 구조
export interface State {
  mappings: Record<string, ProcessMapping>;
}

// 포트 주입 결과
export interface InjectionResult {
  command: string;              // 수정된 명령어
  env: Record<string, string>;  // 주입할 환경변수
  injectionType: InjectionType;
  toolName: string;
}

// 명령어 패턴 인식용
export interface CommandPattern {
  name: string;                // 도구 이름 (예: 'vite', 'next')
  patterns: RegExp[];          // 매칭 패턴들
  injectionType: InjectionType;
  injectPort: (cmd: string, port: number) => string;
}
