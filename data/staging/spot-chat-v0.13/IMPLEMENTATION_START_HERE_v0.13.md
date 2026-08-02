# IMPLEMENTATION START HERE — Spot Chat v0.13

このパッケージは探索ラウンド1/3の成果です。まだ正本へ直接追加しません。

## 最初に行う処理

1. `new-destination-candidates-batch2.v0.13.json` の22件についてRoutes APIで蒲田起点距離を確定。
2. `wide-vehicle-compatibility-batch2.v0.13.json` の未確認項目を解決。
3. `staging-promotion-plan.v0.13.json` のA/B/C/D分類を更新。
4. Round 2、Round 3完了後にD321以降を一括採番。

## GitHub実装の安全条件

- mainへ直接上書きしない。
- `feat/destination-breadth-v0.13`相当のブランチまたはRCで試す。
- `pcBreadth`と`pcNewDestinations`のfeature flagを持たせる。
- 既存320地点、181ルート、501結果、localStorage学習履歴を変更しない。
- 新規地点をoffにすれば既存RCへ即時復帰できること。

## 受け入れ基準

`acceptance-tests.v0.13.json` の18件を全PASSし、
iPhone Safariで50回再抽選してカテゴリの偏りと同一地点再出現を確認する。
