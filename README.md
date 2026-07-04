# honyaku-query — 翻訳探索クエリビルダー

日本文学の海外語訳を探すための、表記ゆれ対応クエリビルダー。かな読みを入力すると、
ヘボン式ローマ字化 → 表記バリアント展開(Sōseki/Soseki/Souseki、姓名順、イニシャル)→
Wikidata・Open Library・WorldCat・NDL サーチ・JF 翻訳 DB 等への検索リンクを一括生成する。
外部 API を呼ばないリンクアウト専用ツール。Vercel 静的配信のみ・運用コストゼロ。

翻訳探索3部作 その1(hepburn / variants モジュールは その2 honyaku-atlas で再利用される)。

## ドキュメント

AGENTS.md / SPEC.md(REQ-001〜007)/ STATE.md / docs/TEST_SPEC.md / docs/IMPLEMENTATION_GUIDE.md

## セットアップ

```bash
pnpm install && pnpm dev
```

## 初回の Git / GitHub 登録

```bash
./scripts/bootstrap_repo.sh honyaku-query
```

## 注意

ヘボン式変換・バリアントは機械的な近似であり、著者の公式ローマ字表記と異なる場合があります。
