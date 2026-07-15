// localStorage 副作用アダプタ(REQ-007)。最近の検索の永続化。
// adapters 規約(GUIDE 4章): 例外は握り潰して []/no-op。storage 不可・破損・quota でも機能低下のみ。

import type { RecentEntry } from "../core/recent";

const KEY = "honyaku-query:recent";

/** localStorage を安全に取得する(アクセス自体が例外になる環境がある)。 */
function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** 保存済みの最近の検索を読む。未保存・破損・非配列・不可環境は []。 */
export function loadRecent(): RecentEntry[] {
  const s = storage();
  if (s === null) return [];
  try {
    const raw = s.getItem(KEY);
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RecentEntry[]) : [];
  } catch {
    return [];
  }
}

/** 最近の検索を保存する。不可環境・quota 超過でも no-op(例外を投げない)。 */
export function saveRecent(list: readonly RecentEntry[]): void {
  const s = storage();
  if (s === null) return;
  try {
    s.setItem(KEY, JSON.stringify(list));
  } catch {
    // quota 等は握り潰す(機能低下のみ)
  }
}
