# Project Cruise v0.11.0-rc1

## 今回の公開目的

Cinematic UI、Destination Reveal、Hero Precision選択、到着時天気、駐車場・徒歩終点表示、Operational Hard Gateを、v0.10.0の320地点・181完成ルート・501結果へ非破壊で重ねた公開テスト版です。

## 主な変更

- 入力画面を圧縮し、右側をCinematic Stage化
- 結果画面の開発タグを削除
- 目的地名、Hero、到着情報を優先表示
- 320地点Visual Profileと501結果Hero Affinityを統合
- 到着エリアの予報を表示専用で統合
- 駐車場名、到着予定時刻、徒歩終点を明示
- 営業時間、車幅、閉鎖、退出余裕などのHard Gateを推薦前後で判定
- 不成立時の自動再選定をユーザー拒否学習から分離
- iPhone SafariのSafe Area、Dynamic Viewport、44pxタップ領域へ対応
- GitHub Actionsによる検証とPages自動公開を追加

## 維持したもの

- 320地点
- 181完成ルート
- 320直行候補
- 501選択可能結果
- 再抽選・端末学習
- Google Maps遷移
- 帰還評価
- 不具合報告
- 既存localStorageキー

## 未完了の外部ゲート

- 正確なHero WebP 30枚の実バイト投入
- 公開URL上のブラウザスモーク結果確認
- iPhone Safari実機QA

そのため、v0.11.0-rc1は公開試験可能ですが、v0.10.0に代わる正本昇格はまだHOLDです。
