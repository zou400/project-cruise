from pathlib import Path
root=Path(__file__).resolve().parents[1]
js=(root/'assets/js/cruise-v011.js').read_text(encoding='utf-8')
css=(root/'assets/css/cruise-v011.css').read_text(encoding='utf-8')
svg=(root/'assets/brand/project-cruise-mark-v2.svg')
checks={
 'brand_svg_exists':svg.is_file(),
 'brand_svg_is_used':'project-cruise-mark-v2.svg' in js,
 'old_top_right_copy_removed':'pc-brand-copy' not in js and '今夜の一本を、10秒で。' not in js,
 'warm_orange_palette':'--pc-hot:#e46643' in css and '#e56a43' in css,
 'brand_copy_hidden':'.pc-v011 .pc-brand-copy,.pc-v011 .pc-wordmark{display:none!important}' in css,
 'long_drive_note_wrap':'trip-estimate strong' in css and 'white-space:normal' in css,
 'dock_overlap_padding':'padding-bottom:max(142px' in css,
}
print({'release':'v0.11.0-rc6','checks':checks,'passed':all(checks.values())})
raise SystemExit(0 if all(checks.values()) else 1)
