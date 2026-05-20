# APEX API

FastAPI service that exposes FastF1 telemetry as JSON for the APEX frontend.

## Setup

```powershell
D:\F1\.venv\Scripts\python.exe -m pip install -r D:\F1\apex\api\requirements.txt
```

The service reuses the existing `D:\F1\fastf1_cache\` directory so cold pulls
populate the same cache the bake script uses.

## Run

From `D:\F1`:

```powershell
D:\F1\.venv\Scripts\python.exe -m uvicorn apex.api.main:app --reload --port 8000
```

## Endpoints

| Method | Path | Notes |
|---|---|---|
| GET | `/api/health` | liveness |
| GET | `/api/seasons` | list of years FastF1 covers (2018+) |
| GET | `/api/seasons/{year}` | round-by-round schedule for one season |
| GET | `/api/laps/{year}/{event}/{driver}/{session}` | fastest lap of that driver in that session |
| GET | `/api/live/next-session` | next session worldwide via OpenF1 |

### Examples

```
GET /api/laps/2020/british-grand-prix/HAM/Q
GET /api/laps/2024/monaco-grand-prix/LEC/Q
GET /api/seasons/2024
```

`event` accepts dashes or underscores in place of spaces.
`session` is `Q`, `R`, `S` (sprint), `SQ` (sprint quali), `FP1`, `FP2`, or `FP3`.

The payload schema matches `apex/public/laps/*.json` exactly — see
`lap_payload.py` for the builder.
