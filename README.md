# PROJECT CRUISE v0.12.3

iPhone実利用を最優先にしつつ、将来のSwiftUI / React Native移植に備えた版です。

## iPhone改善

- Heroを最初の画面の主役にするレイアウト
- 条件ボタンを横並び・横スクロール化
- Hero文章を3行に制限
- 画面下部に「このCruiseを受ける」「もう一本探す」を常設
- Drive Noteは展開状態
- CRUISE MAPは初期状態で折りたたみ
- iPhoneのSafe Areaに対応

## アプリ化準備

- PWA manifest
- Service Worker
- Apple Touch Icon
- ホーム画面追加・standalone表示
- 目的地Heroの独立レジストリ
- Proposal JSON Schema
- ネイティブ連携イベント
  - pc:proposal
  - pc:reroll
  - pc:maps

## データ

- 地点: 366
- 選択結果: 546
- 完成ルート: 181
- 評価質問: 未実装
- カーディーラー最終目的地ゲート: 維持

GitHub公開ルートへZIPの中身を全上書きしてください。

確認URL:
https://zou400.github.io/project-cruise/?v=01203
