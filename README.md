# Project Cruise GitHub Pages Prototype

大田区・蒲田周辺を起点にした「近くて濃い」ドライブ候補検索の静的プロトタイプです。

## データ
- 近距離コア地点: 93件
- 用途別近距離ルート: 45件
- 合法な路上短時間アクセス: 10件
- Excel正本: `Project_Cruise_合法路上駐車統合版.xlsx`

## GitHub Pages公開手順
1. ZIPを展開
2. 展開した中身をGitHubリポジトリ直下へアップロード
3. Settings → Pages
4. Source: Deploy from a branch
5. Branch: main / Folder: /(root)
6. Save

公開URL例:
`https://zou400.github.io/project-cruise/`

## 注意
`index.html`をPCで直接開くとJSONを読み込めない場合があります。GitHub Pages上では動作します。


## UI 0.3
一覧表示を廃止し、時間選択→ルートガチャ→Googleマップ起動の単一導線に変更。

## UI 0.4
- 行先カードとルート地図を同時表示
- OpenStreetMap + Leafletによるルートプレビュー
- 出発・経由地・目的地を色分け
- OSRMで道路ルートを取得し、線をアニメーション表示
- 地図クリックでGoogleマップへ移動
- スマホではカード→地図の縦並び
- 外部地図取得に失敗してもGoogleマップリンクは利用可能
