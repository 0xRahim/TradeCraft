# TradeCraft API

Standalone backend for the TradeCraft frontend (`../tradecraft-ui`).
**Stack:** Vercel Serverless Functions (TypeScript, file-routed `/api/**/*.ts`).
**Database:** Supabase Postgres. **Binary store:** Supabase Storage bucket `trade-shots`.
**Auth:** Supabase Auth — every request carries the user's access token; the API
derives `user_id` exclusively from the verified token and scopes all queries to it.

Planned layout:

```txt
tradecraft-api/
  API.md
  package.json
  vercel.json
  api/
    trades.ts                  GET (list) / POST (create)
    trades/[id].ts             GET / PATCH / DELETE
    dashboard.ts               GET (aggregates)
    journal.ts                 GET ?month=
    journal/[date].ts          GET / PUT (day upsert)
    journal/[date]/files.ts    POST (create file)
    journal/[date]/files/[fileId].ts   PATCH / DELETE
    uploads/sign.ts            POST (signed upload URL)
  lib/
    supabase.ts                service-role admin client
    auth.ts                    requireUser(req) → userId
    validate.ts                body validators
    aggregate.ts               dashboard computations
```

## Environment

Server-only env vars (never exposed to the browser):

```txt
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<anon/public key, for self-service auth ops>
SUPABASE_SERVICE_ROLE_KEY=<service-role key>
FRONTEND_URL=https://<tradecraft-ui deployment>
```

Frontend env:

```txt
NEXT_PUBLIC_API_URL=https://<tradecraft-api deployment>
```

Local dev: `vercel dev` in this directory. Deps: `@supabase/supabase-js`.

## Conventions

* Base URL: `{API}/api`. JSON everywhere.
* Auth header: `Authorization: Bearer <supabase access token>`.
  `401 { error: { code: "unauthorized", message } }` when missing/invalid.
* Errors: `{ error: { code: string, message: string } }`
  (`bad_request` 400, `unauthorized` 401, `not_found` 404, `conflict` 409).
* List pagination: `?limit=` (default 100, max 500) `&offset=` (default 0).
  Response: `{ data: [...], total: number, limit: number, offset: number }`.
* Timestamps: ISO-8601 strings. Money/prices: JSON numbers, stored as
  `numeric(12,2)`.
* CORS: allow-all for local dev (`ALLOW_ALL` in `lib/cors.ts`).
  **TODO(production): flip back to the `FRONTEND_URL` allowlist before deploy.**
* The service-role key bypasses Postgres RLS, so **code scoping is the
  enforcement point**: every query includes `.eq("user_id", userId)`, and child
  tables are reached through a parent-ownership check. RLS stays enabled as
  defense-in-depth (policies below).

## Data model → table mapping

The frontend canonical shapes are `TradeRecord` (`tradecraft-ui/lib/dashboard/trade-record.ts`),
`ExecutionRow` (`execution-csv.ts`), `ShotRef` (`trade-record.ts`) and
`JournalDay/JournalFile` (`journal-store.ts`).

| Frontend | Table | Notes |
|---|---|---|
| `TradeRecord` (minus derived) | `trades` | One row per trade idea (one or many broker orders) |
| `TradeRecord.executions[]` | `trade_executions` | One row per broker order, reconciled by `(trade_id, broker_order_id)` |
| `TradeRecord.entryShots/tradeShots[]` | `trade_shots` | `kind = entry\|trade`; binary in Storage, row holds refs |
| `JournalDay` | `journal_days` | One row per `(user_id, day)` |
| `JournalFile` | `journal_files` | Markdown body per file |

Never stored (derived client-side): `thumb` SVG, captured-R, display labels,
win/loss tone. `source` is implicit (all API rows are user trades).

Field mapping (`TradeRecord` → `trades` columns): `pair→pair`,
`side→side`, `outcome→outcome`, `session→session`, `prevDay→prev_day`,
`h4Trend→h4_trend`, `phase→phase`, `model→model`,
`mechanicsContext→mechanics_context`, `entries→entries`,
`execType→exec_type`, `alignment→alignment`, `pois→pois`, `rr→rr`,
`rrCustom→rr_custom`, `riskPct→risk_pct`, `riskCustom→risk_custom`,
`tradeDate→trade_date`, `inducementTime→inducement_time`,
`entryTime→entry_time`, `exitTime→exit_time`, `openPrice→open_price`,
`slPrice→sl_price`, `closePrice→close_price`, `tpPrice→tp_price`,
`lots→lots`, `pips→pips`, `pipsPoints→pips_points`, `gross→gross`,
`swap→swap`, `commission→commission`, `net→net`, `validity→validity`,
`psychTags→psych_tags`, `psychNote→psych_note`, `notes→notes`,
`orderIds→order_ids`, `createdAt→created_at` (server default when absent).

## Postgres schema (Supabase SQL editor)

```sql
-- ---------- trades ----------
create table public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pair text not null,
  side text not null check (side in ('long', 'short')),
  outcome text not null check (outcome in ('TP', 'SL', 'BE')),
  session text not null default '',
  prev_day text not null default '',
  h4_trend text not null default '',
  phase text not null default '',
  model text not null default '',
  mechanics_context text not null default '',
  entries text[] not null default '{}',
  exec_type text not null default '',
  alignment text not null default '',
  pois text[] not null default '{}',
  rr text not null default '',
  rr_custom text not null default '',
  risk_pct text not null default '',
  risk_custom text not null default '',
  trade_date date,
  inducement_time text not null default '',
  entry_time text not null default '',
  exit_time text not null default '',
  open_price numeric(12,2) not null default 0,
  sl_price numeric(12,2) not null default 0,
  close_price numeric(12,2) not null default 0,
  tp_price numeric(12,2) not null default 0,
  lots numeric(12,2) not null default 0,
  pips numeric(12,2) not null default 0,
  pips_points boolean not null default false,
  gross numeric(12,2) not null default 0,
  swap numeric(12,2) not null default 0,
  commission numeric(12,2) not null default 0,
  net numeric(12,2) not null default 0,
  validity text not null default '' check (validity in ('', 'valid', 'invalid')),
  psych_tags text[] not null default '{}',
  psych_note text not null default '',
  notes text not null default '',
  order_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index trades_user_date_idx on public.trades (user_id, trade_date desc);

-- ---------- trade_executions ----------
create table public.trade_executions (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid not null references public.trades (id) on delete cascade,
  broker_order_id text not null,
  symbol text not null default '',
  side text not null default '',
  open_time text not null default '',
  close_time text not null default '',
  volume numeric(12,2) not null default 0,
  open_price numeric(12,2) not null default 0,
  close_price numeric(12,2) not null default 0,
  stop_loss numeric(12,2) not null default 0,
  take_profit numeric(12,2) not null default 0,
  swap numeric(12,2) not null default 0,
  commission numeric(12,2) not null default 0,
  profit numeric(12,2) not null default 0,
  reason text not null default '',
  unique (trade_id, broker_order_id)
);
create index trade_executions_trade_idx on public.trade_executions (trade_id);

-- ---------- trade_shots ----------
create table public.trade_shots (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid not null references public.trades (id) on delete cascade,
  kind text not null check (kind in ('entry', 'trade')),
  name text not null,
  storage_path text,
  src_url text,
  tv_url text,
  created_at timestamptz not null default now()
);
create index trade_shots_trade_idx on public.trade_shots (trade_id);

-- ---------- journal ----------
create table public.journal_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  grade integer check (grade is null or (grade >= 1 and grade <= 10)),
  status text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, day)
);
create index journal_days_user_day_idx on public.journal_days (user_id, day desc);

create table public.journal_files (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.journal_days (id) on delete cascade,
  name text not null,
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index journal_files_day_idx on public.journal_files (day_id);

-- ---------- RLS (defense-in-depth; service role bypasses, code scoping enforces) ----------
alter table public.trades enable row level security;
alter table public.trade_executions enable row level security;
alter table public.trade_shots enable row level security;
alter table public.journal_days enable row level security;
alter table public.journal_files enable row level security;

create policy "owner all trades" on public.trades
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner executions" on public.trade_executions
  for all using (exists (
    select 1 from public.trades t
    where t.id = trade_executions.trade_id and t.user_id = auth.uid()
  )) with check (exists (
    select 1 from public.trades t
    where t.id = trade_executions.trade_id and t.user_id = auth.uid()
  ));
create policy "owner shots" on public.trade_shots
  for all using (exists (
    select 1 from public.trades t
    where t.id = trade_shots.trade_id and t.user_id = auth.uid()
  )) with check (exists (
    select 1 from public.trades t
    where t.id = trade_shots.trade_id and t.user_id = auth.uid()
  ));
create policy "owner journal days" on public.journal_days
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner journal files" on public.journal_files
  for all using (exists (
    select 1 from public.journal_days d
    where d.id = journal_files.day_id and d.user_id = auth.uid()
  )) with check (exists (
    select 1 from public.journal_days d
    where d.id = journal_files.day_id and d.user_id = auth.uid()
  ));
```

Storage (Dashboard → SQL editor → Storage, or API):

* Private bucket **`trade-shots`**, object path
  `{user_id}/{trade_id}/{kind}/{filename}` (`kind = entry|trade`).
* Storage RLS: owner-only insert/select/delete on that prefix
  (e.g. `bucket_id = 'trade-shots' and (storage.foldername(name))[1] = auth.uid()::text`).

## Endpoints

### Trades

**`GET /api/trades`** — list the caller's trades, newest first.
Query: `status=TP|SL|BE`, `model=`, `pair=`, `session=`, `q=` (pair/model
ilike), `sort=date|pair|model|r|net`, `dir=asc|desc`, `limit`, `offset`.
Response `200`:

```json
{
  "data": [
    {
      "id": "uuid",
      "pair": "GBPUSD", "side": "long", "outcome": "SL",
      "session": "newyork", "model": "london-reversal",
      "entries": ["m5-engulf"], "tradeDate": "2026-09-29",
      "entryTime": "14:06", "net": -103.55, "lots": 1.39,
      "executions": [
        { "id": "uuid", "brokerOrderId": "W2673…", "symbol": "GBPUSD",
          "side": "BUY", "volume": 0.7, "openPrice": 1.32284,
          "closePrice": 1.3221, "stopLoss": 1.32213, "takeProfit": 1.32498,
          "swap": 0, "commission": 0, "profit": -51.8, "reason": "SL",
          "openTime": "29/09/2026 14:06:50", "closeTime": "29/09/2026 14:38:17" }
      ],
      "entryShots": [], "tradeShots": [],
      "createdAt": "2026-09-29T…"
    }
  ],
  "total": 1, "limit": 100, "offset": 0
}
```

(Full `TradeRecord` field set; camelCase over the wire, snake_case in DB —
see mapping table above. `thumb` omitted; the frontend regenerates it.)

**`POST /api/trades`** — create. Body = the frontend `NewTradeDraft` shape
(all entry-form fields) plus `executions: ExecutionRow[]` and
`entryShots/tradeShots: [{ name, storagePath?, srcUrl?, tvUrl? }]`.
Server: insert `trades` row (`user_id` from token), bulk-insert executions +
shots. `409` on duplicate `(trade_id, broker_order_id)` — treat as reconcile,
not error, when the client retries a save. Response `201`: created `TradeRecord` JSON.

**`GET /api/trades/[id]`** — `200` record JSON or `404`.

**`PATCH /api/trades/[id]`** — full-draft replace semantics (same body as
POST). Server reconciles children: executions upserted by
`(trade_id, broker_order_id)` with rows absent from the payload deleted; shots
upserted by `id` (new rows without `id` get one), removed refs deleted **and**
their `storage_path` objects removed from the bucket. Response `200` record JSON.

**`DELETE /api/trades/[id]`** — deletes the trade (executions + shots cascade;
function also removes their storage objects). `204` empty.

### Dashboard

**`GET /api/dashboard?period=7|30|60|90|180&month=YYYY-MM`** — aggregates over
the caller's trades (`trade_date` within the trailing `period` days; calendar
uses `month`, default current). `200`:

```json
{
  "period": 30,
  "kpis": [
    { "label": "Net P&L", "value": "+$2,905.00", "tone": "profit",
      "delta": "+8.4%", "vs": "vs previous 30 days" },
    { "label": "Win rate", "value": "61.5%", "tone": "",
      "delta": "+2.3%", "vs": "vs previous 30 days" },
    { "label": "Trades", "value": "44", "tone": "",
      "delta": "+5", "vs": "vs previous 30 days" },
    { "label": "Average R:R", "value": "1:2.24", "tone": "",
      "delta": "+0.11R", "vs": "vs previous 30 days" }
  ],
  "equity": [{ "label": "Sep 7", "value": 36100.0 }],
  "calendar": { "month": "2026-09", "total": 2905,
    "wins": 14, "losses": 14, "best": 780,
    "days": [{ "date": "2026-09-02", "pnl": 240 }] },
  "tradeModels": [{ "name": "London reversal", "count": 13 }],
  "entryModels": [{ "name": "BOS", "count": 14 }],
  "sessions": {
    "hours": [{ "h": 0, "london": 0, "frankfurt": 0, "newyork": 0 }],
    "london": 17, "frankfurt": 9, "newyork": 27
  },
  "radar": [
    { "axis": "Consistency", "score": 70 },
    { "axis": "Win rate", "score": 62 },
    { "axis": "Risk-reward", "score": 75 },
    { "axis": "Frequency", "score": 50 }
  ],
  "tradeCount": 44
}
```

Rules (implemented in `lib/aggregate.ts` — the frontend has no real
aggregation logic, only demo seeds, so these formulas are the contract):

* Scope: rows with a `trade_date` inside the trailing `period`-day window
  (UTC dates, inclusive). Rows without a date are excluded from metrics
  but still appear in the trade log.
* Win rate = `TP/(TP+SL)` as `%` with 1 decimal (BE excluded from the
  denominator; `invalid` validity **included**; empty window → `0.0%`).
* Net = `sum(net)` formatted as signed USD (`+$2,905.00`); tone `profit`
  when `>= 0` else `loss`.
* Average R:R = mean captured-R over window trades (`1:2.24`, 2 decimals).
  Captured-R per trade: `rrCustom` when `rr = custom`, else the `rr` preset;
  `SL → -1`, `BE → 0`.
* Equity = cumulative net per `trade_date` ascending, anchored at `?anchor=`
  (default `0`); labels like `Sep 7` (UTC).
* Calendar groups the `month` param's trades by date: `{total, wins, losses,
  best, days: [{date, pnl}]}` (only dates with trades; `best = 0` when empty).
* `tradeModels`/`entryModels`: **raw stored values** with counts, desc
  (the UI maps display labels via `modelLabel()`/`entryLabels()`).
* `sessions`: totals for `london`/`frankfurt`/`newyork` plus 24 `hours`
  derived from `entryTime` (`HH:MM`; windows L 7–15, F 6–13, NY 12–20).
  Other session values stay in `tradeCount` only.
* Radar (heuristic): Consistency = green-day ratio × 100; Win rate;
  Risk-reward = avgR/3 × 100; Frequency = trades/period × 50 — all rounded,
  clamped 0–100.
* Deltas compare against the preceding equal-length window (win-rate in
  percentage points, trades as signed int, avg-R as signed `R`, net as %).

### Journal

**`GET /api/journal?month=YYYY-MM`** — `{ "days": { "2026-09-29":
{ "grade": null, "status": "pending", "files": [{ "id", "name" }] } } }`
(bodies excluded; month default = current).

**`GET /api/journal/[date]`** — day with file bodies:
`{ "date", "grade", "status", "files": [{ "id", "name", "body" }] }`
(`404` when the day has never been touched — the frontend falls back to empty).

**`PUT /api/journal/[date]`** — upsert `{ grade: 1..10|null, status }`.
`200` day JSON.

**`POST /api/journal/[date]/files`** — `{ name, body }` → `201` file JSON
(auto-creates the day row). **`PATCH /api/journal/[date]/files/[fileId]`** —
rename/edit. **`DELETE …`** — `204`.

### Uploads

**`POST /api/uploads/sign`** — body
`{ "tradeId": "uuid|null", "kind": "entry|trade", "filename": "…png",
"contentType": "image/png" }`.
Server (service role): `createSignedUploadUrl("trade-shots", path, …)` where
`path = {user_id}/{tradeId ?? "pending"}/{kind}/{safe filename}`.
Response `200`: `{ "path": "…", "signedUrl": "…", "token": "…" }`.
Client `PUT`s the bytes to `signedUrl`, then references `path` as
`storagePath` in the trade POST/PATCH. Serving: the frontend requests
short-lived signed read URLs via `GET /api/uploads/sign?path=…`
(same function, method-switched) — the bucket stays private; `storage_path`
is never a public URL. TradingView/external images keep working as
`srcUrl`/`tvUrl` with no upload step. Bucket setup lives in `STORAGE.md`
(the endpoints return `500 storage_misconfigured` until the private
`trade-shots` bucket exists).

## Frontend integration (later step, in `tradecraft-ui`)

* `lib/api-client.ts`: typed wrapper over `NEXT_PUBLIC_API_URL`
  (attaches the Supabase session access token, throws the error envelope).
* `trade-store.ts` / `journal-store.ts`: remote-first loaders with the current
  localStorage logic kept as offline fallback; `trades/new` save becomes
  upload-then-POST; dashboard view swaps `dashboard-data.ts` getters for
  `GET /api/dashboard` (seeded getters remain as the empty-state fallback).
* Supabase Auth UI/session handling in the frontend is a prerequisite
  (currently none exists) — login/signup pages issue the tokens this API consumes.

## Migration

* On first authenticated load the frontend POSTs each localStorage draft
  (`u-*` ids are replaced by server uuids; `createdAt` preserved), then clears
  the local keys. Journal: PUT each dirty day + POST its files.
* Demo `d-*` trades and the journal seed never leave the browser.
* Backfill for anyone who saved before `executions` were persisted: rows
  without executions render from order IDs (existing fallback).
