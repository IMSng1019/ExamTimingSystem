import type { ExamConfig } from "@exam-countdown/shared";

export interface ElectronFileResult {
  canceled: boolean;
  path?: string;
  config?: ExamConfig;
}

declare global {
  interface Window {
    examBridge?: {
      selectAudioDirectory: () => Promise<string | null>;
      saveConfigFile: (config: ExamConfig) => Promise<ElectronFileResult>;
      openConfigFile: () => Promise<ElectronFileResult>;
    };
  }
}

export {};
