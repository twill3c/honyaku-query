// UI 文言(REQ-004 / NFR-005)。表示文字列を一箇所に集約する。

/** NFR-005: 機械的近似である旨の免責。常時表示する。 */
export const DISCLAIMER =
  "ヘボン式変換・バリアントは機械的な近似であり、著者の公式ローマ字表記と異なる場合があります。";

export const TITLE = "honyaku-query — 翻訳探索クエリビルダー";

export const LEAD =
  "著者名・作品名の「読み(かな)」を入力すると、ヘボン式ローマ字のバリアントと書誌データベース・書店への検索リンクを一括生成します(リンクアウトのみ・外部送信なし)。";

export const LABELS = {
  sei: "姓の読み(かな)",
  mei: "名の読み(かな)",
  title: "作品名の読み(かな)",
  lang: "対象言語で絞り込み",
  copy: "選択中の表記を一括コピー",
  copied: "コピーしました",
} as const;

/** 言語フィルタの選択肢(value は core の LangFilter に一致)。REQ-005。 */
export const LANG_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "all", label: "すべての言語" },
  { value: "multi", label: "横断DB(multi)" },
  { value: "en", label: "英語" },
  { value: "fr", label: "フランス語" },
  { value: "de", label: "ドイツ語" },
  { value: "es", label: "スペイン語" },
  { value: "it", label: "イタリア語" },
  { value: "zh", label: "中国語" },
  { value: "ko", label: "韓国語" },
  { value: "ja", label: "日本語" },
];
