// 포트 주입 방식
export type InjectionType = 'env' | 'flag' | 'arg' | 'compose';

// Docker Compose 포트 매핑
export interface ComposePortMapping {
  hostPort: number;
  containerPort: number;
  protocol?: 'tcp' | 'udp';
}

// Docker Compose 서비스 포트 정보
export interface ComposeServicePorts {
  serviceName: string;
  ports: ComposePortMapping[];
}

// Docker Compose 할당된 포트 정보
export interface AllocatedComposePort extends ComposePortMapping {
  originalHostPort: number;
  newHostPort: number;
}

// Compose 서비스 포트 정보 (저장용)
export interface ComposeServicePort {
  serviceName: string;
  port: number;
  running?: boolean;  // 실시간 상태 (조회 시 업데이트)
}

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
  composePorts?: ComposeServicePort[];  // compose 서비스별 포트
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
  defaultPort: number;         // 도구별 기본 포트
  injectPort: (cmd: string, port: number) => string;
}

// Electron API (preload에서 노출)
export interface ElectronAPI {
  getProcesses: () => Promise<Record<string, ProcessMapping>>;
  onProcessesUpdate: (callback: (processes: Record<string, ProcessMapping>) => void) => () => void;
  stopProcess: (name: string) => Promise<void>;
  restartProcess: (name: string) => Promise<void>;
  openBrowser: (port: number) => Promise<void>;
  setAlwaysOnTop: (value: boolean) => Promise<void>;
  minimizeWindow: () => void;
  closeWindow: () => void;
}

// Window 전역 타입 확장
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
