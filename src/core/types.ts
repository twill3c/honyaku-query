// core 共通型。core は例外を投げず Result で返す(AGENTS 5章)。

export type HepburnError = {
  code: "unconvertible";
  /** 入力文字列(NFC)内の位置 */
  index: number;
  /** 変換できなかった文字 */
  char: string;
};

export type Result<T, E = HepburnError> = { ok: true; value: T } | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
