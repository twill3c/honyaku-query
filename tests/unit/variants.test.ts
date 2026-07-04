// REQ-002 表記バリアント展開(TC-011〜016)
import { describe, expect, it } from "vitest";
import { expandLongVowel, expandName, expandTitle } from "../../src/core/variants";

const values = (vs: ReadonlyArray<{ value: string }>): string[] => vs.map((v) => v.value);

describe("TC-011 長音展開の優先順", () => {
  it("TC-011 語中の ō は oh を作らない", () => {
    expect(values(expandLongVowel("sōseki"))).toEqual(["sōseki", "soseki", "souseki"]);
  });
});

describe("TC-012 語末 oh 形", () => {
  it("TC-012 satō は satoh を含む(末尾優先度)", () => {
    expect(values(expandLongVowel("satō"))).toEqual(["satō", "sato", "satou", "satoh"]);
  });
  it("TC-012 ū は uu 形まで(oh なし)", () => {
    expect(values(expandLongVowel("yūko"))).toEqual(["yūko", "yuko", "yuuko"]);
  });
});

describe("TC-013 姓名順・イニシャル", () => {
  it("TC-013 西洋順が主・和順が副・イニシャルが末尾", () => {
    const { variants } = expandName({ sei: "natsume", mei: "sōseki" });
    const vs = values(variants);
    const western = vs.indexOf("Sōseki Natsume");
    const eastern = vs.indexOf("Natsume Sōseki");
    const initial = vs.indexOf("S. Natsume");
    expect(western).toBe(0);
    expect(eastern).toBeGreaterThan(western);
    expect(initial).toBeGreaterThan(eastern);
  });
  it("TC-013 マクロンの大文字化(Ōe)", () => {
    const { variants } = expandName({ sei: "ōe", mei: "kenzaburō" });
    expect(values(variants)[0]).toBe("Kenzaburō Ōe");
  });
});

describe("TC-014 重複除去・上限12", () => {
  it("TC-014 直積が膨らむ入力でも 12 件以下+切り捨てフラグ", () => {
    const r = expandName({ sei: "ōe", mei: "kenzaburō" }); // (3×4)×2順+イニシャル > 12
    expect(r.variants.length).toBeLessThanOrEqual(12);
    expect(r.truncated).toBe(true);
  });
  it("TC-014 小さい入力は切り捨てなし・重複なし", () => {
    const r = expandName({ sei: "kawabata", mei: "yasunari" });
    expect(r.truncated).toBe(false);
    expect(new Set(values(r.variants)).size).toBe(r.variants.length);
  });
});

describe("TC-015 決定性", () => {
  it("TC-015 同一入力2回で同一順序列", () => {
    const a = expandName({ sei: "ōe", mei: "kenzaburō" });
    const b = expandName({ sei: "ōe", mei: "kenzaburō" });
    expect(a).toEqual(b);
  });
});

describe("TC-016 作品名モード", () => {
  it("TC-016 長音展開のみ(姓名順・イニシャル・大文字化なし)", () => {
    const r = expandTitle("yūjō");
    expect(values(r.variants)).toContain("yujo");
    for (const v of values(r.variants)) {
      expect(v).not.toMatch(/\./);
      expect(v).toBe(v.toLowerCase());
    }
  });
});
