# Project Cruise Cinematic Polish v0.10.3

Project Cruiseのデータ正本v0.10.0を維持したまま、Visual Revealを黒・白・赤基調のCinematic UIへ磨き込み、3D Aerial・MIDNIGHT NOIR・Decision Confidenceの安全な受け皿を追加した開発版です。

## 正本の区分

| 区分 | バージョン | 内容 |
|---|---|---|
| データ正本 | v0.10.0 | 320地点・181完成ルート・501結果 |
| 開発正本 | v0.10.3 | Cinematic Polish、3D Aerial受け皿、文章モード、学習schemaVersion 5 |

データJSONと`index.html`内の埋込データは変更していません。

## v0.10.3で実装した内容

- 1672×941のProject Cruise専用オリジナル画像4系統へ刷新
- 同一画像の分割・二重表示を廃止し、一枚の強いヒーロー画へ整理
- 黒・白・コーラルレッド中心のCinematic UI
- 「今夜の一本を開く → MISSION UNLOCKED → 出発」の10秒導線
- iPhone用の一列レイアウトと固定出発バー
- `CINEMATIC` / `MIDNIGHT NOIR` / `AUTO`文章モード
- `TRACE` / `STANDARD` / `DEEP`文章濃度
- Google Maps JavaScript API `maps3d`のオンデマンド3D Aerial表示
- 3D未設定・取得失敗時の既存2Dルート表示への安全なフォールバック
- 到着時天気・サーバー生成文章を受け取る任意エンドポイント
- Decision Confidenceによる学習影響と探索率の段階制御
- 理由なし再抽選・未出発・時間超過を長期的な「嫌い」として誤学習しない修正
- Leafletを同梱し、CDN障害に依存しない構成へ変更

## 収録データ

| 内容 | 件数 |
|---|---:|
| 地点 | 320件 |
| 完成ルート | 181件 |
| 目的地直行候補 | 320件 |
| 選択可能な結果 | 501件 |

## 主要ファイル

| ファイル | 役割 |
|---|---|
| `index.html` | GitHub Pagesへ配置するアプリ本体 |
| `runtime-config.js` | 3D・天気文章など任意連携の設定 |
| `destinations.json` | 地点320件 |
| `routes.json` | 完成ルート181件＋直行候補320件 |
| `project-cruise.json` | v0.10.0データ結合マスター |
| `assets/visuals/` | 新旧カテゴリ画像とマニフェスト |
| `assets/vendor/leaflet/` | 同梱した2D地図ライブラリ |
| `preview/` | デスクトップ・iPhone構図プレビュー |
| `tests/validate-release.mjs` | 件数・ID・機能マーカー・参照整合性検査 |
| `VALIDATION_v0.10.3.json` | 機械検査結果 |

## 任意連携

- Google Maps 3D: `docs/GOOGLE_MAPS_3D_SETUP.md`
- 到着時天気・AI文章: `docs/WEATHER_NARRATIVE_CONTRACT.md`

キーやエンドポイントを設定しなくても、従来の推薦・2D地図・Google Maps遷移・学習・帰還評価・不具合報告は動作します。

## 検証

```bash
node tests/validate-release.mjs
```

機械検査に加えてDOM操作スモークテストを実施しています。最終的なiPhone Safari表示、実キーによる3D、実天気エンドポイントはデプロイ後に確認してください。

## プレビュー

- `preview/Project_Cruise_v0.10.3_desktop-preview.png`
- `preview/Project_Cruise_v0.10.3_iPhone-preview.png`

プレビューは実装と同じ画像・色・階層を用いた構図確認用です。実ブラウザの最終スクリーンショットはデプロイ後に取得します。

## 既知の境界

- 3DはGoogle Maps Platformのブラウザ用APIキーと対象API設定が必要です。
- 3Dは利用者が`3D AERIAL`を押した時だけ読み込みます。
- 天気・AI認証情報を静的HTMLへ埋め込まず、サーバー側エンドポイント経由にします。
- 画像4枚はカテゴリ別の世界観画像であり、各目的地の正確な現況写真ではありません。
- 営業時間、駐車、工事、臨時閉鎖、道路規制は出発前に最新情報を確認してください。

## 更新履歴

### 2026-08-01 — v0.10.3

- Cinematic Polish
- オリジナル高解像度画像4系統
- 公式Google Maps 3D初期統合
- MIDNIGHT NOIR v0.2相当の文章制御
- Decision Confidence / schemaVersion 5
- 回帰検査とレイアウトプレビュー

### 2026-08-01 — v0.10.2.1

- Visual Reveal / MISSION UNLOCKED
- CRUISE ATLAS
- 長い目的地名・iPhone一列表示修正

### 2026-08-01 — v0.10.0データ正本

- 320地点・181完成ルート・501結果
- Context Engine、再抽選、端末内学習、Google Maps遷移、帰還評価、不具合報告
