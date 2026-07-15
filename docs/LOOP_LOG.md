# LOOP_LOG.md — ループ実行台帳

> **目的**: ハーネス(AGENTS.md ループプロトコル)の下流検証。1ループ=1行で実測を記録し、
> 「足場記入済みプロジェクトでループがどれだけ滑らかに回るか」の一次データとする(セミナー素材)。
> 本形式は harness-template への還流候補。

## 記録形式

| 列 | 意味 |
|---|---|
| # | ループ通番 |
| ブランチ / REQ | 対象ブランチと REQ-ID(1ループ=1REQ。分割時は枝番) |
| TC | このループで Red→Green にした TC-ID |
| Red→Green往復 | テスト実行の失敗→修正の往復回数(1=一発Green) |
| 人間介入 | 仕様解釈の質問・仮決定など人間判断が必要だった点(なし=空欄) |
| 差分行数 | コミットの追加+削除行数 |
| テスト数 | このループの新規 / 累計 |
| 検証 | test / lint / coverage / build の結果(環境で実行できたもの) |
| メモ | 逸脱・発見・スキル/テンプレへの還流候補 |

## 環境に関する注記(2026-07-03)

- 本セッションはサンドボックス実行のため **GitHub リポジトリ作成・PR 作成は不可**。
  bootstrap_repo.sh は実行せず、ローカル git(main + feat ブランチ + merge)で代替する。
  AGENTS.md 6章の「gh pr create」は環境制約による逸脱として全ループ共通で記録し、
  PR 本文相当の情報はマージコミットメッセージに残す
- 所要時間の代わりに Red→Green 往復数を滑らかさの指標とする

## 台帳

| # | ブランチ / REQ | TC | Red→Green往復 | 人間介入 | 差分行数 | テスト数 | 検証 | メモ |
|---|---|---|---|---|---|---|---|---|
| 1 | feat/REQ-001-hepburn(1/3) | TC-001, 002, 008 | 3 | なし | +228 | 7 / 8 | test・lint・tsc ✓ | Red 段階でテスト自身にスコープ外文字(ん)が混入→修正。**「Red のテストは当該ループの規則だけを使う」を規律としてスキルへ還流候補**。tsc の noUncheckedIndexedAccess 対応1回 |
| 2 | feat/REQ-001-hepburn(2/3) | TC-003, 004, 005 | 1 | 撥音既定を仮決定(伝統式 shimbun。Open Question を AGENTS 9章に従い仮決定で進行・本欄で明示) | +108 −8 | 6 / 14 | test・lint・tsc ✓ | 一発 Green。トークン種別(syllable/sokuon/hatsuon)導入 |
| 3 | feat/REQ-001-hepburn(3/3) | TC-006, 007, 009 + 周辺文字 | 1 | TC-009 の「なつめそうせき→natsume sōseki」をフィールド対と解釈(仮決定・テストコメントに明記) | +131 −13 | 7 / 21 | test・lint・tsc・**coverage 98.2%** ✓ | 一発 Green。REQ-001 完了・状態列更新 |
| 4 | feat/REQ-002-variants | TC-011〜016 | 2 | なし | +250 −7 | 9 / 30 | test・lint・tsc・**coverage 98.0%** ✓ | テスト側の型誤り(Variant を文字列扱い)修正1回。REQ-002 完了 |
| 5 | feat/REQ-003-targets-urlbuild | TC-021〜024 | 2 | URL テンプレを仮投入で進行(実ブラウザ確認待ち。AGENTS 9章の仮決定+明示) | +約300 | 10 / 40 | test・lint・tsc・build・**coverage core 99.4% / 全体 98.6%** ✓ | Red 1回(モジュール不在確認)+ lint 整形1回。実装バグ 0。targets.ts=data / urlBuild.ts=規則 に分離。RFC 3986 エンコードは自前実装。REQ-003 完了 |
| 6 | feat/REQ-004-ui | TC-025〜029 | 2 | REQ-004 に TC 未定義 → TC-025〜029 をエージェント提案(TEST_SPEC・人間承認待ち) | +約620 | 20 / 60 | test・lint・tsc・build・**coverage core 99.5% / 全体 98.0%**・bundle 5.2KB gzip ✓ | tsc の型厳格(exactOptional / 未 export)で 2 件修正、lint 整形 2 回。**jsdom 統合テストが app.ts の DOM 結線を検証**(免責・既定4件ON・トグル・エラー)。ロジックは core/query に集約し ui を薄く保持。REQ-004 完了・動く UI 成立 |
| 7 | feat/REQ-005-lang-filter | TC-031 | 1 | 受入の「URL 同期」を REQ-006 に委譲(codec 依存。AGENTS 9章の仮決定) | +約90 | 5 / 65 | test・lint・tsc・build・**coverage core 99.5% / 全体 98.1%** ✓ | 一発 Green。純粋関数 filterTargetsByLang(multi 常時表示)+ 言語セレクタ配線。DOM 統合テストで ja 専用除外・multi 残存を end-to-end 検証。REQ-005 フィルタ完了 |
| 8 | feat/REQ-006-url-share | TC-041, 042 | 2 | なし(REQ-005 の URL 同期を回収) | +約200 | 8 / 73 | test・lint・tsc・build・**coverage core 99.2% / 全体 97.6%** ✓ | codec(純粋・URLSearchParams)は一発 Green。DOM 復元テストで**再び jsdom の重複 id 落とし穴**(2つ目の root を旧 root 残置のままマウント→ getElementById 由来で querySelector null)。旧 root 除去=リロード相当に修正。codec=core / urlHash=adapter / 復元=ui に3層分離。REQ-005/006 完了 |

## 第1回実行のサマリ(2026-07-03)

- **4ループ / 2 REQ 完了 / テスト30本 / core カバレッジ 98%**(NFR-001 基準 90% を大きく超過)
- Red→Green 往復: 平均 1.75(一発 Green 2回)。失敗4回のうち**実装バグ 0・テスト側の記述ミス 2・型設定対応 1・モジュール不在(Red確認)1** — 足場の SPEC/TC が実装を強く拘束し、実装側の手戻りが発生しなかった
- 人間介入 2 件はいずれも「仕様解釈の仮決定」で、AGENTS 9章(仮決定+明示)のフロー通りに処理できた
- 逸脱: GitHub 不可(ローカル git 代替)、REQ-001 の 3PR 分割計画は 3 ループ 1 マージに変更
- **vendor 本家として成立**: hepburn/variants が実装済みとなり、6 消費者(honyaku-atlas, prize-atlas, kaigaidai-query, eigajin-query, kaigai-joei-query ほか)の vendor 取り込みが机上から実行可能になった
