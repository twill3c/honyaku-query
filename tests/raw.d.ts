// Vite の `?raw` import(ファイルを文字列として読む)の型宣言。
// tsconfig の types を vitest/globals に絞っているため vite/client の宣言が入らない。
// テストで設定ファイル(package.json / CI 定義)を読むためだけに使う(TC-901)。
declare module "*?raw" {
  const content: string;
  export default content;
}
