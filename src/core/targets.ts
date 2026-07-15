// 検索ターゲットマスタ・鮮度判定(REQ-003)。
// マスタは静的定数(データ)。URL 生成ロジックは urlBuild.ts に分離する。
// core 純度: DOM・fetch に触れない。鮮度判定は today を注入して Date.now() に依存しない(AGENTS 5章)。

/** クエリのエンコード方式。plus 系は空白を + にする(urlBuild.ts 参照)。 */
export type QueryEncoding = "percent" | "plus";

/** 対応言語タグ。multi は横断 DB(言語フィルタで常時表示、REQ-005)。 */
export type TargetLang = "en" | "fr" | "de" | "es" | "it" | "zh" | "ko" | "ja" | "multi";

export type SearchTarget = {
  id: string;
  name: string;
  /** 対応言語(REQ-005 のフィルタで使用) */
  langs: readonly TargetLang[];
  /** "{q}" を含む https URL テンプレート */
  urlTemplate: string;
  encoding: QueryEncoding;
  /** 最終確認日(YYYY-MM-DD)。365 日超で「リンク要確認」表示(TC-024) */
  verifiedAt: string;
};

/**
 * 検索ターゲットマスタ(12 件)。
 * NOTE(Blocker): URL テンプレートは各サイトの検索仕様に基づく仮投入。人間の実ブラウザ確認後に
 * 差し替え・verifiedAt 更新を行う(STATE.md Blockers / Decisions 参照)。構造・エンコード方式は確定。
 */
export const TARGETS: readonly SearchTarget[] = [
  {
    id: "wikidata",
    name: "Wikidata",
    langs: ["multi"],
    urlTemplate: "https://www.wikidata.org/w/index.php?search={q}&title=Special:Search",
    encoding: "plus",
    verifiedAt: "2026-07-15",
  },
  {
    id: "openlibrary",
    name: "Open Library",
    langs: ["multi"],
    urlTemplate: "https://openlibrary.org/search?q={q}",
    encoding: "plus",
    verifiedAt: "2026-07-15",
  },
  {
    id: "worldcat",
    name: "WorldCat",
    langs: ["multi"],
    urlTemplate: "https://search.worldcat.org/search?q={q}",
    encoding: "plus",
    verifiedAt: "2026-07-15",
  },
  {
    id: "archive",
    name: "Internet Archive",
    langs: ["multi"],
    urlTemplate: "https://archive.org/search?query={q}",
    encoding: "plus",
    verifiedAt: "2026-07-15",
  },
  {
    id: "ndl",
    name: "国立国会図書館サーチ",
    langs: ["ja"],
    urlTemplate: "https://ndlsearch.ndl.go.jp/search?cs=bib&keyword={q}",
    encoding: "percent",
    verifiedAt: "2026-07-15",
  },
  {
    id: "jpf-jltrans",
    name: "国際交流基金 日本文学翻訳作品データベース",
    langs: ["multi"],
    urlTemplate:
      "https://www.jpf.go.jp/JF_Contents/InformationSearchService?ContentNo=13&SearchWord={q}",
    encoding: "percent",
    verifiedAt: "2026-07-15",
  },
  {
    id: "googlebooks",
    name: "Google Books",
    langs: ["multi"],
    urlTemplate: "https://www.google.com/search?tbm=bks&q={q}",
    encoding: "plus",
    verifiedAt: "2026-07-15",
  },
  {
    id: "dnb",
    name: "Deutsche Nationalbibliothek",
    langs: ["de"],
    urlTemplate: "https://portal.dnb.de/opac/simpleSearch?query={q}",
    encoding: "plus",
    verifiedAt: "2026-07-15",
  },
  {
    id: "bnf",
    name: "Bibliothèque nationale de France (Data BnF)",
    langs: ["fr"],
    urlTemplate: "https://data.bnf.fr/fr/search?term={q}",
    encoding: "plus",
    verifiedAt: "2026-07-15",
  },
  {
    id: "amazon-com",
    name: "Amazon.com(米)",
    langs: ["en"],
    urlTemplate: "https://www.amazon.com/s?k={q}&i=stripbooks",
    encoding: "plus",
    verifiedAt: "2026-07-15",
  },
  {
    id: "amazon-co-uk",
    name: "Amazon.co.uk(英)",
    langs: ["en"],
    urlTemplate: "https://www.amazon.co.uk/s?k={q}&i=stripbooks",
    encoding: "plus",
    verifiedAt: "2026-07-15",
  },
  {
    id: "amazon-fr",
    name: "Amazon.fr(仏)",
    langs: ["fr"],
    urlTemplate: "https://www.amazon.fr/s?k={q}&i=stripbooks",
    encoding: "plus",
    verifiedAt: "2026-07-15",
  },
];

export type TargetValidationError = {
  id: string;
  reason: "not-https" | "missing-placeholder";
};

/**
 * マスタの静的検証(TC-021)。urlTemplate が https かつ "{q}" を含むことを保証する。
 * ビルド時に呼び、非空配列が返れば失敗させる想定(AGENTS: ビルド時エラー)。
 */
export function validateTargets(
  targets: readonly Pick<SearchTarget, "id" | "urlTemplate">[],
): TargetValidationError[] {
  const errors: TargetValidationError[] = [];
  for (const t of targets) {
    if (!t.urlTemplate.startsWith("https://")) {
      errors.push({ id: t.id, reason: "not-https" });
    }
    if (!t.urlTemplate.includes("{q}")) {
      errors.push({ id: t.id, reason: "missing-placeholder" });
    }
  }
  return errors;
}

/** 言語フィルタの選択値。"all" は絞り込みなし(全件)。 */
export type LangFilter = TargetLang | "all";

/**
 * 対象言語でターゲットを絞る(TC-031、REQ-005)。
 * "all" は全件。それ以外は「その言語に対応」または「multi(横断DB)」を残す(multi は常時表示)。
 * 決定的・順序保存。
 */
export function filterTargetsByLang(
  targets: readonly SearchTarget[],
  lang: LangFilter,
): SearchTarget[] {
  if (lang === "all") return [...targets];
  return targets.filter((t) => t.langs.includes(lang) || t.langs.includes("multi"));
}

const FRESH_DAYS = 365;
const MS_PER_DAY = 86_400_000;

/**
 * 鮮度判定(TC-024)。verifiedAt から today までが 365 日を超えたら要確認(stale)。
 * today は注入(core は Date.now() に触れない)。verifiedAt は UTC 深夜として解釈する。
 */
export function isStale(target: Pick<SearchTarget, "verifiedAt">, today: Date): boolean {
  const verified = new Date(`${target.verifiedAt}T00:00:00Z`);
  const elapsedDays = (today.getTime() - verified.getTime()) / MS_PER_DAY;
  return elapsedDays > FRESH_DAYS;
}
