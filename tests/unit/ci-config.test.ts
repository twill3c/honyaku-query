// TC-901: CI は手元と同じ pnpm で install する。
//
// 実測(2026-09-15): CI は pnpm/action-setup に `version: 9` を固定していたが、
// 手元は pnpm 10.28.2 で、pnpm-workspace.yaml は pnpm 10 の `allowBuilds` 書式だった。
// pnpm 9 は packages の無い pnpm-workspace.yaml を拒否する(`packages field missing or empty`)ため、
// CI は初回(2026-08-13)から 7 回中 7 回 install で落ち、テストは一度も走っていなかった。
// 版の出どころを package.json の packageManager 一つにし、action 側には版を書かない
// (両方に書くと pnpm/action-setup は「Multiple versions of pnpm specified」で落ちる)。
import { describe, expect, it } from "vitest";
import ciYml from "../../.github/workflows/ci.yml?raw";
import pkgJson from "../../package.json?raw";
import workspaceYml from "../../pnpm-workspace.yaml?raw";

/** pnpm/action-setup のステップに書かれた version を返す(無ければ null)。 */
function actionPinnedPnpm(yml: string): string | null {
  const lines = yml.split(/\r?\n/);
  const start = lines.findIndex((l) => /uses:\s*pnpm\/action-setup/.test(l));
  if (start < 0) return null;
  for (const line of lines.slice(start + 1)) {
    if (/^\s*-\s/.test(line)) break; // 次のステップ
    const m = line.match(/^\s+version:\s*["']?([^"'\s]+)/);
    if (m?.[1]) return m[1];
  }
  return null;
}

/** packageManager の pnpm の版(例: "10.28.2")。pnpm でなければ null。 */
function packageManagerPnpm(pkg: string): string | null {
  const pm = (JSON.parse(pkg) as { packageManager?: string }).packageManager;
  const m = pm?.match(/^pnpm@(\d+\.\d+\.\d+)$/);
  return m?.[1] ?? null;
}

const hasPackagesField = (yml: string) => /^packages:\s*\S|^packages:\s*$\n\s+-/m.test(yml);

describe("TC-901 CI の pnpm の版", () => {
  it("検出器の対照: action の version を拾う / 次のステップの version は拾わない", () => {
    const pinned =
      "steps:\n      - uses: pnpm/action-setup@v4\n        with:\n          version: 9\n      - uses: actions/setup-node@v4\n";
    expect(actionPinnedPnpm(pinned)).toBe("9");
    const unpinned =
      "steps:\n      - uses: pnpm/action-setup@v4\n      - uses: actions/setup-node@v4\n        with:\n          version: 22\n";
    expect(actionPinnedPnpm(unpinned)).toBeNull();
    expect(packageManagerPnpm('{"packageManager":"pnpm@10.28.2"}')).toBe("10.28.2");
    expect(packageManagerPnpm('{"name":"x"}')).toBeNull();
    expect(hasPackagesField("allowBuilds:\n  esbuild: false\n")).toBe(false);
    expect(hasPackagesField("packages:\n  - .\n")).toBe(true);
  });

  it("package.json の packageManager で pnpm の版を固定している", () => {
    expect(packageManagerPnpm(pkgJson)).not.toBeNull();
  });

  it("CI の pnpm/action-setup は版を書かず packageManager に従う", () => {
    expect(actionPinnedPnpm(ciYml)).toBeNull();
  });

  it("packages の無い pnpm-workspace.yaml を置くなら pnpm は 10 以上", () => {
    if (hasPackagesField(workspaceYml)) return;
    const major = Number(packageManagerPnpm(pkgJson)?.split(".")[0] ?? 0);
    expect(major).toBeGreaterThanOrEqual(10);
  });
});
