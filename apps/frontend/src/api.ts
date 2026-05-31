import type { AudioFileInfo, ExamConfig } from "@exam-countdown/shared";

export const API_BASE = "http://127.0.0.1:3099/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers
    },
    ...options
  });

  if (!response.ok) {
    let message = `请求失败：${response.status}`;
    try {
      const body = await response.json();
      if (Array.isArray(body.errors)) {
        message = body.errors.join("；");
      } else if (typeof body.message === "string") {
        message = body.message;
      }
    } catch {
      // Keep the generic HTTP message.
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function getConfig(): Promise<ExamConfig> {
  return request<ExamConfig>("/config");
}

export function saveConfig(config: ExamConfig): Promise<ExamConfig> {
  return request<ExamConfig>("/config", {
    method: "PUT",
    body: JSON.stringify(config)
  });
}

export function getAudioFiles(directory: string): Promise<AudioFileInfo[]> {
  const query = new URLSearchParams({
    directory
  });
  return request<AudioFileInfo[]>(`/audio/files?${query.toString()}`);
}

export function getAudioUrl(directory: string, name: string): string {
  const query = new URLSearchParams({
    directory,
    name
  });
  return `${API_BASE}/audio/file?${query.toString()}`;
}
