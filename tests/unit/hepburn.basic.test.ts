// REQ-001 ヘボン式変換 — 第1弾: 基本表・ひらがな/カタカナ同一視・拗音・変換不能
// TC-001 / TC-002 / TC-008(docs/TEST_SPEC.md)
import { describe, expect, it } from "vitest";
import { toHepburn } from "../../src/core/hepburn";

const val = (kana: string): string => {
  const r = toHepburn(kana);
  if (!r.ok) throw new Error(`expected ok for ${kana}: ${JSON.stringify(r.error)}`);
  return r.value;
};

describe("TC-001 五十音基本・ひらがな/カタカナ同一視", () => {
  it("TC-001 基本の変換", () => {
    expect(val("なつめ")).toBe("natsume");
    expect(val("かわばた")).toBe("kawabata");
    expect(val("ふじ")).toBe("fuji");
    expect(val("つとむ")).toBe("tsutomu");
  });
  it("TC-001 カタカナはひらがなと同一結果", () => {
    expect(val("ナツメ")).toBe(val("なつめ"));
    expect(val("フジ")).toBe(val("ふじ"));
  });
  it("TC-001 濁音・半濁音", () => {
    expect(val("だざい")).toBe("dazai");
    expect(val("ぱぴぷ")).toBe("papipu");
  });
});

describe("TC-002 拗音", () => {
  it("TC-002 主要拗音", () => {
    expect(val("しゃ")).toBe("sha");
    expect(val("ちゅ")).toBe("chu");
    expect(val("じょ")).toBe("jo");
    expect(val("りょ")).toBe("ryo");
    expect(val("ぎゃ")).toBe("gya");
  });
  it("TC-002 語中の拗音(最長一致がバラけない)", () => {
    expect(val("いしゃ")).toBe("isha");
    expect(val("りょてい")).toBe("ryotei"); // 拗音2文字を優先(riyotei にならない)
  });
});

describe("TC-008 変換不能", () => {
  it("TC-008 漢字混じりは位置付きエラー", () => {
    const r = toHepburn("夏め");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe("unconvertible");
      expect(r.error.index).toBe(0);
      expect(r.error.char).toBe("夏");
    }
  });
  it("TC-008 語中の位置が正しい", () => {
    const r = toHepburn("なつ目");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.index).toBe(2);
  });
});
