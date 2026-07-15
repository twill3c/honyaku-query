// REQ-006 状態 ⇔ URL ハッシュ(TC-041/042)
import { describe, expect, it } from "vitest";
import { type SearchState, decodeState, emptyState, encodeState } from "../../src/core/codec";

describe("TC-041 round-trip", () => {
  it("TC-041 入力・言語・ONバリアントが深い等価で往復する", () => {
    const state: SearchState = {
      seiKana: "なつめ",
      meiKana: "そうせき",
      titleKana: "こころ",
      lang: "en",
      selected: ["Sōseki Natsume", "Natsume Sōseki"],
    };
    expect(decodeState(encodeState(state))).toEqual(state);
  });
  it("TC-041 特殊文字(マクロン・アポストロフィ・空白)を保持する", () => {
    const state: SearchState = {
      seiKana: "たにざき",
      meiKana: "じゅんいちろう",
      titleKana: "",
      lang: "all",
      selected: ["Jun'ichirō Tanizaki", "J. Tanizaki"],
    };
    expect(decodeState(encodeState(state))).toEqual(state);
  });
  it("TC-041 空状態は空文字列に符号化され往復する", () => {
    expect(encodeState(emptyState())).toBe("");
    expect(decodeState("")).toEqual(emptyState());
  });
});

describe("TC-042 不正ハッシュ", () => {
  it("TC-042 壊れた入力は空状態(クラッシュしない)", () => {
    expect(decodeState("%%%not-valid%%%")).toEqual(emptyState());
    expect(decodeState("garbage-without-keys")).toEqual(emptyState());
  });
  it("TC-042 未知の言語は all にフォールバック", () => {
    expect(decodeState("l=klingon").lang).toBe("all");
  });
  it("TC-042 emptyState は毎回新しい配列を返す(共有されない)", () => {
    const a = emptyState();
    a.selected.push("x");
    expect(emptyState().selected).toEqual([]);
  });
});
