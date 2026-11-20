# Phone ↔ laptop protocol (v1)

Plain HTTPS + JSON. The phone is the client, the laptop is the server.

Every request carries the shared secret:

```
X-Ultron-Token: <same value as ULTRON_TOKEN on the laptop>
```

A wrong or missing token gets `401`.

## `GET /ultron/ping`

Health check. The phone calls it on start, every 60 s, and from **Settings → Test connection**.

```json
{ "ok": true, "name": "Laptop Ultron", "version": "1.0" }
```

## `POST /ultron/command`

Request:

```json
{
  "text": "open spotify and play lofi",
  "source": "phone",
  "device": "<phone user agent>",
  "sent_at": "2026-11-20T17:30:00.000Z"
}
```

Response:

```json
{ "ok": true, "reply": "Playing lofi on Spotify." }
```

- `reply` is what the phone shows and speaks, so keep it short and spoken-style.
- If the laptop's handler throws, the bridge still answers `200` with `"ok": false` and the error in `reply`.
- The phone waits up to 25 s.

## When the phone sends commands

- **Brain = Claude:** Claude decides; it calls the `laptop_command` tool for anything that has to happen on the laptop, and the laptop's `reply` goes back to Claude.
- **Brain = Laptop:** every message goes straight to `/ultron/command`, so the laptop Ultron is the brain and the phone is its voice and screen.
- **Brain = Offline:** messages starting with "laptop …" or "tell laptop to …" are forwarded.

## Planned later (not built yet)

- Laptop → phone push (WebSocket `/ultron/ws`), so the laptop can ring the phone, send notifications, or hand off a task.
- Phone sending files/photos to the laptop.
