import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const css = readFileSync(fileURLToPath(new URL("./styles.css", import.meta.url)), "utf8");
const desktopCss = css.slice(0, css.indexOf("@media"));

function cssBlock(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = [...desktopCss.matchAll(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, "g"))];
  return matches.at(-1)?.[1] ?? "";
}

describe("main exam screen visual calibration", () => {
  test("uses the reference-like title font and stretch", () => {
    const title = cssBlock(".display h1");

    expect(title).toContain("top: 7.6%;");
    expect(title).toContain('font-family: SimHei, "Microsoft YaHei", "微软雅黑", sans-serif;');
    expect(title).toContain("font-size: clamp(66px, 8.35vh, 104px);");
    expect(title).toContain("font-weight: 400;");
    expect(title).toContain("transform: scaleX(1.3);");
  });

  test("keeps the exam metadata compact and regular weight", () => {
    const meta = cssBlock(".meta");
    const metaRows = cssBlock(".meta div,\n.subject-line");
    const metaLabels = cssBlock(".meta span,\n.subject-line span");
    const metaValues = cssBlock(".meta strong");
    const subjectValues = cssBlock(".subject-line strong,\n.subject-line em");

    expect(meta).toContain("top: 24.4%;");
    expect(meta).toContain("left: 12.8%;");
    expect(meta).toContain("font-size: clamp(36px, 4.7vh, 54px);");
    expect(meta).toContain("line-height: 1;");
    expect(metaRows).toContain("min-height: 4.9vh;");
    expect(metaLabels).toContain("flex: 0 0 clamp(220px, 12vw, 320px);");
    expect(metaLabels).toContain("white-space: nowrap;");
    expect(metaLabels).toContain("word-break: keep-all;");
    expect(metaValues).toContain("font-weight: 400;");
    expect(subjectValues).toContain("font-size: clamp(58px, 6.8vh, 70px);");
    expect(subjectValues).toContain("font-weight: 400;");

    const subjectStatus = cssBlock(".subject-line em");
    expect(subjectStatus).toContain("margin-left: clamp(0px, 3vw, 72px);");
  });

  test("uses wide Song-style numerals for the main clock", () => {
    const clock = cssBlock(".clock");

    expect(clock).toContain('font-family: SimSun, "宋体", "Times New Roman", serif;');
    expect(clock).toContain("top: 46.1%;");
    expect(clock).toContain("font-size: clamp(178px, 25.2vh, 300px);");
    expect(clock).toContain("transform: scaleX(1.42);");
  });
});
