// 検索状態 ⇔ URL ハッシュ文字列(REQ-006)。純粋関数のみ・決定的・例外を投げない。
// location.hash の読み書きは adapters/urlHash.ts の責務。本モジュールは文字列変換だけを担う。

import type { LangFilter } from "./targets";

export type SearchState = {
  seiKana: string;
  meiKana: string;
  titleKana: string;
  lang: LangFilter;
  /** ON にしたバリアントの value(順序保持) */
  selected: string[];
};

const VALID_LANGS: ReadonlySet<string> = new Set([
  "all",
  "multi",
  "en",
  "fr",
  "de",
  "es",
  "it",
  "zh",
  "ko",
  "ja",
]);

/** 常に新しいインスタンスを返す空状態(呼び出し側で破壊的変更されても汚染しない)。 */
export function emptyState(): SearchState {
  return { seiKana: "", meiKana: "", titleKana: "", lang: "all", selected: [] };
}

/**
 * 状態をハッシュ文字列に符号化する(TC-041)。既定値(空文字・lang="all"・selected 空)は省略し、
 * 空状態は空文字列になる。キーは s/m/t/l/v(v は selected を順序保持で反復)。
 */
export function encodeState(state: SearchState): string {
  const params = new URLSearchParams();
  if (state.seiKana !== "") params.set("s", state.seiKana);
  if (state.meiKana !== "") params.set("m", state.meiKana);
  if (state.titleKana !== "") params.set("t", state.titleKana);
  if (state.lang !== "all") params.set("l", state.lang);
  for (const v of state.selected) params.append("v", v);
  return params.toString();
}

/**
 * ハッシュ文字列を状態へ復号する(TC-041/042)。不正・空・未知言語は安全側にフォールバックし、
 * 例外を投げない(不正ハッシュでも空状態で起動できる)。
 */
export function decodeState(hash: string): SearchState {
  const state = emptyState();
  try {
    const params = new URLSearchParams(hash);
    state.seiKana = params.get("s") ?? "";
    state.meiKana = params.get("m") ?? "";
    state.titleKana = params.get("t") ?? "";
    const lang = params.get("l");
    state.lang = lang !== null && VALID_LANGS.has(lang) ? (lang as LangFilter) : "all";
    state.selected = params.getAll("v");
  } catch {
    return emptyState();
  }
  return state;
}
