// CI を初回コミットからグリーンにするためのスモークテスト。
// REQ-001 の TC-001 実装時にこのファイルは削除してよい(AGENTS.md 8章の
// 「テスト削除禁止」は REQ/TC に対応するテストが対象。本ファイルは対象外)。
import { describe, expect, it } from "vitest";

describe("scaffold smoke", () => {
  it("test runner is wired", () => {
    expect(1 + 1).toBe(2);
  });
});
