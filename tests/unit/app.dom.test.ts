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
    root = document.createElement("div");
    document.body.append(root);
    mountApp(root);
  });
  afterEach(() => {
    root.remove();
    document.body.innerHTML = "";
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

  it("変換不能な読みはエラー表示・空入力は選択促し", () => {
    setInput(root, "sei", "夏目");
    expect(root.querySelector(".errors")?.textContent).toContain("変換できません");
    setInput(root, "sei", "");
    expect(root.querySelector("#links")?.textContent).toContain("選択してください");
  });
});
