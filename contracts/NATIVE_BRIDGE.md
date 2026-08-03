# Native bridge contract

Web版は将来のSwiftUI / React Native移植に備え、以下のCustomEventを発火します。

- `pc:proposal`
  - 新しい行き先を表示した時
  - `event.detail` は `proposal.schema.json` に準拠
- `pc:reroll`
  - 「もう一本探す」を押した時
- `pc:maps`
  - Google Mapsへ遷移する直前

ネイティブアプリでは同じデータ契約を使い、UIだけを置き換えます。
