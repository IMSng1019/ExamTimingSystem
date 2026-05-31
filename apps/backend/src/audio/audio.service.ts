import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { AudioFileInfo } from "@exam-countdown/shared";

const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac"]);

@Injectable()
export class AudioService {
  async listFiles(directory: string): Promise<AudioFileInfo[]> {
    if (!directory) {
      return [];
    }

    const resolved = path.resolve(directory);
    const stat = await this.getDirectoryStat(resolved);
    if (!stat) {
      return [];
    }

    const entries = await fs.readdir(resolved, {
      withFileTypes: true
    });
    const files: AudioFileInfo[] = [];

    for (const entry of entries) {
      if (!entry.isFile()) {
        continue;
      }

      const ext = path.extname(entry.name).toLowerCase();
      if (!AUDIO_EXTENSIONS.has(ext)) {
        continue;
      }

      const filePath = path.join(resolved, entry.name);
      const fileStat = await fs.stat(filePath);
      files.push({
        name: entry.name,
        size: fileStat.size
      });
    }

    return files.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
  }

  async resolveAudioFile(directory: string, name: string): Promise<string> {
    if (!directory || !name) {
      throw new BadRequestException("音频目录或文件名缺失");
    }

    if (path.basename(name) !== name) {
      throw new BadRequestException("音频文件名无效");
    }

    const ext = path.extname(name).toLowerCase();
    if (!AUDIO_EXTENSIONS.has(ext)) {
      throw new BadRequestException("不支持的音频格式");
    }

    const resolvedDirectory = path.resolve(directory);
    const filePath = path.join(resolvedDirectory, name);
    const relative = path.relative(resolvedDirectory, filePath);

    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new BadRequestException("音频文件路径无效");
    }

    try {
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) {
        throw new NotFoundException("音频文件不存在");
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException("音频文件不存在");
    }

    return filePath;
  }

  private async getDirectoryStat(directory: string) {
    try {
      const stat = await fs.stat(directory);
      return stat.isDirectory() ? stat : null;
    } catch {
      return null;
    }
  }
}
