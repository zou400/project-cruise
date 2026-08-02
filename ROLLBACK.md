# ロールバック

## 表示機能だけを止める

公開URLの末尾に追加します。

- `?pcUi=classic` — v0.11 UIを外す
- `?pcVisual=off` — Hero画像処理を外す
- `?pcWeather=off` — 天気表示を外す
- `?pcOps=off` — Operational Overlayを外す
- `?pcArrival=off` — 到着・駐車場カードを外す

## GitHub Pagesを以前の版へ戻す

1. GitHubのCommitsを開く。
2. 公開前のv0.10.0コミットへ戻すか、v0.10.0一式を再アップロードする。
3. ActionsのPagesデプロイ完了を確認する。
4. 320地点・181完成ルート・501結果を再確認する。

基準ZIP：`Project_Cruise_Canonical_v0.10.0_2026-08-01(1).zip`

基準ZIP SHA-256：

`2023cd8b0691c628ed617359cc4b785a696b824483b5e4312e3cd99a36a54e3e`
