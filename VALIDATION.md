# Project Cruise v0.11.0-rc5 統合検証サマリー

検証日: 2026-08-02  
基礎正本: v0.10.0（データ件数・ID・既存学習キーを維持）

- `npm test`: PASS
- Release documentation/source-authority audit: PASS
- Operational Core: 22/22 PASS
- Result State Machine: PASS
- 501結果×3時間条件×3時間枠の統合選定: PASS
- ローカルHTTP配信: 必須6資産すべて200 OK
- Release Candidate Audit: `automatedPassed = true`
- Canonical promotion: HOLD（Hero WebP 30枚は統合済み。GitHub Pages browser smokeとiPhone Safari手動QAが未完了）

Cross-chat reconciliation: 10 tracks recorded; exact unmounted upstream bytes remain gated.

詳細は `records/release-candidate-audit.json` と `docs/integration/06_RELEASE_REPRODUCIBILITY_AND_CI.md` を参照してください。

---

# Project Cruise v0.10.0 検証記録

検証日: 2026-08-01  
対象: 現在公開中の v0.10.0 正本パッケージ

## 検証結果

| 項目 | 結果 |
|---|---:|
| 地点レコード | 320件 |
| 地点ID重複 | 0件 |
| D001〜D320 欠番 | 0件 |
| 完成ルート（R001〜R181） | 181件 |
| 完成ルートID重複・欠番 | 0件 |
| 目的地直行候補（P-D001〜P-D320） | 320件 |
| 全選択候補 | 501件 |
| 全選択候補ID重複 | 0件 |
| JSON構文 | 合格 |
| index.html 内インラインJavaScript構文 | 合格（3ブロック） |
| index.html 埋込データと分離JSON | 同一（同じ配列から機械抽出） |

## 既知のデータモデル事項

- 同名地点は17組あります。IDはすべて別で、公開版の選択挙動を変えないため統合・削除していません。
- 完成ルートの終点のうち、地点名との完全一致がない名称は8件です。
- 完成ルートの経由地のうち、地点名との完全一致がない名称は9件です。
- 上記の名称不一致はルート表示やGoogle Maps URL生成を妨げません。地点単位の補足情報だけがルート側メタデータへフォールバックします。

### 同名地点

| 地点名 | ID |
|---|---|
| ちどり公園 | D011 / D256 |
| 本牧山頂公園 | D027 / D164 |
| 野島公園 | D028 / D161 |
| 海の公園 | D029 / D165 |
| 荒崎公園 | D033 / D162 |
| 燈明堂緑地 | D034 / D187 |
| 舎人公園 | D042 / D173 |
| 桜ヶ丘公園 ゆうひの丘 | D044 / D143 |
| 彩湖・道満グリーンパーク | D046 / D178 |
| 秋ヶ瀬公園 | D047 / D170 |
| 袖ケ浦海浜公園 | D052 / D177 |
| 太田山公園 | D066 / D111 |
| 昭和の森 | D073 / D169 |
| 泉自然公園 | D074 / D176 |
| 道の駅 いちかわ | D081 / D235 |
| 道の駅 しょうなん | D082 / D238 |
| 県立相模三川公園 | D141 / D218 |

### 地点DBと完全一致しない完成ルート終点

- 県営権現堂公園
- 神宮外苑
- 横浜・八景島シーパラダイス
- 葉山港
- 臨港パーク
- 辻堂海浜公園
- 小柴自然公園
- 多摩川台公園

### 地点DBと完全一致しない完成ルート経由地

- 東京ゲートブリッジ
- 立石公園
- 三崎港 うらり
- 小田原漁港
- 代々木公園
- ペリー公園
- 県立葉山公園
- 手賀沼親水広場
- 洗足池公園

## SHA-256

| ファイル | SHA-256 |
|---|---|
| 元ZIP | `4aa1ed555c328c7a974bd1f58e10ae76bad2fb05dbfa48c7f07f53f36f67ad4a` |
| index.html | `8812231efa7fdbe6821906d187d9ef464c8359a26b62451006130e0585706b51` |
| destinations.json | `ad6fea8b6e323236beef4e64661e3981e66c3d904617b7860b46fea53b6aed2d` |
| routes.json | `d120222a9f2da48a58efc9b656deec564fb3a4146dffc2dce0df2d8d11cc9098` |
| project-cruise.json | `cd4ffd9eba5049d7a1ee2f0c3c3fd35160c260848b5e5cf14fcf3e33347ba73b` |
