# 07 — iPhone Safari・アクセシビリティ・表示性能の硬化

## 目的

v0.11.0-rc4をiPhone Safariで「10秒で一本を決める」操作に耐えるようにし、Coreの501結果・学習・Maps遷移へ触れずPresentation Overlayだけを硬化する。

## 実装

- `viewport-fit=cover`、`safe-area-inset-*`、`svh/dvh`でノッチ・Dynamic Island・ホームインジケータへ対応。
- 主要操作を44px以上、CTAを48〜60pxへ統一。
- 選択ボタンをARIA radioとして同期し、矢印・Home・Endキーで操作可能にした。
- スキップリンク、`:focus-visible`、status live region、ダイアログのフォーカストラップ・Escape終了・フォーカス復帰を実装。
- 既存HTMLにあった`return-title`重複IDを解消。
- iPhoneキーボード表示時にもダイアログをスクロールでき、フォーム拡大を避けるため入力文字を16px以上にした。
- 長い目的地名、駐車場名、天気・徒歩情報を狭幅で折り返す。
- Save-Data、`?pcData=low`、`prefers-reduced-data`ではHero画像探索と道路アニメーションを停止。
- `prefers-reduced-motion`、`prefers-reduced-transparency`を尊重。
- モバイルでは高コストな`backdrop-filter`と固定背景を抑制。
- Arrival／Weatherカードを正式にスタイルし、狭幅では1列化。

## 非変更領域

- 320地点、181完成ルート、501結果
- 選定スコア、学習キー、再抽選ロジック
- Operational Truth判定
- Google Maps URL生成
- Weatherの表示専用境界

## 検証

```bash
npm test
python3 scripts/audit_mobile_accessibility.py
python3 scripts/audit_release_candidate.py
```

静的・Node・HTTP監査はこの環境で実行する。実機固有のSafari挙動、位置情報許可UI、戻る操作、外部Maps遷移はGitHub Pages公開後の実機ゲートとして残す。
