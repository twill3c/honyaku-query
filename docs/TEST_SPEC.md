# TEST_SPEC.md — テスト仕様: honyaku-query

> SPEC.md の REQ-ID と 1:N で対応付ける。テスト名に TC-ID を含めること。

## 1. テスト方針

- core(hepburn / variants / targets / codec)は純粋関数。かな変換は規則ごとに境界を列挙する
- 実在作家名を使った統合的な黄金テスト(漱石・鴎外・谷崎など)を1ファイルに集約し、規則テストと分離する
- URL 生成はエンコーディングの正しさ(マクロン・空白・アポストロフィ)を実 URL 文字列で検証

## 2. テストケース一覧

### REQ-001: ヘボン式変換(山場)

| TC-ID | 階層 | 観点 | 期待結果 | 状態 |
|---|---|---|---|---|
| TC-001 | unit | 五十音基本・ひらがな/カタカナ同一視 | なつめ = ナツメ → natsume | 済 |
| TC-002 | unit | 拗音 | しゃ→sha / ちゅ→chu / じょ→jo / りょ→ryo / ぎゃ→gya | 済 |
| TC-003 | unit | 促音 | きっぷ→kippu / ざっし→zasshi / **こっち→kotchi**(ch の前は t) | 済 |
| TC-004 | unit | 撥音の m 化 | しんぶん→shimbun / さんぽ→sampo / ぐんま→gumma | 済 |
| TC-005 | unit | 撥音のアポストロフィ | しんいち→shin'ichi / じゅんや→jun'ya(ん+母音/や行)。しんじ→shinji(不要) | 済 |
| TC-006 | unit | 長音マクロン | そうせき→sōseki / おおえ→ōe / ゆうこ→yūko / **えいご→eigo(ei は非長音)** | 済 |
| TC-007 | unit | カタカナ長音符 | コーヒー→kōhī | 済 |
| TC-008 | unit | 変換不能 | 漢字混じり「夏め」→ `unconvertible` + 位置 0 | 済 |
| TC-009 | unit | 黄金テスト(実在名) | なつめそうせき→natsume sōseki / もりおうがい→mori ōgai / たにざきじゅんいちろう→tanizaki jun'ichirō / かわばたやすなり→kawabata yasunari | 済 |

### REQ-002: バリアント展開

| TC-ID | 階層 | 観点 | 期待結果 | 状態 |
|---|---|---|---|---|
| TC-011 | unit | 長音展開の優先順 | sōseki → [sōseki, soseki, souseki](oh は語末のみなので対象外) | 済 |
| TC-012 | unit | 語末 oh 形 | satō → 展開に satoh を含む(語中の ō には oh を作らない) | 済 |
| TC-013 | unit | 姓名順・イニシャル | (natsume, sōseki) → "Sōseki Natsume" 主、"Natsume Sōseki" 副、"S. Natsume" 末尾 | 済 |
| TC-014 | unit | 重複除去・上限12 | 長音2箇所×姓名順で膨らむ入力(jun'ichirō tanizaki 等)でも 12 件以下+切り捨てフラグ | 済 |
| TC-015 | unit | 決定性 | 同一入力2回で同一の順序列 | 済 |
| TC-016 | unit | 作品名モード | 長音展開のみ適用(姓名順・イニシャルなし) | 済 |

### REQ-003: ターゲットマスタ・URL 生成

| TC-ID | 階層 | 観点 | 期待結果 | 状態 |
|---|---|---|---|---|
| TC-021 | unit | マスタ検証 | 10件以上・id 一意・urlTemplate が https かつ {q} を含む | 済 |
| TC-022 | unit | パーセントエンコード | "Sōseki Natsume" → "S%C5%8Dseki%20Natsume"(percent方式)/ "+" 連結(plus方式) | 済 |
| TC-023 | unit | アポストロフィ | "jun'ichirō" のエンコードが RFC 3986 準拠 | 済 |
| TC-024 | unit | verified_at 鮮度 | 366日前は要確認フラグ(today 注入) | 済 |

### REQ-004: 入力→バリアント→リンク一覧(view-model = `src/core/query.ts`)

> エージェント提案(人間承認待ち)。DOM 描画は `src/ui`(薄い)側で扱い、ここでは純粋な組み立てロジックを検証する。

| TC-ID | 階層 | 観点 | 期待結果 | 状態 |
|---|---|---|---|---|
| TC-025 | unit | buildVariants: 姓名/作品名 | (なつめ, そうせき) → 先頭が "Sōseki Natsume"。作品名は長音展開のみ。変換不能読みは errors に field+index | 済 |
| TC-026 | unit | 既定選択(上位4件 ON) | 優先度上位4件の value が既定 ON。4件未満はある分だけ | 済 |
| TC-027 | unit | リンク行列・コピー文字列 | 各 variant×target で url 生成(エンコード済み)+ stale フラグ(today 注入)。コピー文字列は value を改行連結 | 済 |
| TC-028 | unit | 最低1フィールド・単独姓 | 全空は空結果。姓のみ入力は大文字化した単独名バリアント | 済 |
| TC-029 | unit | HTML エスケープ(render) | `<`/`&`/`"` を含む入力が render 出力でエスケープされる(XSS 防止) | 済 |

### REQ-005 / REQ-006: フィルタ・共有

| TC-ID | 階層 | 観点 | 期待結果 | 状態 |
|---|---|---|---|---|
| TC-031 | unit | 言語フィルタ | en 選択時、multi ターゲットは残る | 済 |
| TC-041 | unit | round-trip | 入力・言語・ONバリアントが深い等価 | 済 |
| TC-042 | unit | 不正ハッシュ | 空状態で起動 | 済 |

### REQ-007: 最近の検索

| TC-ID | 階層 | 観点 | 期待結果 | 状態 |
|---|---|---|---|---|
| TC-051 | unit | 直近10件・重複繰上げ・storage例外 | senbero-sim TC-061 系と同型 | 済 |

## 3. フィクスチャ・テストデータ

- 黄金テスト(TC-009)の実在名は歴史上の作家(著作権・存命性の問題がない範囲)を使用
- `tests/fixtures/kana-table-edge.ts`: ゐ・ゑ・ヴ など周辺文字の扱い(v1 は `unconvertible` とする)を固定

## 4. カバレッジ基準

- `src/core/`: 90% 以上 / 全体: 80% 以上(NFR-001)

## 5. 実行コマンド

```bash
pnpm test              # vitest run
pnpm test:coverage     # PR 前の最終確認
```
