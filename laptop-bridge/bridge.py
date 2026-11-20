"""Ultron laptop bridge: lets the phone Ultron talk to the laptop Ultron.

Run on the laptop:
    pip install -r requirements.txt
    ULTRON_TOKEN=pick-a-long-secret python bridge.py

Then plug your existing laptop Ultron in by editing `handle_command` below
(or put a `handle_command(text: str) -> str` function in ultron_handler.py
next to this file and it will be used automatically).

Protocol: see PROTOCOL.md.
"""

from __future__ import annotations

import asyncio
import hmac
import importlib
import inspect
import logging
import os
import webbrowser
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

VERSION = "1.0"
NAME = os.environ.get("ULTRON_NAME", "Laptop Ultron")
TOKEN = os.environ.get("ULTRON_TOKEN", "")
HERE = Path(__file__).resolve().parent
PHONE_APP = HERE.parent / "ultron-phone"

log = logging.getLogger("ultron.bridge")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")


# ---------------------------------------------------------------------------
# Plug your laptop Ultron in here.
# ---------------------------------------------------------------------------

def default_handler(text: str) -> str:
    """Placeholder brain until the real laptop Ultron is connected.

    Replace this with a call into your laptop Ultron, for example:
        from my_ultron import ultron
        return ultron.handle(text)
    """
    t = text.strip().lower()
    if t in {"ping", "status", "are you there", "are you online"}:
        return f"{NAME} online. Time here is {datetime.now():%H:%M}."
    if t.startswith("open ") and ("." in t or t.startswith("open http")):
        url = text.strip()[5:].strip()
        if not url.startswith("http"):
            url = "https://" + url
        webbrowser.open(url)
        return f"Opened {url} on the laptop."
    return (
        f"Bridge received: \"{text}\". The laptop Ultron isn't plugged in yet; "
        "edit handle_command in laptop-bridge/bridge.py to connect it."
    )


def _load_handler():
    """Use ultron_handler.handle_command if the user provided one."""
    try:
        mod = importlib.import_module("ultron_handler")
        fn = getattr(mod, "handle_command")
        log.info("Using handle_command from ultron_handler.py")
        return fn
    except ModuleNotFoundError:
        return default_handler


handle_command = _load_handler()


async def run_handler(text: str) -> str:
    """Call the handler whether it is sync or async, without blocking the server."""
    if inspect.iscoroutinefunction(handle_command):
        result = await handle_command(text)
    else:
        result = await asyncio.to_thread(handle_command, text)
    return str(result)


# ---------------------------------------------------------------------------
# HTTP API
# ---------------------------------------------------------------------------

app = FastAPI(title="Ultron laptop bridge", version=VERSION)

# The phone app may be served from a different origin (GitHub Pages, etc.).
# The shared token, not the origin, is what protects these endpoints.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Ultron-Token"],
)


def check_token(token: str | None) -> None:
    if not TOKEN:
        raise HTTPException(500, "ULTRON_TOKEN is not set on the laptop.")
    if not token or not hmac.compare_digest(token, TOKEN):
        raise HTTPException(401, "Bad token.")


class Command(BaseModel):
    text: str
    source: str = "phone"
    device: str | None = None
    sent_at: str | None = None


@app.get("/ultron/ping")
async def ping(x_ultron_token: str | None = Header(default=None)):
    check_token(x_ultron_token)
    return {"ok": True, "name": NAME, "version": VERSION}


@app.post("/ultron/command")
async def command(cmd: Command, x_ultron_token: str | None = Header(default=None)):
    check_token(x_ultron_token)
    text = cmd.text.strip()
    if not text:
        raise HTTPException(400, "Empty command.")
    log.info("from %s: %s", cmd.source, text)
    try:
        reply = await run_handler(text)
    except Exception as exc:  # report handler failures to the phone instead of a bare 500
        log.exception("handler failed")
        return {"ok": False, "reply": f"Laptop Ultron hit an error: {exc}"}
    return {"ok": True, "reply": reply}


# Optional: serve the phone app from the laptop too (open https://<laptop>/app/ on the phone).
if PHONE_APP.is_dir():
    app.mount("/app", StaticFiles(directory=PHONE_APP, html=True), name="phone-app")


if __name__ == "__main__":
    import uvicorn

    if not TOKEN:
        raise SystemExit("Set ULTRON_TOKEN first, e.g.  ULTRON_TOKEN=some-long-secret python bridge.py")
    port = int(os.environ.get("ULTRON_PORT", "8765"))
    cert, key = os.environ.get("ULTRON_SSL_CERT"), os.environ.get("ULTRON_SSL_KEY")
    uvicorn.run(app, host="0.0.0.0", port=port, ssl_certfile=cert, ssl_keyfile=key)
