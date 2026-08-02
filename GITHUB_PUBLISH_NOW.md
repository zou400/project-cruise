# GitHubへアップロードして公開する手順

このZIPは **Project Cruise v0.11.0-rc1の公開テスト版**です。ZIPファイルそのものではなく、**ZIPを展開して、中にあるファイルとフォルダをリポジトリ直下へアップロード**してください。

## 最短手順

1. GitHubで新しいリポジトリを作成するか、テスト用リポジトリを開く。
2. ZIPを展開する。
3. 展開したフォルダ内のすべてを、GitHubの **Add file → Upload files** でアップロードする。
4. `Commit changes`を押す。ブランチ名は`main`を推奨。
5. **Actions**タブで次の2つを確認する。
   - `Validate Project Cruise RC`
   - `Deploy Project Cruise RC to GitHub Pages`
6. **Settings → Pages**を開き、Sourceを **GitHub Actions** にする。
7. Actionsのデプロイ完了後、表示されたURLを開く。

## 最初に確認する画面

- 通常画面：公開URLそのまま
- 旧UIへの緊急切替：`?pcUi=classic`
- Hero停止：`?pcVisual=off`
- 天気停止：`?pcWeather=off`
- Operational Overlay停止：`?pcOps=off`
- 到着カード停止：`?pcArrival=off`
- Visual QA：`visual-qa.html`

## 公開直後の確認

1. 90分、2時間、半日の3枠で一本ずつ開く。
2. 再抽選する。
3. Google Mapsが開くことを確認する。
4. 到着時天気が失敗しても推薦とMapsが止まらないことを確認する。
5. iPhone Safariで、縦画面・位置情報許可・位置情報拒否を確認する。
6. Actionsが赤くなった場合は、公開を正本へ昇格せず、ログを保存する。

## 現在の重要な状態

- 320地点、181完成ルート、501結果は維持。
- 自動テストはPASS。
- 正確なHero WebP 30枚は、このパッケージには未投入。
- 未投入中はCSSのシネマティック背景で動作する。
- この公開は **RCの実機試験**。既存のv0.10.0正本は別に保持する。

詳しい手順は`DEPLOYMENT.md`、確認項目は`RELEASE_CHECKLIST.md`を参照してください。
