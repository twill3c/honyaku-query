// 検索 URL 生成(REQ-003)。クエリ文字列のエンコードとテンプレート置換のみを担う純粋関数。
// 共有対象(NFR-004)ではないが core 純度を保つ: DOM・Date・fetch に触れない。
// エンコードはダイアクリティカルマーク(ō 等)・アポストロフィを RFC 3986 準拠で符号化する(TC-022/023)。

import type { QueryEncoding, SearchTarget } from "./targets";

/**
 * RFC 3986 準拠のパーセントエンコード。
 * encodeURIComponent は非予約でない `! ' ( ) *` を素通しするため、追加で符号化する。
 * 例: "jun'ichirō" → "jun%27ichir%C5%8D"(TC-023)。
 */
function encodeRfc3986(s: string): string {
  return encodeURIComponent(s).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

/**
 * クエリ文字列を方式に応じてエンコードする(TC-022/023)。
 * - percent: 空白は %20(RFC 3986)
 * - plus: 空白は +(application/x-www-form-urlencoded 系サイト向け)
 */
export function encodeQuery(q: string, encoding: QueryEncoding): string {
  const encoded = encodeRfc3986(q);
  return encoding === "plus" ? encoded.replace(/%20/g, "+") : encoded;
}

/** テンプレートの "{q}" をエンコード済みクエリで置換して URL を生成する。 */
export function buildUrl(
  target: Pick<SearchTarget, "urlTemplate" | "encoding">,
  q: string,
): string {
  return target.urlTemplate.replace("{q}", encodeQuery(q, target.encoding));
}
