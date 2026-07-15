// @vitest-environment jsdom
// REQ-004 UI 結線の統合スモーク(mountApp)。純粋ロジックは query/render 側で検証済み。
// ここでは DOM 反映・入力・トグル・空状態を end-to-end で確認する。
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mountApp } from "../../src/ui/app";

const setInput = (root: HTMLElement, id: string, value: string): void => {
  const el = root.querySelector<HTMLInputElement>(`#${id}`);
  if (!el) throw new Error(`#${id} not found`);
  el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
};

describe("REQ-004 mountApp 統合スモーク", () => {
  let root: HTMLElement;
  beforeEach(() => {
    window.history.replaceState(null, "", "/"); // ハッシュ汚染を防ぐ
    root = document.createElement("div");
    document.body.append(root);
    mountApp(root);
  });
  afterEach(() => {
    root.remove();
    document.body.innerHTML = "";
    window.history.replaceState(null, "", "/");
  });

  it("免責(NFR-005)を常時表示する", () => {
    expect(root.querySelector(".disclaimer")?.textContent).toContain("機械的な近似");
  });

  it("姓名入力でバリアントと既定4件ONのリンクが出る", () => {
    setInput(root, "sei", "なつめ");
    setInput(root, "mei", "そうせき");
    const checks = root.querySelectorAll<HTMLInputElement>('#variants input[type="checkbox"]');
    expect(checks.length).toBeGreaterThan(0);
    expect([...checks].filter((c) => c.checked)).toHaveLength(4);
    // 既定 ON の先頭は西洋順
    expect(root.querySelector("#variants .v")?.textContent).toBe("Sōseki Natsume");
    // リンクは新規タブで開く
    const anchor = root.querySelector<HTMLAnchorElement>("#links a");
    expect(anchor?.target).toBe("_blank");
    expect(anchor?.href).toContain("S%C5%8Dseki");
  });

  it("バリアントを OFF にするとリンク群が減る", () => {
    setInput(root, "sei", "なつめ");
    setInput(root, "mei", "そうせき");
    const before = root.querySelectorAll("#links .link-group").length;
    const first = root.querySelector<HTMLInputElement>('#variants input[type="checkbox"]');
    if (!first) throw new Error("no checkbox");
    first.checked = false;
    first.dispatchEvent(new Event("change", { bubbles: true }));
    const after = root.querySelectorAll("#links .link-group").length;
    expect(after).toBe(before - 1);
  });

  it("REQ-005 言語フィルタで ja 専用ターゲットが消え multi は残る", () => {
    setInput(root, "sei", "なつめ");
    setInput(root, "mei", "そうせき");
    const namesAll = [...root.querySelectorAll("#links .links a")].map((a) => a.textContent);
    expect(namesAll).toContain("国立国会図書館サーチ"); // ja 専用
    const langEl = root.querySelector<HTMLSelectElement>("#lang");
    if (!langEl) throw new Error("no #lang");
    langEl.value = "en";
    langEl.dispatchEvent(new Event("change", { bubbles: true }));
    const namesEn = [...root.querySelectorAll("#links .links a")].map((a) => a.textContent);
    expect(namesEn).not.toContain("国立国会図書館サーチ");
    expect(namesEn).toContain("Wikidata"); // multi は残る
    expect(namesEn).toContain("Amazon.com(米)"); // en
  });

  it("REQ-006 入力・言語・選択が URL ハッシュに保存され再マウントで復元される", () => {
    setInput(root, "sei", "なつめ");
    setInput(root, "mei", "そうせき");
    const langEl = root.querySelector<HTMLSelectElement>("#lang");
    if (!langEl) throw new Error("no #lang");
    langEl.value = "en";
    langEl.dispatchEvent(new Event("change", { bubbles: true }));
    // 1件だけ残して他を OFF にする
    const boxes = [...root.querySelectorAll<HTMLInputElement>('#variants input[type="checkbox"]')];
    for (const b of boxes.slice(1)) {
      if (b.checked) {
        b.checked = false;
        b.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
    expect(window.location.hash).not.toBe("");

    // リロード相当: 旧 root を除去してから URL を保持したまま新規マウント → 状態が復元される
    root.remove();
    const root2 = document.createElement("div");
    document.body.append(root2);
    mountApp(root2);
    expect(root2.querySelector<HTMLInputElement>("#sei")?.value).toBe("なつめ");
    expect(root2.querySelector<HTMLInputElement>("#mei")?.value).toBe("そうせき");
    expect(root2.querySelector<HTMLSelectElement>("#lang")?.value).toBe("en");
    const checked2 = root2.querySelectorAll<HTMLInputElement>("#variants input:checked");
    expect(checked2).toHaveLength(1);
    // ja 専用ターゲットは復元後も en フィルタで出ない
    const names = [...root2.querySelectorAll("#links .links a")].map((a) => a.textContent);
    expect(names).not.toContain("国立国会図書館サーチ");
  });

  it("REQ-006 不正ハッシュでもクラッシュせず空状態で起動する", () => {
    root.remove(); // beforeEach の root を除去(リロード相当)
    window.history.replaceState(null, "", "/#%%%broken%%%");
    const root2 = document.createElement("div");
    document.body.append(root2);
    expect(() => mountApp(root2)).not.toThrow();
    expect(root2.querySelector<HTMLInputElement>("#sei")?.value).toBe("");
    expect(root2.querySelector("#links")?.textContent).toContain("選択してください");
  });

  it("変換不能な読みはエラー表示・空入力は選択促し", () => {
    setInput(root, "sei", "夏目");
    expect(root.querySelector(".errors")?.textContent).toContain("変換できません");
    setInput(root, "sei", "");
    expect(root.querySelector("#links")?.textContent).toContain("選択してください");
  });
});
