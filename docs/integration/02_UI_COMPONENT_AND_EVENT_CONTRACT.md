# Project Cruise v0.11.0-rc1｜UIコンポーネント・イベント契約

## 1. この深化で固定した原則

v0.10.0の選定・学習・Google Maps・帰還評価・不具合報告を、UI刷新のために書き直さない。巨大な正本HTML内にあるデータと選定エンジンを **Core**、今回追加する表示層を **Presentation Overlay** として分離する。

- Coreの所有範囲：候補抽出、スコアリング、再抽選、学習、Maps URL、地図計算、帰還評価、不具合報告
- Overlayの所有範囲：ブランド、入力画面の圧縮、右側ビジュアルステージ、Destination Reveal、表示順、視覚表現
- Operational/Weatherの所有範囲：後続深化で追加する非破壊データ層
- 正本JSONの件数・ID・既存localStorageキーは変更しない

この境界により、UIに問題が出た場合は `?pcUi=classic` で正本表示へ即時復帰できる。

## 2. 実装ファイル

| ファイル | 役割 | 正本への影響 |
|---|---|---|
| `index.html` | CSS/JS読込みと2つのCustomEvent発火だけを追加 | 最小パッチ |
| `assets/css/cruise-v011.css` | Cinematic UIの全スタイル | Coreロジック非変更 |
| `assets/js/cruise-v011.js` | DOMを安全に拡張し、Heroを更新 | Coreロジック非変更 |
| `scripts/audit_ui_contract.py` | DOM契約・kill switch・依存関係を監査 | なし |

## 3. DOM契約

次のIDは正本エンジンが直接参照するため、名称変更・削除・重複を禁止する。

- 起点：`origin-current`, `origin-preset`, `origin-status`, `preset-origin-label`
- 時間：`.time-btn[data-time]`
- 抽選：`draw`
- 結果：`result`, `destination`, `title`, `intent`, `caution`, `waypoints`
- 出発：`gmap`, `map-link`
- 再抽選：`redraw`
- 地図：`map`, `map-status`
- 報告：`report-issue`, `issue-modal`, `issue-save`
- 学習：`learning-export`, `return-modal`, `reroll-modal`

Overlayは既存要素を削除せず、ラップ・追加・CSSによる並び替えだけを行う。

## 4. 追加コンポーネント

### `pc-brand-row`

CRUISEワードマーク、コピー、RC識別子を表示する。開発情報を画面の主役にしない。

### `pc-selector-controls`

既存の起点・時間・抽選ボタンを保持する。操作数は増やさず、CTAを「今夜の一本を開く」に統一する。

### `pc-preview-stage`

抽選前の右側ビジュアル領域。現在は軽量なCSS描画をフォールバックとし、Visual Library 30の素材接続後もDOMを変えない。

### `pc-scene-hero`

結果画面の最上段で目的地を公開する。画像がなくても成立し、画像がある場合のみ背景へ接続する。生成画像には必ず `体験イメージ` を表示する。

### 後続追加予定

- `pc-arrival-weather`：到着エリア基準の天気。順位・学習には不介入
- `pc-arrival-anchor`：選択された駐車場・徒歩終点・営業時間
- `pc-operational-notice`：ハードゲートや当日確認事項

## 5. CustomEvent契約

### `pc:route-shown`

目的地表示が完成し、地図計算を始める前に発火する。

```js
{
  route,              // 正本routeオブジェクト
  destination,        // 正本destinationオブジェクト。未取得時は {}
  selectedTime,       // "90" | "120" | "half"
  origin: {
    name,
    query,
    coords
  }
}
```

利用者：Hero、画像選択、Weather準備、Arrival Anchor解決、計測。

### `pc:route-estimate`

道路ルート計算後に発火する。失敗時は `routeData` が `null` になり得る。

```js
{
  route,
  routeData: {
    durationMinutes,
    distanceKm,
    geometry
  } | null,
  selectedTime,
  origin: { name, coords }
}
```

利用者：到着予定時刻、到着天気、駐車場営業時間判定。地図失敗は提案・Maps出発を止めない。

## 6. Feature Flags / Kill Switches

| Query | 動作 |
|---|---|
| `?pcUi=classic` | Cinematic Overlayを無効化 |
| `?pcVisual=off` | Hero画像だけ無効化。CSSフォールバックは維持 |
| `?visualTime=morning` | Visual Libraryの時間帯テスト |
| `?visualTime=day` | 同上 |
| `?visualTime=night` | 同上 |
| `?pcWeather=off` | 後続Weather統合で利用 |
| `?pcOps=off` | 後続Operational Overlayで利用 |

## 7. 画像選択契約

Visual Library 30の確定仕様に合わせ、次のカテゴリを使用する。

- `airport`
- `city`
- `culture`
- `industrial`
- `highway`
- `park`
- `water`

時間帯は `morning / day / night`。直近3枚を優先回避し、履歴は既存計画どおり `pcHeroHistoryV1` へ最大10件保存する。画像が未配置・読込失敗・`pcVisual=off` の場合もHeroはCSS背景で成立する。

## 8. UI状態遷移

```text
BOOT
  └─ READY（入力画面）
       ├─ ORIGIN_RESOLVING（現在地取得）
       │    ├─ READY
       │    └─ ORIGIN_ERROR → presetへ安全復帰可能
       └─ DRAW
            ├─ EMPTY_POOL → READY（既存警告）
            └─ ROUTE_SELECTED
                 ├─ DESTINATION_REVEAL
                 ├─ MAP_ESTIMATING（非同期）
                 ├─ WEATHER_LOADING（後続・非ブロッキング）
                 └─ RESULT_READY
                      ├─ MAPS_HANDOFF
                      ├─ REROLL
                      ├─ ISSUE_REPORT
                      └─ RETURN_FEEDBACK（次回訪問）
```

## 9. 表示上の確定事項

- 結果上部の `duration/theme/proposal-character` タグ群は通常表示から外す
- `SHADOW`、`順位未反映` など内部段階名をユーザーへ見せない
- 画像、目的地名、短い一文を第一階層に置く
- 詳細情報、天気、駐車場、地図を第二階層に置く
- Weatherは表示参考のみ。推薦順位・除外・学習に書き込まない
- Visualは体験演出であり、現地の記録写真とは表示しない

## 10. 次の深化への固定インターフェース

第3深化以降はCoreを直接触らず、`pc:route-shown` と `pc:route-estimate` を通して次のモジュールを接続する。

1. Visual Library 30マニフェスト
2. Weather display-only adapter
3. Weather Narrative deterministic subset
4. Arrival Anchor / Operational Overlay
5. UI表示順とレスポンシブQA
