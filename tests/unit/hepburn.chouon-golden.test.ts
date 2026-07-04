// REQ-001 ヘボン式変換 — 第3弾: 長音(TC-006 / TC-007)+ 黄金テスト(TC-009)+ 周辺文字
import { describe, expect, it } from "vitest";
import { toHepburn } from "../../src/core/hepburn";
import { UNCONVERTIBLE_V1 } from "../fixtures/kana-table-edge";

const val = (kana: string): string => {
  const r = toHepburn(kana);
  if (!r.ok) throw new Error(`expected ok for ${kana}: ${JSON.stringify(r.error)}`);
  return r.value;
};

describe("TC-006 長音マクロン", () => {
  it("TC-006 おう/おお → ō", () => {
    expect(val("そうせき")).toBe("sōseki");
    expect(val("おおえ")).toBe("ōe");
  });
  it("TC-006 うう → ū", () => {
    expect(val("ゆうこ")).toBe("yūko");
  });
  it("TC-006 えい は長音化しない", () => {
    expect(val("えいご")).toBe("eigo");
    expect(val("けいこ")).toBe("keiko");
  });
});

describe("TC-007 カタカナ長音符", () => {
  it("TC-007 ー は直前母音のマクロン", () => {
    expect(val("コーヒー")).toBe("kōhī");
    expect(val("スキー")).toBe("sukī");
  });
  it("TC-007 先頭の ー はエラー", () => {
    const r = toHepburn("ーア");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.index).toBe(0);
  });
});

describe("TC-009 黄金テスト(歴史上の作家名。姓・名はフィールド単位で変換)", () => {
  // toHepburn は1フィールド(姓 or 名)単位で呼ぶ設計(UI の入力形に対応)。
  // 「なつめそうせき→natsume sōseki」(TEST_SPEC)はフィールド対の意味と解釈(STATE Decisions 記録)。
  const golden: ReadonlyArray<readonly [string, string]> = [
    ["なつめ", "natsume"],
    ["そうせき", "sōseki"],
    ["もり", "mori"],
    ["おうがい", "ōgai"],
    ["たにざき", "tanizaki"],
    ["じゅんいちろう", "jun'ichirō"],
    ["かわばた", "kawabata"],
    ["やすなり", "yasunari"],
  ];
  it("TC-009 主要作家名の通し変換", () => {
    for (const [kana, expected] of golden) {
      expect(val(kana), kana).toBe(expected);
    }
  });
});

describe("周辺文字(v1 は unconvertible — fixtures/kana-table-edge)", () => {
  it("ゐ・ゑ・ヴ 等はエラー", () => {
    for (const ch of UNCONVERTIBLE_V1) {
      const r = toHepburn(ch);
      expect(r.ok, ch).toBe(false);
    }
  });
});
