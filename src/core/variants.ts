// 表記バリアント展開(REQ-002)。
// 共有対象モジュール(NFR-004): types.ts 以外を import しない。純粋関数のみ・決定的。
// バリアントは (値, 適用規則タグ, 優先度) を持ち、UI が「なぜこの表記が出たか」を表示できる(GUIDE 3章)。

export type Variant = {
  value: string;
  /** 適用規則のタグ列(例: "lv:plain", "order:eastern", "initial") */
  ruleTags: string[];
  /** 最終列内の優先度(0 が最優先)。決定的に採番される */
  priority: number;
};

export type ExpandResult = {
  variants: Variant[];
  /** 上限(12 件)超過で切り捨てが発生したか(SPEC REQ-002) */
  truncated: boolean;
};

const CAP = 12;

/** マクロン母音 → 展開候補。候補順がそのまま優先度(keep が最優先)。 */
const LV_OPTIONS: Record<string, { text: string; tag: string }[]> = {
  ō: [
    { text: "ō", tag: "lv:keep" },
    { text: "o", tag: "lv:plain" },
    { text: "ou", tag: "lv:ou" },
    // oh は語末のみ(expandWordLv 内で位置判定して付加)
  ],
  ū: [
    { text: "ū", tag: "lv:keep" },
    { text: "u", tag: "lv:plain" },
    { text: "uu", tag: "lv:uu" },
  ],
  ā: [
    { text: "ā", tag: "lv:keep" },
    { text: "a", tag: "lv:plain" },
  ],
  ī: [
    { text: "ī", tag: "lv:keep" },
    { text: "i", tag: "lv:plain" },
  ],
  ē: [
    { text: "ē", tag: "lv:keep" },
    { text: "e", tag: "lv:plain" },
  ],
};

type LvForm = { value: string; tags: string[]; weight: number };

/** 1語の長音バリアントを優先度順(weight 昇順・安定)で列挙する。語末 ō のみ oh 形を末尾候補に含める。 */
function expandWordLv(word: string): LvForm[] {
  // マクロン位置を列挙
  const positions: { index: number; options: { text: string; tag: string }[] }[] = [];
  for (let i = 0; i < word.length; i++) {
    const ch = word.charAt(i);
    const base = LV_OPTIONS[ch];
    if (base === undefined) continue;
    const options = [...base];
    if (ch === "ō" && i === word.length - 1) {
      options.push({ text: "oh", tag: "lv:oh" }); // 語末のみ(TC-012)
    }
    positions.push({ index: i, options });
  }
  if (positions.length === 0) return [{ value: word, tags: [], weight: 0 }];

  // 直積(位置ごとの候補index の和 = weight)。列挙順が weight 昇順の安定順になるよう再帰生成後にソート
  let forms: LvForm[] = [{ value: "", tags: [], weight: 0 }];
  let cursor = 0;
  for (const pos of positions) {
    const prefixLen = pos.index - cursor;
    const next: LvForm[] = [];
    for (const f of forms) {
      const prefix = word.slice(cursor, cursor + prefixLen);
      for (let oi = 0; oi < pos.options.length; oi++) {
        const opt = pos.options[oi];
        if (opt === undefined) continue;
        next.push({
          value: f.value + prefix + opt.text,
          tags: opt.tag === "lv:keep" ? f.tags : [...f.tags, opt.tag],
          weight: f.weight + oi,
        });
      }
    }
    forms = next;
    cursor = pos.index + 1;
  }
  const tail = word.slice(cursor);
  for (const f of forms) f.value += tail;
  // 安定ソート(weight 昇順)。生成順が第2キーとして保存される(Array.prototype.sort は安定)
  forms.sort((a, b) => a.weight - b.weight);
  return forms;
}

/** 公開 API: 1語の長音展開(小文字のまま)。TC-011 / TC-012。 */
export function expandLongVowel(word: string): Variant[] {
  return expandWordLv(word).map((f, i) => ({
    value: f.value,
    ruleTags: f.tags,
    priority: i,
  }));
}

const capitalize = (w: string): string =>
  w.length === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1);

/**
 * 姓名のバリアント展開(TC-013〜015)。
 * 優先度: 姓名順メジャー(西洋順 → 和順)× 長音マイナー(姓 weight + 名 weight の昇順)、
 * イニシャル形(名頭文字 + 姓)は末尾。上限 12・重複除去・決定的。
 */
export function expandName(input: { sei: string; mei: string }): ExpandResult {
  const seiForms = expandWordLv(input.sei);
  const meiForms = expandWordLv(input.mei);

  type Cand = { value: string; tags: string[]; weight: number };
  const combos: { sei: LvForm; mei: LvForm; weight: number }[] = [];
  for (const s of seiForms) {
    for (const m of meiForms) {
      combos.push({ sei: s, mei: m, weight: s.weight + m.weight });
    }
  }
  combos.sort((a, b) => a.weight - b.weight);

  const cands: Cand[] = [];
  for (const order of ["western", "eastern"] as const) {
    for (const c of combos) {
      const sei = capitalize(c.sei.value);
      const mei = capitalize(c.mei.value);
      cands.push({
        value: order === "western" ? `${mei} ${sei}` : `${sei} ${mei}`,
        tags: [`order:${order}`, ...c.sei.tags, ...c.mei.tags],
        weight: c.weight,
      });
    }
  }
  // イニシャル形は末尾(姓の長音バリアントのみ展開。名は頭文字)
  const initialChar = capitalize(input.mei).charAt(0);
  for (const s of seiForms) {
    cands.push({
      value: `${initialChar}. ${capitalize(s.value)}`,
      tags: ["initial", ...s.tags],
      weight: s.weight,
    });
  }

  const seen = new Set<string>();
  const variants: Variant[] = [];
  let truncated = false;
  for (const c of cands) {
    if (seen.has(c.value)) continue;
    seen.add(c.value);
    if (variants.length >= CAP) {
      truncated = true;
      break;
    }
    variants.push({ value: c.value, ruleTags: c.tags, priority: variants.length });
  }
  return { variants, truncated };
}

/** 作品名モード(TC-016): 長音展開のみ。姓名順・イニシャル・大文字化を適用しない。 */
export function expandTitle(title: string): ExpandResult {
  const forms = expandWordLv(title);
  const variants: Variant[] = [];
  let truncated = false;
  for (const f of forms) {
    if (variants.length >= CAP) {
      truncated = true;
      break;
    }
    variants.push({ value: f.value, ruleTags: f.tags, priority: variants.length });
  }
  return { variants, truncated };
}
