// UI コントローラ(REQ-004)。DOM と状態を持ち、core/query と render を呼ぶだけ(ロジックは持たない)。
// today は本レイヤで生成し core に注入する(core は Date.now() に触れない)。

import { readStateFromHash, writeStateToHash } from "../adapters/urlHash";
import type { SearchState } from "../core/codec";
import { buildCopyString, buildLinks, buildVariants, defaultSelectedValues } from "../core/query";
import { type LangFilter, TARGETS, filterTargetsByLang } from "../core/targets";
import type { Variant } from "../core/variants";
import { DISCLAIMER, LABELS, LANG_OPTIONS, LEAD, TITLE } from "./messages";
import { renderErrors, renderLinks, renderVariantList } from "./render";

const langOptionsHtml = LANG_OPTIONS.map(
  (o) => `<option value="${o.value}">${o.label}</option>`,
).join("");

const SHELL = `
  <header>
    <h1>${TITLE}</h1>
    <p class="lead">${LEAD}</p>
  </header>
  <form id="q" autocomplete="off">
    <label>${LABELS.sei}<input id="sei" type="text" inputmode="kana" /></label>
    <label>${LABELS.mei}<input id="mei" type="text" inputmode="kana" /></label>
    <label>${LABELS.title}<input id="title" type="text" inputmode="kana" /></label>
    <label>${LABELS.lang}<select id="lang">${langOptionsHtml}</select></label>
  </form>
  <p class="disclaimer" role="note">${DISCLAIMER}</p>
  <div id="errors"></div>
  <div class="cols">
    <div class="col">
      <h2>バリアント</h2>
      <div id="variants"></div>
    </div>
    <div class="col">
      <h2>検索リンク</h2>
      <div class="copybar">
        <button id="copy" type="button">${LABELS.copy}</button>
        <span id="copied" aria-live="polite"></span>
      </div>
      <div id="links"></div>
    </div>
  </div>
`;

/** アプリを root にマウントし、イベントを配線する。 */
export function mountApp(root: HTMLElement): void {
  root.innerHTML = SHELL;

  const $ = <T extends HTMLElement>(id: string): T => root.querySelector(`#${id}`) as T;
  const seiEl = $<HTMLInputElement>("sei");
  const meiEl = $<HTMLInputElement>("mei");
  const titleEl = $<HTMLInputElement>("title");
  const langEl = $<HTMLSelectElement>("lang");
  const errorsEl = $("errors");
  const variantsEl = $("variants");
  const linksEl = $("links");
  const copiedEl = $("copied");

  let allVariants: Variant[] = [];
  let selected = new Set<string>();
  const today = new Date();

  const selectedVariants = (): Variant[] => allVariants.filter((v) => selected.has(v.value));

  const currentState = (): SearchState => ({
    seiKana: seiEl.value,
    meiKana: meiEl.value,
    titleKana: titleEl.value,
    lang: langEl.value as LangFilter,
    selected: selectedVariants().map((v) => v.value),
  });

  const persist = (): void => writeStateToHash(currentState());

  const renderLinksPane = (): void => {
    const targets = filterTargetsByLang(TARGETS, langEl.value as LangFilter);
    linksEl.innerHTML = renderLinks(buildLinks(selectedVariants(), targets, today));
  };

  /** バリアントを再計算して描画する。override 指定時はその選択を(現存する value のみ)復元する。 */
  const recompute = (override?: readonly string[]): void => {
    const res = buildVariants({
      seiKana: seiEl.value,
      meiKana: meiEl.value,
      titleKana: titleEl.value,
    });
    allVariants = [...res.nameVariants, ...res.titleVariants];
    if (override === undefined) {
      selected = defaultSelectedValues(allVariants);
    } else {
      const available = new Set(allVariants.map((v) => v.value));
      selected = new Set(override.filter((v) => available.has(v)));
    }

    errorsEl.innerHTML = renderErrors(res.errors);
    const nameHtml = renderVariantList(res.nameVariants, selected);
    const titleHtml = res.titleVariants.length
      ? `<h3 class="grp">作品名</h3>${renderVariantList(res.titleVariants, selected)}`
      : "";
    variantsEl.innerHTML = nameHtml + titleHtml || `<p class="empty">読みを入力してください。</p>`;
    copiedEl.textContent = "";
    renderLinksPane();
  };

  for (const el of [seiEl, meiEl, titleEl]) {
    el.addEventListener("input", () => {
      recompute();
      persist();
    });
  }

  // 言語フィルタはバリアント選択に影響しないためリンクのみ再描画する
  langEl.addEventListener("change", () => {
    copiedEl.textContent = "";
    renderLinksPane();
    persist();
  });

  variantsEl.addEventListener("change", (e) => {
    const target = e.target as HTMLElement;
    if (!(target instanceof HTMLInputElement) || target.type !== "checkbox") return;
    const value = target.dataset.value;
    if (value === undefined) return;
    if (target.checked) selected.add(value);
    else selected.delete(value);
    copiedEl.textContent = "";
    renderLinksPane();
    persist();
  });

  $<HTMLButtonElement>("copy").addEventListener("click", () => {
    const text = buildCopyString(selectedVariants());
    void navigator.clipboard?.writeText(text).then(() => {
      copiedEl.textContent = LABELS.copied;
    });
  });

  // 起動時に URL ハッシュから復元(REQ-006 / REQ-005 の URL 同期)
  const initial = readStateFromHash();
  seiEl.value = initial.seiKana;
  meiEl.value = initial.meiKana;
  titleEl.value = initial.titleKana;
  langEl.value = initial.lang;
  recompute(initial.selected.length > 0 ? initial.selected : undefined);
}
