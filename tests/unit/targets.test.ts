// REQ-003 検索ターゲットマスタ・URL 生成(TC-021〜024)
import { describe, expect, it } from "vitest";
import { TARGETS, isStale, validateTargets } from "../../src/core/targets";
import { buildUrl, encodeQuery } from "../../src/core/urlBuild";

describe("TC-021 マスタ検証", () => {
  it("TC-021 10 件以上ある", () => {
    expect(TARGETS.length).toBeGreaterThanOrEqual(10);
  });
  it("TC-021 id が一意", () => {
    const ids = TARGETS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("TC-021 全 urlTemplate が https かつ {q} を含む", () => {
    expect(validateTargets(TARGETS)).toEqual([]);
  });
  it("TC-021 不正テンプレートを検出する(http・{q}欠落)", () => {
    const bad = [
      {
        id: "no-q",
        name: "x",
        langs: ["multi"] as const,
        urlTemplate: "https://x.test/s?k=",
        encoding: "percent" as const,
        verifiedAt: "2026-07-15",
      },
      {
        id: "no-https",
        name: "y",
        langs: ["multi"] as const,
        urlTemplate: "http://y.test/s?k={q}",
        encoding: "plus" as const,
        verifiedAt: "2026-07-15",
      },
    ];
    const errors = validateTargets(bad);
    expect(errors.map((e) => e.id).sort()).toEqual(["no-https", "no-q"]);
  });
});

describe("TC-022 パーセントエンコード", () => {
  it("TC-022 percent 方式: マクロン+空白", () => {
    expect(encodeQuery("Sōseki Natsume", "percent")).toBe("S%C5%8Dseki%20Natsume");
  });
  it("TC-022 plus 方式: 空白は + 連結", () => {
    expect(encodeQuery("Sōseki Natsume", "plus")).toBe("S%C5%8Dseki+Natsume");
  });
  it("TC-022 buildUrl が {q} を置換してエンコードする", () => {
    const target = {
      id: "t",
      name: "t",
      langs: ["multi"] as const,
      urlTemplate: "https://x.test/s?q={q}",
      encoding: "percent" as const,
      verifiedAt: "2026-07-15",
    };
    expect(buildUrl(target, "Sōseki Natsume")).toBe("https://x.test/s?q=S%C5%8Dseki%20Natsume");
  });
});

describe("TC-023 アポストロフィ", () => {
  it("TC-023 jun'ichirō は RFC 3986 準拠(' → %27)", () => {
    // encodeURIComponent は ' を素通しするため、RFC 3986 では %27 に符号化する必要がある
    expect(encodeQuery("jun'ichirō", "percent")).toBe("jun%27ichir%C5%8D");
  });
});

describe("TC-024 verified_at 鮮度", () => {
  const target = {
    id: "t",
    name: "t",
    langs: ["multi"] as const,
    urlTemplate: "https://x.test/s?q={q}",
    encoding: "percent" as const,
    verifiedAt: "2025-07-15",
  };
  it("TC-024 366 日前は要確認(stale)", () => {
    const today = new Date("2026-07-16T00:00:00Z"); // 2025-07-15 から 366 日
    expect(isStale(target, today)).toBe(true);
  });
  it("TC-024 365 日以内は鮮度あり(not stale)", () => {
    const today = new Date("2026-07-15T00:00:00Z"); // ちょうど 365 日
    expect(isStale(target, today)).toBe(false);
  });
});
