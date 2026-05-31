import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const css = readFileSync(fileURLToPath(new URL("./styles.css", import.meta.url)), "utf8");

function cssBlock(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  return match?.[1] ?? "";
}

describe("main exam screen visual calibration", () => {
  test("uses the reference-like title font and stretch", () => {
    const title = cssBlock(".display h1");

    expect(title).toContain('font-family: SimHei, "Microsoft YaHei", "微软雅黑", sans-serif;');
    expect(title).toContain("font-weight: 400;");
    expect(title).toContain("transform: scaleX(1.3);");
  });

  test("keeps the exam metadata compact and regular weight", () => {
    const meta = cssBlock(".meta");
    const metaValues = cssBlock(".meta strong");
    const subjectValues = cssBlock(".subject-line strong,\n.subject-line em");

    expect(meta).toContain("top: 21.4%;");
    expect(meta).toContain("font-size: clamp(36px, 4.7vh, 54px);");
    expect(metaValues).toContain("font-weight: 400;");
    expect(subjectValues).toContain("font-size: clamp(58px, 6.8vh, 80px);");
    expect(subjectValues).toContain("font-weight: 400;");
  });

  test("uses wide Song-style numerals for the main clock", () => {
    const clock = cssBlock(".clock");

    expect(clock).toContain('font-family: SimSun, "宋体", "Times New Roman", serif;');
    expect(clock).toContain("top: 46.1%;");
    expect(clock).toContain("font-size: clamp(178px, 25.2vh, 300px);");
    expect(clock).toContain("transform: scaleX(1.42);");
  });
});
