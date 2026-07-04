# AGENTS.md — エージェント作業ハーネス(中核)

> このファイルが **エージェントにとっての単一の入口(Single Entry Point)** です。
> 人間向けの説明は README.md、要求仕様は SPEC.md、進捗は STATE.md を参照してください。

---

## 1. プロジェクト概要

- **プロジェクト名**: honyaku-query(翻訳探索クエリビルダー)
- **目的**: かな読みからヘボン式ローマ字・表記バリアント・書誌DB検索URLを一括生成する完全クライアントサイドの Web ツール(リンクアウト専用)。Vercel 静的配信のみで運用コストゼロ
- **現在フェーズ**: STATE.md の `Current Phase` を常に正とする

## 2. ドキュメントマップ(読む順序)

| 順 | ファイル | 役割 | 更新者 |
|---|---|---|---|
| 1 | AGENTS.md(本ファイル) | 作業規約・ループプロトコル | 人間(承認制) |
| 2 | STATE.md | 現在地・次アクション・決定ログ | エージェント(毎ループ) |
| 3 | SPEC.md | 要求仕様(REQ-ID 管理) | 人間主導 |
| 4 | docs/TEST_SPEC.md | テスト仕様(TC-ID ↔ REQ-ID) | エージェント提案→人間承認 |
| 5 | docs/IMPLEMENTATION_GUIDE.md | アーキテクチャ・実装方針 | エージェント提案→人間承認 |

**原則**: プロセスの正はこのファイル。仕様の正は SPEC.md。状態の正は STATE.md。矛盾を見つけたら作業を止めて報告する。

## 3. 環境・コマンド

```bash
# セットアップ
pnpm install

# Lint / Format(Biome)
pnpm lint          # biome check .
pnpm lint:fix      # biome check --write .

# テスト(Vitest)
pnpm test          # vitest run(高速確認)
pnpm test:watch    # 開発中の TDD ループ用
pnpm test:coverage # カバレッジ付き(PR 前必須)

# ビルド
pnpm build         # vite build(dist/ に静的出力)
```

- Node: `>=22`、パッケージ管理は **pnpm のみ**(npm / yarn を直接使わない)
- 依存追加は `pnpm add <pkg>`、開発依存は `pnpm add -D <pkg>`
- **ランタイム依存の追加は原則禁止**(NFR-003 バンドルサイズ制約)。必要なら Decisions に理由を記録し PR で明示

## 4. 作業ループプロトコル(Loop Protocol)

各作業単位(1タスク)は必ず以下の順で回す:

1. **Read** — STATE.md → SPEC.md の対象 REQ-ID → docs/TEST_SPEC.md の対応 TC → 関連コードを読む
2. **Plan** — 変更方針を 3〜5 行で STATE.md の `Next Actions` に記録
3. **Red** — 失敗するテストを先に書く(テスト名に TC-ID を含める)
4. **Green** — テストを通す最小実装
5. **Refactor** — Biome クリーン、重複除去、core の純粋性維持
6. **Record** — STATE.md を更新(Done / Next / Decisions)+ SPEC.md / TEST_SPEC.md の状態列を更新
7. **Ship** — 下記 Git ワークフローに従い commit → push → PR

**1ループ = 1 REQ-ID = 1 PR** を基本とする。REQ-001 のように TC が多い場合も 1 PR にまとめてよいが、diff が 400 行を超えそうなら分割を提案する。

## 5. アーキテクチャ規約(違反したら Refactor で戻す)

- `src/core/` は **純粋関数のみ**。DOM・localStorage・URL・Date.now() に触れない。文字列は入力直後に NFC 正規化し、以降は正規化済み前提。hepburn/variants は他プロジェクトから import 可能な純度を保つ(NFR-004)
- 副作用(storage、URL ハッシュ)は `src/adapters/` に隔離
- `src/ui/` は core と adapters を呼ぶだけ。ロジックを持たない
- 詳細は docs/IMPLEMENTATION_GUIDE.md

## 6. Git ワークフロー(必須)

### ブランチ規約
- `main` への直接コミット・直接 push は **禁止**
- ブランチ名: `feat/REQ-001-item-crud` / `fix/...` / `chore/...` / `docs/...`

### コミット規約(Conventional Commits)
```
feat(core): REQ-002 重量集計を実装
test(core): TC-011〜015 を追加
docs: STATE.md を更新
```

### PR 作成手順(エージェントが実行)
```bash
git checkout -b feat/REQ-XXX-short-desc
# ... Red → Green → Refactor ...
pnpm lint && pnpm test:coverage && pnpm build   # ← 通らなければ push しない
git add -A
git commit -m "feat: REQ-XXX ..."
git push -u origin HEAD
gh pr create --fill --base main
```

> push 後は `.github/workflows/auto-pr.yml` が保険として自動 Draft PR を作成するが、
> **原則はエージェント自身が `gh pr create` で説明付き PR を作る**こと。

### PR 本文に必ず含めるもの
- 対応する REQ-ID / TC-ID
- `pnpm test:coverage` の要約
- STATE.md を更新済みであること

## 7. Definition of Done(完了条件)

- [ ] 対象 REQ-ID の受入条件をすべて満たす
- [ ] 対応する全 TC-ID のテストが存在し、全テストがパス
- [ ] `pnpm lint` クリーン、`pnpm build` 成功
- [ ] カバレッジ基準を満たす(core 90% / 全体 80%)
- [ ] STATE.md 更新済み、SPEC.md / TEST_SPEC.md の状態列を更新済み
- [ ] PR 作成済み・CI グリーン

## 8. 禁止事項・安全策

- `main` への直接 push、`--force` push
- テストの削除・skip・期待値の書き換えによるグリーン化
- SPEC.md にない機能の勝手な追加(必要なら SPEC.md への追記を **提案** する)
- ランタイムの外部 API 呼び出しの追加(NFR-002 違反)
- サーバレス関数・Edge Function の追加(NFR-004 違反)

## 9. 判断に迷ったら

1. STATE.md の Decisions に「迷った点・選択肢・仮決定」を書く
2. 影響が小さければ仮決定で進み、PR 本文で明示する
3. 影響が大きければ作業を止め、人間に質問する
