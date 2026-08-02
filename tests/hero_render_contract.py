from pathlib import Path
root=Path(__file__).resolve().parents[1]
js=(root/'assets/js/cruise-v011.js').read_text(encoding='utf-8')
css=(root/'assets/css/cruise-v011.css').read_text(encoding='utf-8')
idx=(root/'index.html').read_text(encoding='utf-8')
checks={
 'real_img_layer':'class="pc-scene-image"' in js,
 'no_automatic_save_data':'navigator.connection?.saveData' not in js,
 'high_priority':'image.fetchPriority = "high"' in js,
 'long_timeout':'setTimeout(() => resolve(false), 8000)' in js,
 'direct_load_fallback':'hero-precision-direct-load' in js,
 'image_css':'.pc-v011 .pc-scene-image{' in css,
 'loaded_class':'.pc-v011 .pc-scene-media.has-image .pc-scene-image' in css,
 'rc4_css_bust':'cruise-v011.css?v=0.11.0-rc6' in idx,
 'rc4_js_bust':'cruise-v011.js?v=0.11.0-rc6' in idx,
}
print(checks)
if not all(checks.values()): raise SystemExit(1)
