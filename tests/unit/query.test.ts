// REQ-004 view-model(TC-025〜028)
import { describe, expect, it } from "vitest";
import {
  buildCopyString,
  buildLinks,
  buildVariants,
  defaultSelectedValues,
} from "../../src/core/query";
import { TARGETS } from "../../src/core/targets";

const vals = (vs: ReadonlyArray<{ value: string }>): string[] => vs.map((v) => v.value);

describe("TC-025 buildVariants", () => {
  it("TC-025 姓名は西洋順が先頭・大文字化", () => {
    const r = buildVariants({ seiKana: "なつめ", meiKana: "そうせき" });
    expect(vals(r.nameVariants)[0]).toBe("Sōseki Natsume");
    expect(r.titleVariants).toHaveLength(0);
    expect(r.errors).toEqual([]);
  });
  it("TC-025 作品名は長音展開のみ(小文字・ピリオドなし)", () => {
    const r = buildVariants({ titleKana: "こうや" }); // kōya
    expect(vals(r.titleVariants)).toContain("koya");
    for (const v of vals(r.titleVariants)) {
      expect(v).toBe(v.toLowerCase());
      expect(v).not.toMatch(/\./);
    }
  });
  it("TC-025 変換不能な読みは errors に field と index を返す", () => {
    const r = buildVariants({ seiKana: "夏め" });
    expect(r.errors).toEqual([
      { field: "sei", error: { code: "unconvertible", index: 0, char: "夏" } },
    ]);
    expect(r.nameVariants).toHaveLength(0);
  });
});

describe("TC-026 既定選択(上位4件 ON)", () => {
  it("TC-026 優先度上位4件が既定 ON", () => {
    const r = buildVariants({ seiKana: "おおえ", meiKana: "けんざぶろう" });
    const sel = defaultSelectedValues(r.nameVariants);
    expect(sel.size).toBe(4);
    expect([...sel]).toEqual(vals(r.nameVariants).slice(0, 4));
  });
  it("TC-026 4件未満はある分だけ", () => {
    const r = buildVariants({ titleKana: "はな" }); // hana(長音なし=1件)
    expect(defaultSelectedValues(r.titleVariants).size).toBe(1);
  });
});

describe("TC-027 リンク行列・コピー文字列", () => {
  const today = new Date("2026-07-15T00:00:00Z");
  it("TC-027 variant×target のリンクを生成しエンコードする", () => {
    const rows = buildLinks(
      [{ value: "Sōseki Natsume", ruleTags: [], priority: 0 }],
      TARGETS,
      today,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.links).toHaveLength(TARGETS.length);
    const google = rows[0]?.links.find((l) => l.targetId === "googlebooks");
    expect(google?.url).toBe("https://www.google.com/search?tbm=bks&q=S%C5%8Dseki+Natsume");
  });
  it("TC-027 stale フラグは today 注入で判定", () => {
    const stale = new Date("2030-01-01T00:00:00Z");
    const rows = buildLinks([{ value: "x", ruleTags: [], priority: 0 }], TARGETS, stale);
    expect(rows[0]?.links.every((l) => l.stale)).toBe(true);
    const fresh = buildLinks([{ value: "x", ruleTags: [], priority: 0 }], TARGETS, today);
    expect(fresh[0]?.links.every((l) => l.stale)).toBe(false);
  });
  it("TC-027 コピー文字列は value を改行連結", () => {
    const s = buildCopyString([
      { value: "Sōseki Natsume", ruleTags: [], priority: 0 },
      { value: "Natsume Sōseki", ruleTags: [], priority: 1 },
    ]);
    expect(s).toBe("Sōseki Natsume\nNatsume Sōseki");
  });
});

describe("TC-028 最低1フィールド・単独姓", () => {
  it("TC-028 全フィールド空は空結果(エラーなし)", () => {
    const r = buildVariants({ seiKana: "  ", meiKana: "" }); // title 未指定 = 全空
    expect(r.nameVariants).toHaveLength(0);
    expect(r.titleVariants).toHaveLength(0);
    expect(r.errors).toEqual([]);
  });
  it("TC-028 姓のみ入力は大文字化した単独名バリアント", () => {
    const r = buildVariants({ seiKana: "さとう" }); // satō
    expect(vals(r.nameVariants)[0]).toBe("Satō");
    expect(vals(r.nameVariants)).toContain("Satoh"); // 語末 oh 形も大文字化
    for (const v of vals(r.nameVariants)) {
      expect(v).not.toMatch(/\./); // 単独名にイニシャル形は作らない
    }
  });
});
