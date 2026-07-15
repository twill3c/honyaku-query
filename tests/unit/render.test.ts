// REQ-004 描画のエスケープ・構造(TC-029)
import { describe, expect, it } from "vitest";
import type { VariantLinks } from "../../src/core/query";
import { escapeHtml, renderErrors, renderLinks, renderVariantList } from "../../src/ui/render";

describe("TC-029 HTML エスケープ", () => {
  it("TC-029 escapeHtml は < & \" ' > を実体参照化", () => {
    expect(escapeHtml(`<img src=x onerror="a">&'`)).toBe(
      "&lt;img src=x onerror=&quot;a&quot;&gt;&amp;&#39;",
    );
  });
  it("TC-029 renderVariantList は variant 値をエスケープして埋め込む", () => {
    const html = renderVariantList(
      [{ value: "<script>", ruleTags: [], priority: 0 }],
      new Set<string>(),
    );
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("TC-029 renderLinks / renderErrors", () => {
  const rows: VariantLinks[] = [
    {
      variant: { value: "Sōseki Natsume", ruleTags: [], priority: 0 },
      links: [
        { targetId: "a", targetName: "Fresh DB", url: "https://x.test/?q=1", stale: false },
        { targetId: "b", targetName: "Old DB", url: "https://y.test/?q=1", stale: true },
      ],
    },
  ];
  it("TC-029 空リンクは選択を促すメッセージ", () => {
    expect(renderLinks([])).toContain("選択してください");
  });
  it("TC-029 リンクは新規タブ(target=_blank, rel=noopener)で開く", () => {
    const html = renderLinks(rows);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });
  it("TC-029 stale なターゲットのみ要確認バッジ", () => {
    const html = renderLinks(rows);
    expect((html.match(/要確認/g) ?? []).length).toBe(1);
  });
  it("TC-029 renderErrors はフィールド名と位置を表示・空は空文字", () => {
    expect(renderErrors([])).toBe("");
    const html = renderErrors([
      { field: "sei", error: { code: "unconvertible", index: 2, char: "漢" } },
    ]);
    expect(html).toContain("姓");
    expect(html).toContain("位置 2");
    expect(html).toContain("漢");
  });
});
