# Project Cruise v0.11.0-rc4 — GitHub Integration Candidate

## GitHubへ今すぐ公開する場合

1. `GITHUB_PUBLISH_NOW.md`を読む。
2. ZIPを展開し、中身をGitHubリポジトリ直下へアップロードする。
3. Settings → Pagesで **GitHub Actions** を選ぶ。
4. Actionsの検証とデプロイ完了後、公開URLをiPhone Safariで確認する。

> この版は公開テスト可能なRCです。正確なHero WebP 30枚は統合済み。GitHub PagesとiPhone Safariの実機QAが未完了のため、v0.10.0に代わる正本昇格はHOLDです。

> **Status:** automated integration PASS / canonical promotion HOLD.  
> **Canonical base:** v0.10.0 — 320 destinations, 181 canonical routes, 501 selectable results.

This candidate layers Cinematic UI, Hero Precision, arrival weather, parking/arrival presentation and operational hard gates over the unchanged v0.10.0 data baseline.

## Start here

```bash
npm test
python3 scripts/audit_release_candidate.py
python3 -m http.server 8080
```

Then open `http://localhost:8080/`.

## GitHub test order

1. Read `DEPLOYMENT.md`.
2. Push to `release/v0.11.0-rc4`.
3. Confirm the GitHub Actions validation passes.
4. Complete `RELEASE_CHECKLIST.md` on the deployed HTTPS URL and iPhone Safari.
5. Keep status at **HOLD** until the both deployed browser gates are complete.

## Source and release truth

- `data/integration/source-authority-registry.v0.11.json` records what was adopted, partially adopted, gated or deferred from the other Project Cruise rooms.
- `CHANGELOG.md` summarizes the RC changes.
- `VALIDATION.md` contains the validation status.
- `docs/integration/08_CROSS_CHAT_RECONCILIATION_AND_RELEASE_HANDOFF.md` explains why unmounted upstream data was not silently recreated.

## Safety boundary

Weather is display-only. Place IDs and coordinates are never guessed. Walking endpoints never become driving waypoints. All overlays have rollback paths. An automated pass is not canonical approval.

---

# Project Cruise v0.10.0 — 現在の正本

このフォルダは、2026年8月1日時点で公開中の **Project Cruise v0.10.0** と、その内部データを独立JSON化した正本一式です。

## 現在の収録内容

| 内容 | 件数 |
|---|---:|
| 地点 | 320件 |
| 完成ルート | 181件 |
| 目的地直行候補 | 320件 |
| 選択可能な結果 | 501件 |

## ファイル構成

| ファイル | 役割 |
|---|---|
| `index.html` | 現在公開中のv0.10.0本体。GitHub Pagesへそのまま配置できる単一HTML版 |
| `destinations.json` | `index.html`から抽出した最新の地点320件 |
| `routes.json` | 完成ルート181件＋目的地直行候補320件を含む、最新の選択候補501件 |
| `project-cruise.json` | リリース情報・件数・出典・地点・ルートを1つにまとめた結合マスター |
| `VALIDATION.md` | JSON構文、ID、欠番、件数、既知事項、SHA-256の検証記録 |
| `README.md` | 本書。構成、更新履歴、運用ルールを記録 |
| `docs/RELEASE_README_v0.10.0.md` | 受領した公開版ZIPに入っていたREADMEの原本 |
| `docs/RELEASE_VALIDATION_v0.10.0.md` | 受領した公開版ZIPに入っていた検証記録の原本 |

## 正本の扱い

- **公開アプリの正本:** `index.html`
- **データ全体の正本:** `project-cruise.json`
- **用途別の分離データ:** `destinations.json` と `routes.json`
- このパッケージ作成時点では、3つのJSONと `index.html` 内の埋込配列は同一内容です。
- `routes.json` はルートだけでなく全選択候補を収録しています。完成ルートだけが必要な場合は、`candidateSource === "canonical_route"` または `R001〜R181` で抽出します。

## 公開方法

現在と同じ単一HTML構成で公開する場合は、GitHub Pages対象ブランチのルートへ `index.html` を配置します。JSONと文書も同じ場所へ置くと、GitHub上で正本を確認・引き継ぎやすくなります。

## 更新履歴

### 2026-08-01 — 正本パッケージ化

- 公開中のv0.10.0一式を基準に正本を確定
- `index.html` 埋込データから `destinations.json` と `routes.json` を機械抽出
- 結合マスター `project-cruise.json` を作成
- 件数、ID、欠番、構文、参照上の既知事項、SHA-256を検証

### 2026-07-31 — v0.10.0

- 320地点・181完成ルート・501結果のデータ基盤を維持
- Destination Value、Context Fit、Route Readinessを内部的に分離
- `verified_route`、`final_destination`、`rain_destination`、`waypoint`、`experimental_destination` の役割を追加
- 提案キャラクター表示、決定時間、再抽選回数を学習イベントへ追加
- 既存localStorage学習キーを維持

### 2026-07-31 — v29統合

- 地点をD001〜D320へ拡張
- 完成ルートをR001〜R181へ拡張
- 目的地直行候補を加え、選択可能な結果を501件へ拡張

## 今後の更新ルール

1. バージョン番号と更新日を先に決める。
2. `project-cruise.json` をデータ変更の基準にする。
3. 同じ内容から `destinations.json`、`routes.json`、`index.html` の埋込データを再生成する。
4. D/R/P-DのID重複と欠番、JSON/JavaScript構文、件数を検証する。
5. iPhone Safari、3つの時間枠、再抽選、Google Maps遷移、帰還評価、学習データ互換を確認する。
6. `README.md` と `VALIDATION.md` を更新し、検証済みZIPを新しい正本にする。

## 注意

営業時間、駐車条件、工事、臨時閉鎖などは変動します。各候補の確認日と公式情報を参照し、出発前に最新条件を再確認してください。
