// REQ-007 最近の検索・純粋リスト操作(TC-051)
import { describe, expect, it } from "vitest";
import type { SearchState } from "../../src/core/codec";
import { pushRecent, recentKey } from "../../src/core/recent";

const st = (
  sei: string,
  lang: SearchState["lang"] = "all",
  selected: string[] = [],
): SearchState => ({
  seiKana: sei,
  meiKana: "",
  titleKana: "",
  lang,
  selected,
});

describe("TC-051 最近の検索", () => {
  it("TC-051 新規は先頭に積まれる", () => {
    const r = pushRecent([st("あ")], st("い"));
    expect(r.map((e) => e.seiKana)).toEqual(["い", "あ"]);
  });
  it("TC-051 重複(読み+言語が同じ)は先頭へ繰上げ・重複しない", () => {
    const list = [st("あ"), st("い"), st("う")];
    const r = pushRecent(list, st("う"));
    expect(r.map((e) => e.seiKana)).toEqual(["う", "あ", "い"]);
  });
  it("TC-051 選択が違っても読み+言語が同じなら同一視し新しい方で更新", () => {
    const list = [st("あ", "all", ["X"])];
    const r = pushRecent(list, st("あ", "all", ["Y", "Z"]));
    expect(r).toHaveLength(1);
    expect(r[0]?.selected).toEqual(["Y", "Z"]);
  });
  it("TC-051 言語が違えば別エントリ", () => {
    const r = pushRecent([st("あ", "en")], st("あ", "fr"));
    expect(r).toHaveLength(2);
  });
  it("TC-051 上限10件で古いものが切り捨て", () => {
    let list: SearchState[] = [];
    for (let i = 0; i < 12; i++) list = pushRecent(list, st(`x${i}`));
    expect(list).toHaveLength(10);
    expect(list[0]?.seiKana).toBe("x11"); // 最新が先頭
    expect(list.at(-1)?.seiKana).toBe("x2"); // x0, x1 は切り捨て
  });
  it("TC-051 recentKey は読み+言語で決まり選択に依存しない", () => {
    expect(recentKey(st("あ", "en", ["A"]))).toBe(recentKey(st("あ", "en", ["B"])));
    expect(recentKey(st("あ", "en"))).not.toBe(recentKey(st("あ", "fr")));
  });
});
