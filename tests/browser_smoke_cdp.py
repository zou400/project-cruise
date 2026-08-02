#!/usr/bin/env python3
from __future__ import annotations
import base64
import json
import os
import shutil
import socket
import subprocess
import sys
import tempfile
import threading
import time
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import quote

import requests
import websocket

ROOT = Path(__file__).resolve().parents[1]
HOST = '127.0.0.1'
HTTP_PORT = 8765
DEBUG_PORT = 9222


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass


def wait_http(url: str, timeout: float = 12.0) -> None:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            if requests.get(url, timeout=.5).ok:
                return
        except Exception:
            time.sleep(.15)
    raise RuntimeError(f'timed out waiting for {url}')


class CDP:
    def __init__(self, ws_url: str):
        self.ws = websocket.create_connection(ws_url, timeout=8, origin='http://localhost')
        self.counter = 0
        self.events = []

    def command(self, method: str, params: dict | None = None):
        self.counter += 1
        ident = self.counter
        self.ws.send(json.dumps({'id': ident, 'method': method, 'params': params or {}}))
        while True:
            message = json.loads(self.ws.recv())
            if message.get('id') == ident:
                if 'error' in message:
                    raise RuntimeError(message['error'])
                return message.get('result', {})
            self.events.append(message)

    def evaluate(self, expression: str):
        result = self.command('Runtime.evaluate', {
            'expression': expression,
            'returnByValue': True,
            'awaitPromise': True,
        })
        if result.get('exceptionDetails'):
            raise RuntimeError(json.dumps(result['exceptionDetails'], ensure_ascii=False))
        return result.get('result', {}).get('value')

    def close(self):
        self.ws.close()


def capture(cdp: CDP, path: Path):
    result = cdp.command('Page.captureScreenshot', {'format': 'png', 'captureBeyondViewport': True})
    path.write_bytes(base64.b64decode(result['data']))


def main() -> int:
    os.chdir(ROOT)
    # Never leave stale screenshots that could be mistaken for a passing run.
    for stale in (ROOT / 'records/ui-smoke-desktop.png', ROOT / 'records/ui-smoke-mobile.png'):
        stale.unlink(missing_ok=True)
    server = ThreadingHTTPServer((HOST, HTTP_PORT), QuietHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()

    profile = tempfile.mkdtemp(prefix='pc-chrome-')
    chromium = shutil.which('chromium') or shutil.which('google-chrome')
    if not chromium:
        raise RuntimeError('Chromium not found')
    process = subprocess.Popen([
        chromium,
        '--headless=new',
        '--no-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--no-proxy-server',
        '--allow-file-access-from-files',
        '--remote-allow-origins=*',
        f'--remote-debugging-port={DEBUG_PORT}',
        f'--user-data-dir={profile}',
        'about:blank',
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    cdp = None
    try:
        wait_http(f'http://{HOST}:{DEBUG_PORT}/json/version')
        target_url = f'http://{HOST}:{HTTP_PORT}/index.html?weatherDemoState=live'
        targets = requests.get(f'http://{HOST}:{DEBUG_PORT}/json', timeout=3).json()
        target = next(item for item in targets if item.get('type') == 'page')
        cdp = CDP(target['webSocketDebuggerUrl'])
        cdp.command('Page.enable')
        cdp.command('Network.enable')
        cdp.command('Network.setBlockedURLs', {'urls': ['*unpkg.com*']})
        cdp.command('Runtime.enable')
        cdp.command('Log.enable')
        cdp.command('Emulation.setDeviceMetricsOverride', {
            'width': 1440, 'height': 1000, 'deviceScaleFactor': 1, 'mobile': False,
        })
        nav_result = cdp.command('Page.navigate', {'url': target_url})
        if nav_result.get('errorText') == 'net::ERR_BLOCKED_BY_ADMINISTRATOR':
            report = {
                'release': 'v0.11.0-rc3',
                'status': 'skipped',
                'reason': 'The current execution environment blocks Chromium navigation with ERR_BLOCKED_BY_ADMINISTRATOR.',
                'nextAction': 'Run this same test on GitHub Actions or a local browser-enabled environment.',
                'passed': None
            }
            (ROOT / 'records/browser-smoke.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
            print(json.dumps(report, ensure_ascii=False, indent=2))
            return 0
        if nav_result.get('errorText'):
            raise RuntimeError('navigation failed: ' + nav_result['errorText'])
        deadline = time.time() + 15
        while time.time() < deadline:
            ready = cdp.evaluate("document.readyState === 'complete' && !!document.querySelector('#draw')")
            if ready:
                break
            time.sleep(.25)
        else:
            debug = cdp.evaluate("({href:location.href,ready:document.readyState,title:document.title,html:document.documentElement.outerHTML.slice(0,500)})")
            raise RuntimeError('page did not expose #draw within 15 seconds: '+json.dumps(debug,ensure_ascii=False))
        time.sleep(.4)

        initial = cdp.evaluate('''(() => ({
          bodyClass: document.body.className,
          selectorEnhanced: !!document.querySelector('.pc-selector-controls'),
          heroExists: !!document.querySelector('#pc-scene-hero'),
          canonicalRoutes: (window.PROJECT_CRUISE_ROUTES || []).length,
          canonicalDestinations: (window.PROJECT_CRUISE_DESTINATIONS || []).length,
          drawLabel: document.querySelector('#draw')?.textContent.trim(),
          operationalAvailable: !!window.ProjectCruiseOperational,
          operationalOverlayCount: window.PROJECT_CRUISE_ARRIVAL_DATA?.overlay?.items?.length || 0,
          arrivalCardExists: !!document.querySelector('#pc-arrival-panel'),
          weatherCardExists: !!document.querySelector('#pc-weather-card')
        }))()''')

        cdp.evaluate('''(() => {
          window.renderMap = async () => null;
          document.querySelector('#draw').click();
          return true;
        })()''')
        time.sleep(1.4)

        result = cdp.evaluate('''(() => {
          const hero = document.querySelector('#pc-scene-hero');
          const result = document.querySelector('#result');
          const tags = document.querySelector('.result-top');
          return {
            resultVisible: !result.classList.contains('hidden'),
            destination: document.querySelector('#destination')?.textContent.trim(),
            heroDestination: hero?.querySelector('.pc-scene-destination')?.textContent.trim(),
            heroCategory: hero?.dataset.category,
            tagsHidden: tags ? getComputedStyle(tags).display === 'none' : false,
            mapsUrl: document.querySelector('#gmap')?.href || '',
            uiVersion: document.documentElement.dataset.pcUi || '',
            arrivalParking: document.querySelector('#pc-anchor-name')?.textContent.trim() || '',
            arrivalCopy: document.querySelector('#pc-anchor-copy')?.textContent.trim() || '',
            weatherTitle: document.querySelector('#pc-weather-title')?.textContent.trim() || '',
            weatherSummary: document.querySelector('#pc-weather-content strong')?.textContent.trim() || '',
            weatherSource: document.querySelector('#pc-weather-source')?.textContent.trim() || '',
            mapsDisabled: document.querySelector('#gmap')?.getAttribute('aria-disabled') === 'true',
            shadowVisible: /SHADOW|順位未反映/.test(document.body.innerText)
          };
        })()''')
        capture(cdp, ROOT / 'records/ui-smoke-desktop.png')

        # Mobile rendering of the same selected route.
        cdp.command('Emulation.setDeviceMetricsOverride', {
            'width': 390, 'height': 844, 'deviceScaleFactor': 2, 'mobile': True,
        })
        time.sleep(.4)
        capture(cdp, ROOT / 'records/ui-smoke-mobile.png')

        exceptions = []
        for event in cdp.events:
            if event.get('method') == 'Runtime.exceptionThrown':
                exceptions.append(event.get('params', {}).get('exceptionDetails', {}).get('text', 'exception'))

        checks = {
            'body_has_v011_class': 'pc-v011' in initial.get('bodyClass', ''),
            'selector_enhanced': bool(initial.get('selectorEnhanced')),
            'hero_exists_before_draw': bool(initial.get('heroExists')),
            'canonical_routes_501': initial.get('canonicalRoutes') == 501,
            'canonical_destinations_320': initial.get('canonicalDestinations') == 320,
            'draw_label_updated': initial.get('drawLabel') == '今夜の一本を開く',
            'operational_runtime_available': bool(initial.get('operationalAvailable')),
            'operational_overlay_15': initial.get('operationalOverlayCount') == 15,
            'arrival_card_exists': bool(initial.get('arrivalCardExists')),
            'weather_card_exists': bool(initial.get('weatherCardExists')),
            'result_visible_after_draw': bool(result.get('resultVisible')),
            'destination_populated': bool(result.get('destination')),
            'hero_matches_destination': result.get('heroDestination') == result.get('destination'),
            'development_tags_hidden': bool(result.get('tagsHidden')),
            'maps_state_resolved': result.get('mapsDisabled') or 'google.com/maps/dir/' in result.get('mapsUrl', ''),
            'arrival_parking_populated': bool(result.get('arrivalParking')),
            'arrival_copy_populated': bool(result.get('arrivalCopy')),
            'weather_arrival_heading': '到着' in result.get('weatherTitle', ''),
            'weather_demo_populated': bool(result.get('weatherSummary')),
            'weather_attribution_present': 'Open-Meteo' in result.get('weatherSource', ''),
            'no_shadow_or_rank_labels': not result.get('shadowVisible'),
            'ui_version_exposed': result.get('uiVersion') == 'v0.11.0-rc3',
            'no_runtime_exceptions_before_map_stub': len(exceptions) == 0,
        }
        report = {
            'release': 'v0.11.0-rc3',
            'initial': initial,
            'result': result,
            'exceptions': exceptions,
            'checks': checks,
            'passed': all(checks.values()),
            'screenshots': ['records/ui-smoke-desktop.png', 'records/ui-smoke-mobile.png']
        }
        (ROOT / 'records/browser-smoke.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 0 if report['passed'] else 1
    finally:
        if cdp:
            cdp.close()
        process.terminate()
        try:
            process.wait(timeout=3)
        except subprocess.TimeoutExpired:
            process.kill()
        server.shutdown()
        shutil.rmtree(profile, ignore_errors=True)


if __name__ == '__main__':
    raise SystemExit(main())
