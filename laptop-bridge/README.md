# Ultron laptop bridge

A small server that runs on the laptop so the phone Ultron can send it commands.
Protocol: [PROTOCOL.md](PROTOCOL.md).

## Run it

```bash
cd laptop-bridge
pip install -r requirements.txt
ULTRON_TOKEN=pick-a-long-random-secret python bridge.py      # Windows PowerShell: $env:ULTRON_TOKEN="..."; python bridge.py
```

It listens on port 8765 (`ULTRON_PORT` to change). Check it: `curl -H "X-Ultron-Token: <token>" localhost:8765/ultron/ping`.

## Plug in your laptop Ultron

Until you connect it, the bridge answers with a placeholder. To connect, create `ultron_handler.py` next to `bridge.py`:

```python
# ultron_handler.py
from my_ultron import ultron   # however your laptop Ultron is imported

def handle_command(text: str) -> str:
    return ultron.handle(text)  # must return the reply as text
```

`handle_command` may be sync or `async`. Whatever it returns is shown and spoken on the phone.

## Let the phone reach it (https)

The phone app runs on https, so the laptop must be reachable over https too. Options:

- **Tailscale (recommended):** install on laptop + phone, then `tailscale serve --bg 8765`.
  Use `https://<laptop-name>.<tailnet>.ts.net` as the Laptop URL. Works from anywhere, nothing exposed to the internet.
  Bonus: the phone app is also served at `/app/` from the same address.
- **Cloudflare Tunnel:** `cloudflared tunnel --url http://localhost:8765` and use the https URL it prints (public, so keep the token long).
- **Own certificate:** set `ULTRON_SSL_CERT` and `ULTRON_SSL_KEY` to cert/key files.

On the phone: Settings → Laptop link → URL + the same token → **Test connection**. The dot in the header turns green.
