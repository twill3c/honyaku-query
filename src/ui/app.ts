// UI コントローラ(REQ-004)。DOM と状態を持ち、core/query と render を呼ぶだけ(ロジックは持たない)。
// today は本レイヤで生成し core に注入する(core は Date.now() に触れない)。

import { buildCopyString, buildLinks, buildVariants, defaultSelectedValues } from "../core/query";
import { TARGETS } from "../core/targets";
import type { Variant } from "../core/variants";
import { DISCLAIMER, LABELS, LEAD, TITLE } from "./messages";
import { renderErrors, renderLinks, renderVariantList } from "./render";

const SHELL = `
  <header>
    <h1>${TITLE}</h1>
    <p class="lead">${LEAD}</p>
  </header>
  <form id="q" autocomplete="off">
    <label>${LABELS.sei}<input id="sei" type="text" inputmode="kana" /></label>
    <label>${LABELS.mei}<input id="mei" type="text" inputmode="kana" /></label>
    <label>${LABELS.title}<input id="title" type="text" inputmode="kana" /></label>
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
  const errorsEl = $("errors");
  const variantsEl = $("variants");
  const linksEl = $("links");
  const copiedEl = $("copied");

  let allVariants: Variant[] = [];
  let selected = new Set<string>();
  const today = new Date();

  const selectedVariants = (): Variant[] => allVariants.filter((v) => selected.has(v.value));

  const renderLinksPane = (): void => {
    linksEl.innerHTML = renderLinks(buildLinks(selectedVariants(), TARGETS, today));
  };

  const recompute = (): void => {
    const res = buildVariants({
      seiKana: seiEl.value,
      meiKana: meiEl.value,
      titleKana: titleEl.value,
    });
    allVariants = [...res.nameVariants, ...res.titleVariants];
    selected = defaultSelectedValues(allVariants);

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
    el.addEventListener("input", recompute);
  }

  variantsEl.addEventListener("change", (e) => {
    const target = e.target as HTMLElement;
    if (!(target instanceof HTMLInputElement) || target.type !== "checkbox") return;
    const value = target.dataset.value;
    if (value === undefined) return;
    if (target.checked) selected.add(value);
    else selected.delete(value);
    copiedEl.textContent = "";
    renderLinksPane();
  });

  $<HTMLButtonElement>("copy").addEventListener("click", () => {
    const text = buildCopyString(selectedVariants());
    void navigator.clipboard?.writeText(text).then(() => {
      copiedEl.textContent = LABELS.copied;
    });
  });

  recompute();
}
