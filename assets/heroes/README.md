# Hero image intake

目的地専用画像は次の構造で追加します。

assets/heroes/<destination-slug>/
- hero-night.webp
- hero-evening.webp
- hero-day.webp
- hero-rain.webp
- hero.webp
- hero-manifest.json

app.jsの HERO_REGISTRY に目的地名とファイルパスを追加すると、
同じ目的地には同じ代表画像が表示されます。
専用画像がない目的地だけカテゴリ画像へフォールバックします。
