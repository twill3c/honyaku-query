// REQ-001 ヘボン式変換 — 第2弾: 促音・撥音(TC-003 / TC-004 / TC-005)
import { describe, expect, it } from "vitest";
import { toHepburn } from "../../src/core/hepburn";

const val = (kana: string): string => {
  const r = toHepburn(kana);
  if (!r.ok) throw new Error(`expected ok for ${kana}: ${JSON.stringify(r.error)}`);
  return r.value;
};

describe("TC-003 促音", () => {
  it("TC-003 子音の重複", () => {
    expect(val("きっぷ")).toBe("kippu");
    expect(val("ざっし")).toBe("zasshi");
    expect(val("はっとり")).toBe("hattori");
  });
  it("TC-003 ch の前は t(っち→tchi)", () => {
    expect(val("こっち")).toBe("kotchi");
    expect(val("ぼっちゃん")).toBe("botchan");
  });
  it("TC-003 後続が音節でない促音はエラー", () => {
    const r = toHepburn("あっ");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.index).toBe(1);
  });
});

describe("TC-004 撥音の m 化(b/m/p の前)", () => {
  it("TC-004 伝統ヘボン式の m", () => {
    expect(val("しんぶん")).toBe("shimbun");
    expect(val("さんぽ")).toBe("sampo");
    expect(val("ぐんま")).toBe("gumma");
  });
});

describe("TC-005 撥音のアポストロフィ(母音・や行の前)", () => {
  it("TC-005 n' が必要な位置", () => {
    expect(val("しんいち")).toBe("shin'ichi");
    expect(val("じゅんや")).toBe("jun'ya");
  });
  it("TC-005 不要な位置は素の n", () => {
    expect(val("しんじ")).toBe("shinji");
    expect(val("にほん")).toBe("nihon"); // 語末
    expect(val("けんた")).toBe("kenta");
  });
});
