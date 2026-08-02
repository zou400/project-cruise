# Project Cruise v0.11.0-rc5

## Hero display reliability fix

- Render Hero assets as a real `<img>` layer instead of relying only on a CSS custom-property background.
- Do not silently disable Hero images from the browser `saveData` hint. Only explicit `?pcData=low` disables them.
- Raise Hero preload priority and extend the availability timeout from 0.9s to 8s.
- Directly attempt the selected Hero path even when preload probing times out.
- Cache-bust CSS, runtime JavaScript and Hero image URLs for GitHub Pages.
- Keep the exact 30 WebP assets, reroll diversity and mobile decision dock from rc3.
