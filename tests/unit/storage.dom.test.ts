// @vitest-environment jsdom
// REQ-007 storage アダプタの耐障害性(TC-051 storage 例外系)
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadRecent, saveRecent } from "../../src/adapters/storage";
import type { SearchState } from "../../src/core/codec";

const entry: SearchState = {
  seiKana: "なつめ",
  meiKana: "そうせき",
  titleKana: "",
  lang: "en",
  selected: ["Sōseki Natsume"],
};

afterEach(() => {
  vi.unstubAllGlobals();
  try {
    localStorage.clear();
  } catch {
    /* noop */
  }
});

describe("TC-051 storage 耐障害性", () => {
  it("TC-051 保存→読み込みで往復する", () => {
    saveRecent([entry]);
    expect(loadRecent()).toEqual([entry]);
  });
  it("TC-051 未保存は空配列", () => {
    localStorage.clear();
    expect(loadRecent()).toEqual([]);
  });
  it("TC-051 破損 JSON は空配列(クラッシュしない)", () => {
    localStorage.setItem("honyaku-query:recent", "{not valid json");
    expect(loadRecent()).toEqual([]);
  });
  it("TC-051 配列でない JSON は空配列", () => {
    localStorage.setItem("honyaku-query:recent", '{"a":1}');
    expect(loadRecent()).toEqual([]);
  });
  it("TC-051 setItem 例外(quota 等)は握り潰す", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceeded");
      },
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    });
    expect(() => saveRecent([entry])).not.toThrow();
  });
  it("TC-051 localStorage 不可環境は機能低下のみ(空配列・no-op)", () => {
    vi.stubGlobal("localStorage", undefined);
    expect(loadRecent()).toEqual([]);
    expect(() => saveRecent([entry])).not.toThrow();
  });
});
