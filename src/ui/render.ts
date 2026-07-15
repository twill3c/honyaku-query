// 純粋なビュー生成(REQ-004)。view-model(core/query)の結果を HTML 文字列にする。
// DOM・状態は持たない(app.ts の責務)。ユーザ入力は必ず escapeHtml を通す(TC-029: XSS 防止)。

import type { FieldError, VariantLinks } from "../core/query";
import type { RecentEntry } from "../core/recent";
import type { Variant } from "../core/variants";

/** HTML 特殊文字を実体参照化する。属性値・テキスト両方で安全な最小集合。 */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** バリアント一覧(ON/OFF チェックボックス付き)。selected に含まれる value は checked。 */
export function renderVariantList(
  variants: readonly Variant[],
  selected: ReadonlySet<string>,
): string {
  if (variants.length === 0) return "";
  const items = variants
    .map((v) => {
      const checked = selected.has(v.value) ? " checked" : "";
      const tags =
        v.ruleTags.length > 0
          ? `<span class="tags">${escapeHtml(v.ruleTags.join(" "))}</span>`
          : "";
      const val = escapeHtml(v.value);
      return `<li><label><input type="checkbox" data-value="${val}"${checked} /> <span class="v">${val}</span> ${tags}</label></li>`;
    })
    .join("");
  return `<ul class="variants">${items}</ul>`;
}

/** 選択中バリアント × ターゲットのリンク集。stale は「要確認」バッジを付ける。 */
export function renderLinks(rows: readonly VariantLinks[]): string {
  if (rows.length === 0) return `<p class="empty">バリアントを 1 件以上選択してください。</p>`;
  return rows
    .map((row) => {
      const links = row.links
        .map((l) => {
          const badge = l.stale
            ? ` <span class="stale" title="verified_at が古い">要確認</span>`
            : "";
          return `<li><a href="${escapeHtml(l.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(l.targetName)}</a>${badge}</li>`;
        })
        .join("");
      return `<section class="link-group"><h3>${escapeHtml(row.variant.value)}</h3><ul class="links">${links}</ul></section>`;
    })
    .join("");
}

/** 最近の検索エントリの表示ラベル(読み3項を空白連結 + all 以外は言語を付す)。 */
export function recentLabel(e: RecentEntry): string {
  const parts = [e.seiKana, e.meiKana, e.titleKana].filter((s) => s !== "");
  const base = parts.join(" ");
  return e.lang === "all" ? base : `${base} [${e.lang}]`;
}

/** 最近の検索一覧(クリックで再実行するボタン列)。data-index で app が復元する。 */
export function renderRecent(entries: readonly RecentEntry[]): string {
  if (entries.length === 0) return `<p class="empty">最近の検索はまだありません。</p>`;
  const items = entries
    .map(
      (e, i) =>
        `<li><button type="button" class="recent" data-index="${i}">${escapeHtml(recentLabel(e))}</button></li>`,
    )
    .join("");
  return `<ul class="recents">${items}</ul>`;
}

/** 変換不能エラー(該当フィールドと位置)を表示する。 */
export function renderErrors(errors: readonly FieldError[]): string {
  if (errors.length === 0) return "";
  const label: Record<string, string> = { sei: "姓", mei: "名", title: "作品名" };
  const items = errors
    .map(
      (e) =>
        `<li>${escapeHtml(label[e.field] ?? e.field)}: 「${escapeHtml(e.error.char)}」(位置 ${e.error.index})は変換できません。かなで入力してください。</li>`,
    )
    .join("");
  return `<ul class="errors" role="alert">${items}</ul>`;
}
