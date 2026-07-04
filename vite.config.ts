import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "es2022",
    // NFR-003: バンドルサイズ監視のためレポートを常時出力
    reportCompressedSize: true,
  },
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/**"],
      thresholds: {
        // NFR-001
        lines: 80,
        branches: 80,
      },
    },
  },
});
