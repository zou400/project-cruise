# VALIDATION v0.10.4-rc1

## Static
- [x] destinations.json: 320件
- [x] routes.json: 501件（完成ルート181 + 直行候補320）
- [x] 既存IDを変更しない
- [x] Hero WebP: 30件
- [x] Hero manifest: 30件
- [x] index.html内蔵データ: 320 / 501
- [x] 既存localStorageキーを維持
- [x] Place ID・座標の推測値を追加しない

## Runtime smoke（外部APIをモックしたChromium検証）
- [x] Chromiumで初期表示
- [x] 90分抽選で結果表示
- [x] Hero画像のローカル読込
- [x] Weatherパネルのローディング表示
- [x] JavaScript pageerror 0件（ネットワーク依存APIの失敗はUIフォールバック）

## Blocking rules included
- D044: 予定退出が20:00を越える場合は対象外
- D103: 09:00–16:30外は対象外
- D048: 第2駐車場アンカー
- D114: 06:00–21:20内のアンカー
- D081: 22:00以降 rest_only
- D082: イベント規制優先の注意表示
- D062/D063: live closure/topology未接続につきfail-closed
- D038: 駐車アンカー未解決につきMaps候補外

## Manual before production
- [ ] iPhone Safari実機
- [ ] GitHub Pages相対パス
- [ ] Open-Meteo利用条件・表示帰属の本番確認
- [ ] Nominatim/OSRMの本番トラフィック方針
- [ ] ライブPA閉鎖・イベント・混雑の取得経路
- [ ] v0.11全アンカー/全ルート影響表の実ファイル統合

- Page error: 0
- Console error/warning: 0
- 抽選結果例: 北八朔公園 / Hero画像読込 / Weather OK / Operational panel表示
