# STATE.md — 作業状態トラッキング

> **エージェントが毎ループ更新する。** 各セクションは「上に新しいものを追記」する。

## Current Phase

Phase 3 — **全 REQ(001〜007)完了**。残りは Vercel 初回デプロイ(人間/運用ステップのみ)。3部作その1の共有モジュール(hepburn/variants)は vendor 取り込み可能な状態

## Now(現在着手中)

- なし。全機能実装済み。人間の作業: (1) REQ-003 URL テンプレの実ブラウザ確認 (2) Vercel 初回デプロイ (3) エージェント提案 TC(025〜029)の承認

## Next Actions(次にやること・計画メモ)

- [x] REQ-001: `src/core/hepburn.ts` — 3ループで完了(LOOP_LOG #1〜3)
- [x] REQ-002: `src/core/variants.ts` — 1ループで完了(LOOP_LOG #4)
- [x] REQ-003: `src/core/targets.ts` + `urlBuild.ts` — 1ループで完了(LOOP_LOG #5、TC-021〜024)
- [x] REQ-004: `src/core/query.ts`(view-model)+ `src/ui/*` — 1ループで完了(LOOP_LOG #6、TC-025〜029)
- [x] REQ-005: `filterTargetsByLang` + 言語セレクタ — 完了(LOOP_LOG #7、TC-031)。URL 同期は REQ-006 で回収済み
- [x] REQ-006: `codec.ts` + `adapters/urlHash.ts` + app.ts 配線 — 完了(LOOP_LOG #8、TC-041/042)。REQ-005 の URL 同期も達成
- [x] REQ-007: `core/recent.ts` + `adapters/storage.ts` + ui — 完了(LOOP_LOG #9、TC-051)
- [ ] Vercel 初回デプロイ(人間/運用ステップ、Blockers 参照)

## Done(完了ログ)

| 日付 | REQ/TC | 内容 | PR |
|---|---|---|---|
| 2026-07-15 | REQ-007 / TC-051 | recent + storage + ui(core 99.2% / 全体 97.6%、86 tests)。**全 REQ 完了** | feat/REQ-007-recent |
| 2026-07-15 | REQ-006 / TC-041,042 | codec + urlHash + 復元/書き戻し配線(core 99.2% / 全体 97.6%、73 tests)。REQ-005 URL 同期も達成 | feat/REQ-006-url-share |
| 2026-07-15 | REQ-005 / TC-031 | 言語フィルタ完了(core 99.5% / 全体 98.1%、65 tests)。URL 同期は REQ-006 へ | feat/REQ-005-lang-filter |
| 2026-07-15 | REQ-004 / TC-025〜029 | query(view-model)+ UI 完了(core 99.5% / 全体 98.0%、bundle 5.2KB gzip) | feat/REQ-004-ui |
| 2026-07-15 | REQ-003 / TC-021〜024 | targets + urlBuild 完了(core 99.4% / 全体 98.6%) | feat/REQ-003-targets-urlbuild |
| 2026-07-03 | REQ-002 / TC-011〜016 | variants 完了(coverage 98.0%) | ローカルマージ fc37dcb |
| 2026-07-03 | REQ-001 / TC-001〜009 | hepburn 完了(coverage 98.2%) | ローカルマージ efcf45d |
| 2026-07-03 | - | git 初期化・ループ台帳形式定義(docs/LOOP_LOG.md) | 153a31e |
| 2026-07-03 | - | 足場生成(SPEC/TEST_SPEC 記入済み) | - |

## Blockers(障害・待ち)

- **Vercel 初回デプロイ**はリモート未設定 + Vercel 認証なし(サンドボックス)で自動化不可。人間が (1) GitHub リモート作成・push (2) Vercel プロジェクト連携 を行う運用ステップ。ビルドは `pnpm build` → `dist/` 静的出力で確認済み(NFR-004 サーバレスなし)
- 検索ターゲット12件の URL テンプレートは REQ-003 で**仮投入済み**(各サイト検索仕様に基づく)。人間の実ブラウザ確認 → 差し替え・verifiedAt 更新が残タスク(構造・エンコード方式・検証関数・鮮度判定は確定)。特に jpf-jltrans / bnf / dnb は要確認

## Decisions(決定ログ)

| 日付 | 決定 | 理由 / 代替案 |
|---|---|---|
| 2026-07-15 | 改行コードを `.gitattributes`(`* text=auto eol=lf`)で LF に統一 | Windows(core.autocrlf=true)で作業ツリーが CRLF 化し `pnpm lint`(Biome=LF既定)が誤検知していた。ローカルは core.autocrlf=false + 既存ファイルを LF 正規化。CI/Linux は元々 LF blob で影響なし。全ループ共通の環境改善(chore ブランチ→main) |
| 2026-07-15 | 「最近の検索」への記録タイミング=結果リンクのクリック時 | 明示的な検索ボタンを設けず(リンクはライブ生成)、実際に検索を使った瞬間=リンク遷移を記録点に。キーストローク毎の保存を避け決定的。エントリは SearchState 全体を保存し再実行で選択も復元。同定は読み+言語(recent.ts) |
| 2026-07-15 | ハッシュ形式は URLSearchParams(s/m/t/l/v)。既定値は省略し空状態=空ハッシュ | JSON+base64 より可読・堅牢(パーセントエンコードで丸ごと往復)。selected は v の反復で順序保持。書き戻しは replaceState(履歴を汚さない) |
| 2026-07-15 | 復元時に selected は現存する variant value のみ採用 | 古い共有 URL や読み変更でバリアント集合が変わっても安全(存在しない選択は無視)。決定性を維持 |
| 2026-07-15 | REQ-005 の「URL クエリ同期」を REQ-006 に委譲。本ループはフィルタ本体+セレクタ UI まで | URL 同期は codec(状態⇔ハッシュ)に依存。REQ-006 で言語・ONバリアント含め一括シリアライズする方が重複がない(AGENTS 9章の仮決定)。filterTargetsByLang は純粋・順序保存 |
| 2026-07-15 | REQ-004 のロジックを `src/core/query.ts`(view-model)に集約し ui は薄く保つ | AGENTS 5章「ui はロジックを持たない」。純粋関数で node テスト可能に(TC-025〜029)。render は HTML 文字列を返す純関数、app は DOM/状態のみ |
| 2026-07-15 | jsdom を devDependency 追加(UI 結線の統合テスト用) | NFR-003 はランタイムバンドル制約でありテスト専用 devDep は対象外。app.ts の DOM 結線を end-to-end 検証(免責表示・既定4件ON・トグル・エラー)。**発見**: テスト側の body 未クリアで重複 id → jsdom の getElementById 由来で querySelector が null。afterEach でクリアして解消(本番は #app へ1回マウントのみで無害) |
| 2026-07-15 | 既定 ON は姓名+作品名を結合した優先度順の上位4件 | SPEC「上位4件 ON」を2リスト構成に適用。結合順(姓名→作品名)で決定的 |
| 2026-07-15 | REQ-003 の URL テンプレートを仮投入して実装を進行(人間の実ブラウザ確認待ち) | AGENTS 9章に従い影響小の仮決定。URL は差し替え可能なデータで構造・検証には影響しない。テンプレは data として targets.ts に集約し、規則(エンコード・検証・鮮度)はロジック側 |
| 2026-07-15 | RFC 3986 準拠エンコードを自前実装(encodeURIComponent + `!'()*` 追加符号化) | TC-023 が `'`→`%27` を要求。encodeURIComponent は sub-delims を素通しするため不足。plus 方式は %20→+ 置換で対応 |
| 2026-07-15 | 鮮度判定 `isStale(target, today)` は today を注入 | core は Date.now() 禁止(AGENTS 5章)。verifiedAt は UTC 深夜として解釈し 365 日超で stale |
| 2026-07-03 | 撥音の既定=伝統ヘボン式(shimbun)で仮決定・実装 | Open Question を AGENTS 9章に従い仮決定で進行(修正式 n 形は REQ-002 の将来規則で吸収可能な設計)。人間の最終確認は継続 |
| 2026-07-03 | TC-009 はフィールド(姓/名)単位の変換対と解釈 | toHepburn は1フィールド単位の API(UI の入力形に対応)。TEST_SPEC の表記を解釈しテストコメントに明記 |
| 2026-07-03 | REQ-001 は 3 ループ 1 マージ(3PR 分割計画から変更) | ローカル git 運用での簡素化。ループ粒度は計画どおり3分割を維持(台帳参照) |
| 2026-07-03 | grutto-sim ハーネスを再利用(3部作3セット目の1作目) | 差分は概要と保持規約(NFC 正規化・モジュール純度)のみ。差分行数は共通化判断(bunka-cluster-map Phase 2)の材料として記録 |
| 2026-07-03 | 外部 API を呼ばずリンクアウトに徹する | ゼロコスト・利用規約リスクゼロ・オフライン動作。結果表示の需要は案3(オブザーバトリー)が担う |
| 2026-07-03 | 漢字→読みの推定を載せない | 形態素解析はバンドル肥大+誤読リスク。読み入力はユーザの方が正確(文学者名は読みが自明でないものが多い) |
| 2026-07-03 | ヘボン式のみ・訓令式なし | 海外書誌の実態(LC 翻字含む)に合わせる。撥音 m 化(shimbun 型)は伝統ヘボン式を既定とし、n 形はバリアント側で吸収 |
| 2026-07-03 | バリアント上限 12 件 | 組合せ爆発の抑制。UI で人間が一覧確認できる規模を優先 |

## Open Questions(人間への質問)

- 撥音の既定: **伝統式(shimbun)で仮決定・実装済み**(Decisions 参照)。修正式(shinbun)をバリアント規則として REQ-002 に追加するか、確認をお願いします
- REQ-003 の URL テンプレートは仮投入で実装完了。人間の実ブラウザ確認 → targets.ts のテンプレ差し替え・verifiedAt 更新をお願いします(Blockers/Decisions 参照)

