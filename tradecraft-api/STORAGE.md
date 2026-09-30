# Trade-shots storage setup

The `trade-shots` bucket holds trade screenshots as private objects at
`{user_id}/{trade_id|pending}/{entry|trade}/{filename}`. The API mints
short-lived signed URLs for upload (`POST /api/uploads/sign`) and read
(`GET /api/uploads/sign?path=…`) — nothing is ever public.

Until this setup runs, the uploads endpoints return
`500 { error: { code: "storage_misconfigured", … } }`.

## 1. Create the bucket (Dashboard → Storage → New bucket)

- Name: `trade-shots`
- **Private** (Public = off)

Or via SQL:

```sql
insert into storage.buckets (id, name, public)
values ('trade-shots', 'trade-shots', false)
on conflict (id) do nothing;
```

## 2. Storage RLS — owner-only on the `{user_id}/…` prefix

```sql
create policy "owner read trade-shots"
on storage.objects for select
using (
  bucket_id = 'trade-shots'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "owner write trade-shots"
on storage.objects for insert
with check (
  bucket_id = 'trade-shots'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "owner update trade-shots"
on storage.objects for update
using (
  bucket_id = 'trade-shots'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'trade-shots'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "owner delete trade-shots"
on storage.objects for delete
using (
  bucket_id = 'trade-shots'
  and (storage.foldername(name))[1] = auth.uid()::text
);
```

(The API uses the service-role key and bypasses these policies; they are
defense-in-depth for any anon-key access, matching the table RLS in API.md.)
