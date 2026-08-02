from pathlib import Path
root=Path(__file__).resolve().parents[1]
js=(root/'assets/js/cruise-v011.js').read_text(encoding='utf-8')
css=(root/'assets/css/cruise-v011.css').read_text(encoding='utf-8')
idx=(root/'index.html').read_text(encoding='utf-8')
checks={
 'hero_targets_preview_stage':'const stage = $(".pc-preview-stage")' in js,
 'hero_not_prepended_to_result':'result.prepend(hero)' not in js,
 'preview_replaced_by_hero':'stage.replaceChildren(hero)' in js,
 'embedded_hero_css':'.pc-scene-hero--embedded' in css,
 'duplicate_result_hero_hidden':'.result-shell>.pc-scene-hero{display:none!important}' in css,
 'scrolls_to_compact_reveal':'document.querySelector("#pc-scene-hero")' in idx,
}
print({'release':'v0.11.0-rc6','checks':checks,'passed':all(checks.values())})
raise SystemExit(0 if all(checks.values()) else 1)
