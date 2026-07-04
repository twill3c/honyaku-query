## 対応要求

- REQ-ID: REQ-XXX
- TC-ID: TC-XXX, TC-XXX

## 変更概要

{{何を・なぜ。3行以内}}

## テスト結果

```
{{pnpm test:coverage の出力要約を貼る}}
```

## チェックリスト(Definition of Done)

- [ ] 対象 REQ-ID の受入条件をすべて満たす
- [ ] TC-ID に対応するテストが存在し、全テストがパス
- [ ] `pnpm lint` / `pnpm build` がクリーン
- [ ] カバレッジ基準を満たす(core 90% / 全体 80%)
- [ ] STATE.md 更新済み、SPEC.md / TEST_SPEC.md の状態列を更新済み
- [ ] SPEC.md にない仕様変更を含まない(含む場合は SPEC.md も同 PR で更新)

## 仮決定・レビューしてほしい点

{{Decisions に書いた迷いどころがあればここに転記}}
