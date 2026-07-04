// かな → ヘボン式ローマ字変換(REQ-001)。
// 実装は3段構成(IMPLEMENTATION_GUIDE 3章): (1) トークナイズ(拗音2文字を最長一致で優先)
// (2) 表引き (3) 後処理(促音・撥音・長音 — 第2・3弾で実装)。
// 本モジュールは共有対象(NFR-004): types.ts 以外を import しない。純粋関数のみ。

import { type Result, err, ok } from "./types";

/**
 * 変換表(データ)。規則(促音・撥音・長音)はロジック側に置き、表は音節のみを持つ。
 * 表は「かな(ひらがな正規形)→ ローマ字音節」。カタカナは入力境界でひらがなへ正規化する。
 * っ / ん / ー は音節でないため表に載せない(後処理の担当。第1弾では unconvertible)。
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

/** 音節トークン。index は元入力内の位置(エラー報告・後処理の位置参照用)。 */
type Syllable = { romaji: string; index: number };

/**
 * かな文字列をヘボン式ローマ字に変換する。
 * - ひらがな/カタカナは同一結果(TC-001)
 * - 拗音は2文字最長一致(TC-002)
 * - 表にない文字は位置付き unconvertible(TC-008)。っ/ん/ー は第2・3弾で後処理対応
 */
export function toHepburn(kana: string): Result<string> {
  const src = kataToHira(kana.normalize("NFC"));
  const syllables: Syllable[] = [];
  let i = 0;
  while (i < src.length) {
    const two = src.slice(i, i + 2);
    if (two.length === 2 && SYLLABLES[two] !== undefined) {
      syllables.push({ romaji: SYLLABLES[two], index: i });
      i += 2;
      continue;
    }
    const one = src.charAt(i);
    const hit = SYLLABLES[one];
    if (hit !== undefined) {
      syllables.push({ romaji: hit, index: i });
      i += 1;
      continue;
    }
    return err({ code: "unconvertible", index: i, char: kana.charAt(i) });
  }
  return ok(syllables.map((s) => s.romaji).join(""));
}
