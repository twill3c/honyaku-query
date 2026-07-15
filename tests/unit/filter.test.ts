// REQ-005 言語フィルタ(TC-031)
import { describe, expect, it } from "vitest";
import { TARGETS, filterTargetsByLang } from "../../src/core/targets";

const ids = (ts: ReadonlyArray<{ id: string }>): string[] => ts.map((t) => t.id);

describe("TC-031 言語フィルタ", () => {
  it("TC-031 en 選択時、multi ターゲットは残る", () => {
    const r = filterTargetsByLang(TARGETS, "en");
    expect(ids(r)).toContain("wikidata"); // multi は常に残る
    expect(ids(r)).toContain("amazon-com"); // en ターゲット
    expect(ids(r)).not.toContain("ndl"); // ja 専用は除外
  });
  it("TC-031 all は全件を返す", () => {
    expect(filterTargetsByLang(TARGETS, "all")).toHaveLength(TARGETS.length);
  });
  it("TC-031 該当専用ターゲットのない言語でも multi は残る", () => {
    const r = filterTargetsByLang(TARGETS, "zh"); // zh 専用ターゲットは現状なし
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((t) => t.langs.includes("multi"))).toBe(true);
  });
  it("TC-031 multi 選択は横断DBのみ", () => {
    const r = filterTargetsByLang(TARGETS, "multi");
    expect(r.every((t) => t.langs.includes("multi"))).toBe(true);
    expect(ids(r)).not.toContain("amazon-com");
  });
});
