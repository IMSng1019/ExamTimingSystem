import { BadRequestException, Injectable } from "@nestjs/common";
import { createDefaultExamConfig, type ExamConfig } from "@exam-countdown/shared";
import { promises as fs } from "node:fs";
import path from "node:path";
import { validateExamConfigPayload } from "./config.validation";

@Injectable()
export class ConfigService {
  private readonly dataDir = process.env.EXAM_COUNTDOWN_DATA_DIR ?? path.resolve(process.cwd(), "data");
  private readonly configPath = path.join(this.dataDir, "config.json");

  async getConfig(): Promise<ExamConfig> {
    await this.ensureConfigFile();
    const raw = await fs.readFile(this.configPath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    const validation = validateExamConfigPayload(parsed);

    if (!validation.ok) {
      const fallback = createDefaultExamConfig();
      await this.writeConfig(fallback);
      return fallback;
    }

    return validation.config;
  }

  async saveConfig(payload: unknown): Promise<ExamConfig> {
    const validation = validateExamConfigPayload(payload);
    if (!validation.ok) {
      throw new BadRequestException({
        message: "配置无效",
        errors: validation.errors
      });
    }

    await this.writeConfig(validation.config);
    return validation.config;
  }

  validate(payload: unknown) {
    return validateExamConfigPayload(payload);
  }

  private async ensureConfigFile() {
    await fs.mkdir(this.dataDir, {
      recursive: true
    });

    try {
      await fs.access(this.configPath);
    } catch {
      await this.writeConfig(createDefaultExamConfig());
    }
  }

  private async writeConfig(config: ExamConfig) {
    await fs.mkdir(this.dataDir, {
      recursive: true
    });
    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2), "utf8");
  }
}
