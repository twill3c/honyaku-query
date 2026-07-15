// 検索クエリの組み立て(REQ-004 の view-model)。純粋関数のみ・決定的。
// 読み(かな)→ toHepburn → variants → リンク行列 / 既定選択 / コピー文字列 を core 内で完結させ、
// src/ui は本モジュールと render を呼ぶだけにする(AGENTS 5章: ui はロジックを持たない)。

import { toHepburn } from "./hepburn";
import { type SearchTarget, isStale } from "./targets";
import type { HepburnError } from "./types";
import { buildUrl } from "./urlBuild";
import { type ExpandResult, type Variant, expandName, expandTitle } from "./variants";

export type FieldName = "sei" | "mei" | "title";

export type FieldError = { field: FieldName; error: HepburnError };

export type QueryInput = {
  seiKana?: string;
  meiKana?: string;
  titleKana?: string;
};

export type BuildResult = {
  /** 姓名(または単独姓/名)から展開したバリアント */
  nameVariants: Variant[];
  /** 作品名から展開したバリアント(長音展開のみ) */
  titleVariants: Variant[];
  /** いずれかで上限 12 件超過の切り捨てが起きたか */
  truncated: boolean;
  /** 変換不能な読みのフィールドと位置 */
  errors: FieldError[];
};

const capitalize = (w: string): string =>
  w.length === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1);

const capitalizeResult = (r: ExpandResult): { variants: Variant[]; truncated: boolean } => ({
  variants: r.variants.map((v) => ({ ...v, value: capitalize(v.value) })),
  truncated: r.truncated,
});

/**
 * 読み(かな)を基本形に変換する。空文字は未入力扱い(null)。変換不能は errors に積む。
 */
function convert(field: FieldName, kana: string | undefined, errors: FieldError[]): string | null {
  if (kana === undefined || kana.trim() === "") return null;
  const r = toHepburn(kana);
  if (!r.ok) {
    errors.push({ field, error: r.error });
    return null;
  }
  return r.value;
}

/**
 * 入力読みからバリアント列を組み立てる(TC-025/028)。
 * - 姓+名 → 姓名順・イニシャル込み(expandName)
 * - 姓 xor 名 → 単独名として長音展開し先頭を大文字化(イニシャル形は作らない)
 * - 作品名 → 長音展開のみ(expandTitle)
 */
export function buildVariants(input: QueryInput): BuildResult {
  const errors: FieldError[] = [];
  const sei = convert("sei", input.seiKana, errors);
  const mei = convert("mei", input.meiKana, errors);
  const title = convert("title", input.titleKana, errors);

  let nameVariants: Variant[] = [];
  let nameTruncated = false;
  if (sei !== null && mei !== null) {
    const r = expandName({ sei, mei });
    nameVariants = r.variants;
    nameTruncated = r.truncated;
  } else if (sei !== null || mei !== null) {
    const single = (sei ?? mei) as string;
    const r = capitalizeResult(expandTitle(single));
    nameVariants = r.variants;
    nameTruncated = r.truncated;
  }

  let titleVariants: Variant[] = [];
  let titleTruncated = false;
  if (title !== null) {
    const r = expandTitle(title);
    titleVariants = r.variants;
    titleTruncated = r.truncated;
  }

  return {
    nameVariants,
    titleVariants,
    truncated: nameTruncated || titleTruncated,
    errors,
  };
}

/** 既定 ON の value 集合(優先度上位 n 件、既定 4)。variants は優先度順前提(TC-026)。 */
export function defaultSelectedValues(variants: readonly Variant[], n = 4): Set<string> {
  return new Set(variants.slice(0, n).map((v) => v.value));
}

export type LinkRow = {
  targetId: string;
  targetName: string;
  url: string;
  /** verifiedAt が 365 日超で「リンク要確認」(today 注入) */
  stale: boolean;
};

export type VariantLinks = {
  variant: Variant;
  links: LinkRow[];
};

/** variant × target のリンク行列を生成する(TC-027)。today は鮮度判定用に注入。 */
export function buildLinks(
  variants: readonly Variant[],
  targets: readonly SearchTarget[],
  today: Date,
): VariantLinks[] {
  return variants.map((variant) => ({
    variant,
    links: targets.map((t) => ({
      targetId: t.id,
      targetName: t.name,
      url: buildUrl(t, variant.value),
      stale: isStale(t, today),
    })),
  }));
}

/** 選択中バリアントの value を改行連結したコピー用文字列(TC-027)。 */
export function buildCopyString(variants: readonly Variant[]): string {
  return variants.map((v) => v.value).join("\n");
}
