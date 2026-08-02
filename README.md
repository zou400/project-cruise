# Project Cruise Integrated RC v0.10.4-rc1

GitHub Pagesへフォルダ内容をそのまま配置するための統合候補です。

## 基準
- 正本: `Project_Cruise_Canonical_v0.10.0_2026-08-01(1).zip`
- 基準件数: 320地点 / 181完成ルート / 501選択可能結果
- 正本JSONと既存IDは変更していません。
- 既存localStorageキー、再抽選、端末内学習、Google Maps遷移、帰還評価、不具合報告を維持しています。

## 今回の統合
1. スクリーンショットの方向性を基準にしたCinematic Polish UI
2. 30枚のローカルWebP体験イメージ（6カテゴリ、朝・昼・夜、履歴抑制）
3. 到着時天気のShadow表示（Open-Meteo、順位未反映、失敗時フォールバック）
4. Spot深化の非破壊Runtime Overlay（ハードゲート先行、駐車アンカー優先、Place ID推測禁止）
5. D048夜間P2、D044 20:00、D103 16:30、D114 21:20、D081 rest_only、D082イベント優先等のブロッキング方針
6. 徒歩終点D068は鳥居崎海浜公園側へ案内するルール

## 重要な境界
- 天気は現段階で表示のみ。推薦順位を変更しません。
- 動的なPA閉鎖、イベント入出庫禁止、満車信号はライブ取得未接続です。D062/D063は安全側で推薦対象外にしています。
- 画像は各目的地の実景写真ではなく、すべて `体験イメージ` です。
- 以前の別チャットで生成された画像バイナリそのものはこの実行環境に無かったため、GitHubで即動く30枚を今回ローカル生成しています。
- 現在公開中v0.10.3の実ファイルは取得できなかったため、正本v0.10.0の機能を土台にスクリーンショットの見た目を再構成しました。

## GitHub Pages
フォルダ内を丸ごとアップロードしてください。`index.html`だけでは画像が表示されません。

推奨ブランチ: `integration-v0.10.4-rc1`

推奨コミット:
```
Integrate cinematic UI, 30 hero visuals, weather shadow, and spot overlay
```

## テスト用URL
- `?visualTime=morning`
- `?visualTime=day`
- `?visualTime=night`

## ロールバック
`data/overlays/operational-overlay.v0.11-preview.json`は正本上書きではありません。公開前に旧ブランチを残し、問題時はGitHub Pagesの参照ブランチを戻してください。
