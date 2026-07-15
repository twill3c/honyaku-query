// URL ハッシュ副作用アダプタ(REQ-006)。location.hash の読み書きを codec 経由で行う。
// adapters 規約(GUIDE 4章): 例外は握り潰して null / no-op。core(codec)は純粋のまま。

import { type SearchState, decodeState, emptyState, encodeState } from "../core/codec";

/** 現在の location.hash から状態を読む。読めなければ空状態。 */
export function readStateFromHash(): SearchState {
  try {
    const raw = window.location.hash.replace(/^#/, "");
    return decodeState(raw);
  } catch {
    return emptyState();
  }
}

/**
 * 状態を location.hash に書き戻す(履歴を汚さないよう replaceState)。
 * 空状態のときはハッシュを除去する。失敗しても no-op。
 */
export function writeStateToHash(state: SearchState): void {
  try {
    const encoded = encodeState(state);
    const { pathname, search } = window.location;
    const url = encoded === "" ? `${pathname}${search}` : `${pathname}${search}#${encoded}`;
    window.history.replaceState(null, "", url);
  } catch {
    // no-op(history/location 不可環境でも機能低下のみ)
  }
}
