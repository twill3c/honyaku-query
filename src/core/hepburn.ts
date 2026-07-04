// かな → ヘボン式ローマ字変換(REQ-001)。
// 実装は3段構成(IMPLEMENTATION_GUIDE 3章): (1) トークナイズ(拗音2文字を最長一致で優先)
// (2) 表引き (3) 後処理(促音・撥音・長音)。
// 本モジュールは共有対象(NFR-004): types.ts 以外を import しない。純粋関数のみ。

import { type Result, err, ok } from "./types";

/**
 * 変換表(データ)。規則(促音・撥音・長音)はロジック側に置き、表は音節のみを持つ。
 * 表は「かな(ひらがな正規形)→ ローマ字音節」。カタカナは入力境界でひらがなへ正規化する。
 * っ / ん / ー は音節でないため表に載せない(すべて後処理の担当)。
 */
const SYLLABLES: Record<string, string> = {
  // 基本
  あ: "a",
  い: "i",
  う: "u",
  え: "e",
  お: "o",
  か: "ka",
  き: "ki",
  く: "ku",
  け: "ke",
  こ: "ko",
  さ: "sa",
  し: "shi",
  す: "su",
  せ: "se",
  そ: "so",
  た: "ta",
  ち: "chi",
  つ: "tsu",
  て: "te",
  と: "to",
  な: "na",
  に: "ni",
  ぬ: "nu",
  ね: "ne",
  の: "no",
  は: "ha",
  ひ: "hi",
  ふ: "fu",
  へ: "he",
  ほ: "ho",
  ま: "ma",
  み: "mi",
  む: "mu",
  め: "me",
  も: "mo",
  や: "ya",
  ゆ: "yu",
  よ: "yo",
  ら: "ra",
  り: "ri",
  る: "ru",
  れ: "re",
  ろ: "ro",
  わ: "wa",
  を: "o", // ヘボン式: 助詞・語中とも o
  // 濁音・半濁音
  が: "ga",
  ぎ: "gi",
  ぐ: "gu",
  げ: "ge",
  ご: "go",
  ざ: "za",
  じ: "ji",
  ず: "zu",
  ぜ: "ze",
  ぞ: "zo",
  だ: "da",
  ぢ: "ji",
  づ: "zu",
  で: "de",
  ど: "do",
  ば: "ba",
  び: "bi",
  ぶ: "bu",
  べ: "be",
  ぼ: "bo",
  ぱ: "pa",
  ぴ: "pi",
  ぷ: "pu",
  ぺ: "pe",
  ぽ: "po",
  // 拗音(2文字 — トークナイズで最長一致優先)
  きゃ: "kya",
  きゅ: "kyu",
  きょ: "kyo",
  しゃ: "sha",
  しゅ: "shu",
  しょ: "sho",
  ちゃ: "cha",
  ちゅ: "chu",
  ちょ: "cho",
  にゃ: "nya",
  にゅ: "nyu",
  にょ: "nyo",
  ひゃ: "hya",
  ひゅ: "hyu",
  ひょ: "hyo",
  みゃ: "mya",
  みゅ: "myu",
  みょ: "myo",
  りゃ: "rya",
  りゅ: "ryu",
  りょ: "ryo",
  ぎゃ: "gya",
  ぎゅ: "gyu",
  ぎょ: "gyo",
  じゃ: "ja",
  じゅ: "ju",
  じょ: "jo",
  びゃ: "bya",
  びゅ: "byu",
  びょ: "byo",
  ぴゃ: "pya",
  ぴゅ: "pyu",
  ぴょ: "pyo",
};

/** カタカナ(ァ..ヶ)をひらがなへ正規化。長音符「ー」はそのまま通す(後処理の担当)。 */
const kataToHira = (s: string): string =>
  s.replace(/[\u30a1-\u30f6]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));

/** トークン。音節のほか、後処理対象(促音・撥音)を区別する。index は元入力内の位置。 */
type Token =
  | { kind: "syllable"; romaji: string; index: number }
  | { kind: "sokuon"; index: number }
  | { kind: "hatsuon"; index: number }
  | { kind: "choonpu"; index: number };

const VOWELS = new Set(["a", "i", "u", "e", "o"]);
const MACRON: Record<string, string> = {
  a: "\u0101",
  i: "\u012b",
  u: "\u016b",
  e: "\u0113",
  o: "\u014d",
};

/** 直前パート末尾の母音をマクロン化して置換する。母音で終わらなければ null。 */
function macronizeLast(parts: string[]): boolean {
  const last = parts[parts.length - 1];
  if (last === undefined || last.length === 0) return false;
  const tail = last.charAt(last.length - 1);
  const m = MACRON[tail];
  if (m === undefined) return false;
  parts[parts.length - 1] = last.slice(0, -1) + m;
  return true;
}

/**
 * 後処理: 促音・撥音をローマ字列に解決する(規則はロジック、表はデータの原則)。
 * - 促音: 次音節の頭子音を重ねる。次が ch なら t(こっち→kotchi)。次が音節でなければ unconvertible
 * - 撥音: 次音節の頭が b/m/p なら m(伝統ヘボン式)、母音・y なら n'、それ以外・語末は n
 * - 長音: 直前音節が o で終わり次が単独 う/お → ō、u で終わり次が単独 う → ū(えい は非長音 — SPEC 3章)。
 *   長音符 ー は直前パート末尾の母音をマクロン化(母音がなければ unconvertible)
 */
function resolveTokens(tokens: Token[], original: string): Result<string> {
  const parts: string[] = [];
  for (let t = 0; t < tokens.length; t++) {
    const cur = tokens[t];
    if (cur === undefined) continue;
    if (cur.kind === "syllable") {
      // 長音融合: 単独母音 う(u)/お(o) が直前音節の末尾母音と結合する場合
      const prev = tokens[t - 1];
      const prevIsSyllable = prev !== undefined && prev.kind === "syllable";
      const lastPart = parts[parts.length - 1];
      const lastTail =
        prevIsSyllable && lastPart !== undefined && lastPart.length > 0
          ? lastPart.charAt(lastPart.length - 1)
          : null;
      if (
        (cur.romaji === "u" && (lastTail === "o" || lastTail === "u")) ||
        (cur.romaji === "o" && lastTail === "o")
      ) {
        macronizeLast(parts);
        continue;
      }
      parts.push(cur.romaji);
      continue;
    }
    if (cur.kind === "choonpu") {
      if (!macronizeLast(parts)) {
        return err({
          code: "unconvertible",
          index: cur.index,
          char: original.charAt(cur.index),
        });
      }
      continue;
    }
    const next = tokens[t + 1];
    const nextHead = next !== undefined && next.kind === "syllable" ? next.romaji.charAt(0) : null;
    if (cur.kind === "sokuon") {
      if (nextHead === null || VOWELS.has(nextHead)) {
        return err({
          code: "unconvertible",
          index: cur.index,
          char: original.charAt(cur.index),
        });
      }
      parts.push(nextHead === "c" ? "t" : nextHead);
      continue;
    }
    // hatsuon
    if (nextHead !== null && (nextHead === "b" || nextHead === "m" || nextHead === "p")) {
      parts.push("m");
    } else if (nextHead !== null && (VOWELS.has(nextHead) || nextHead === "y")) {
      parts.push("n'");
    } else {
      parts.push("n");
    }
  }
  return ok(parts.join(""));
}

/**
 * かな文字列をヘボン式ローマ字に変換する。
 * - ひらがな/カタカナは同一結果(TC-001)
 * - 拗音は2文字最長一致(TC-002)
 * - 表にない文字は位置付き unconvertible(TC-008)。っ/ん/ー は第2・3弾で後処理対応
 */
export function toHepburn(kana: string): Result<string> {
  const src = kataToHira(kana.normalize("NFC"));
  const tokens: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const two = src.slice(i, i + 2);
    if (two.length === 2 && SYLLABLES[two] !== undefined) {
      tokens.push({ kind: "syllable", romaji: SYLLABLES[two], index: i });
      i += 2;
      continue;
    }
    const one = src.charAt(i);
    if (one === "っ") {
      tokens.push({ kind: "sokuon", index: i });
      i += 1;
      continue;
    }
    if (one === "ん") {
      tokens.push({ kind: "hatsuon", index: i });
      i += 1;
      continue;
    }
    if (one === "ー") {
      tokens.push({ kind: "choonpu", index: i });
      i += 1;
      continue;
    }
    const hit = SYLLABLES[one];
    if (hit !== undefined) {
      tokens.push({ kind: "syllable", romaji: hit, index: i });
      i += 1;
      continue;
    }
    return err({ code: "unconvertible", index: i, char: kana.charAt(i) });
  }
  return resolveTokens(tokens, kana);
}
