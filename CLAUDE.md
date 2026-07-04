# CLAUDE.md

このプロジェクトの作業規約・ループプロトコル・Git ワークフローはすべて AGENTS.md に集約されています。

@AGENTS.md

## Claude Code 固有の補足

- 作業開始時は必ず STATE.md → SPEC.md の順で読むこと
- TDD ループ中は `pnpm test:watch` を活用してよいが、PR 前は必ず `pnpm test:coverage` を実行すること
- `gh` CLI が認証済みであることを前提とする(未認証なら報告して停止)
