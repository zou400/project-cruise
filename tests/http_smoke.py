#!/usr/bin/env python3
from __future__ import annotations

import contextlib
import http.server
import json
import socket
import threading
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args) -> None:
        pass


def free_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def fetch(url: str) -> tuple[int, bytes, str]:
    with urllib.request.urlopen(url, timeout=5) as response:
        return response.status, response.read(), response.headers.get_content_type()


def main() -> int:
    port = free_port()
    handler = lambda *args, **kwargs: QuietHandler(*args, directory=str(ROOT), **kwargs)
    server = http.server.ThreadingHTTPServer(("127.0.0.1", port), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    time.sleep(0.1)

    required = {
        "index.html": "text/html",
        "project-cruise.json": "application/json",
        "assets/css/cruise-v011.css": "text/css",
        "assets/js/cruise-v011.js": "text/javascript",
        "assets/js/arrival/result-state-machine.js": "text/javascript",
        "assets/js/weather/weather-runtime.js": "text/javascript",
    }
    checks = []
    try:
        for relative, expected_type in required.items():
            status, body, content_type = fetch(f"http://127.0.0.1:{port}/{relative}")
            checks.append({
                "path": relative,
                "status": status,
                "bytes": len(body),
                "contentType": content_type,
                "passed": status == 200 and len(body) > 0 and (
                    content_type == expected_type
                    or (expected_type == "text/javascript" and content_type in {"text/javascript", "application/javascript"})
                ),
            })
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)

    passed = all(row["passed"] for row in checks)
    report = {"server": "python-http.server", "required": len(required), "passed": passed, "checks": checks}
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
