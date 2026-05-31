import type { BellRule, ExamConfig, ExamSubject } from "@exam-countdown/shared";
import { parseLocalDateTime } from "@exam-countdown/shared";

export type ConfigValidationResult =
  | {
      ok: true;
      config: ExamConfig;
      errors: [];
    }
  | {
      ok: false;
      errors: string[];
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function validateSubject(subject: ExamSubject, errors: string[]) {
  const start = parseLocalDateTime(subject.startTime);
  const end = parseLocalDateTime(subject.endTime);

  if (!start) {
    errors.push(`${subject.label || subject.key}的开考时间格式不正确`);
  }

  if (!end) {
    errors.push(`${subject.label || subject.key}的结束时间格式不正确`);
  }

  if (start && end && end.getTime() <= start.getTime()) {
    errors.push(`${subject.label || subject.key}的结束时间必须晚于开考时间`);
  }
}

function validateBellRule(rule: BellRule, errors: string[]) {
  if (!["start", "end"].includes(rule.anchor)) {
    errors.push(`${rule.name || rule.id}的响铃基准无效`);
  }

  if (!["before", "after"].includes(rule.direction)) {
    errors.push(`${rule.name || rule.id}的响铃方向无效`);
  }

  if (!Number.isFinite(rule.offsetSeconds) || rule.offsetSeconds < 0) {
    errors.push(`${rule.name || rule.id}的响铃时间偏移无效`);
  }
}

export function validateExamConfigPayload(payload: unknown): ConfigValidationResult {
  const errors: string[] = [];

  if (!isRecord(payload)) {
    return {
      ok: false,
      errors: ["配置文件必须是 JSON 对象"]
    };
  }

  const config = payload as unknown as ExamConfig;

  if (!isRecord(config.texts)) {
    errors.push("页面文字配置缺失");
  } else {
    for (const [key, value] of Object.entries(config.texts)) {
      if (!isString(value)) {
        errors.push(`页面文字 ${key} 必须是文本`);
      }
    }
  }

  if (!Array.isArray(config.subjects) || config.subjects.length === 0) {
    errors.push("至少需要一个考试科目");
  } else {
    const seen = new Set<string>();
    for (const subject of config.subjects) {
      if (!isRecord(subject)) {
        errors.push("科目配置格式不正确");
        continue;
      }

      if (!isString(subject.key) || !subject.key) {
        errors.push("科目 key 缺失");
        continue;
      }

      if (seen.has(subject.key)) {
        errors.push(`科目 ${subject.key} 重复`);
      }
      seen.add(subject.key);

      if (!isString(subject.label) || !subject.label) {
        errors.push(`科目 ${subject.key} 的名称缺失`);
      }

      validateSubject(subject as ExamSubject, errors);
    }

    if (!Array.isArray(config.selectedSubjectKeys) || config.selectedSubjectKeys.length === 0) {
      errors.push("至少需要选择一个当前显示科目");
    } else {
      for (const key of config.selectedSubjectKeys) {
        if (!seen.has(key)) {
          errors.push(`已选科目 ${key} 不存在`);
        }
      }
    }
  }

  if (!Array.isArray(config.bellRules)) {
    errors.push("响铃规则配置缺失");
  } else {
    for (const rule of config.bellRules) {
      if (!isRecord(rule)) {
        errors.push("响铃规则格式不正确");
        continue;
      }

      validateBellRule(rule as BellRule, errors);
    }
  }

  if (!isString(config.audioDirectory)) {
    errors.push("音频文件夹路径必须是文本");
  }

  if (errors.length > 0) {
    return {
      ok: false,
      errors
    };
  }

  return {
    ok: true,
    config,
    errors: []
  };
}
