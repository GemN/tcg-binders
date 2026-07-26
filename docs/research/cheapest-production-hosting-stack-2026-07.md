# Cheapest production hosting stack

Verified against the repository and first-party pricing/documentation on
2026-07-26. Prices exclude VAT, domain registration, and optional paid support
unless stated otherwise.

## Recommendation

The cheapest production-capable stack for the project **as it exists today** is:

| Concern | Service | Idle / small-production cost |
| --- | --- | ---: |
| React/Vite frontend | Cloudflare Pages Free | $0 |
| Supabase-compatible API, Auth, PostgreSQL, `pg_graphql` | Self-hosted Supabase Docker on one Hetzner CX23 in Germany/Finland | $6.49/month |
| Public IPv4 | Hetzner Primary IPv4 | $0.60/month |
| Graphile Worker | Run on the same CX23 | $0 incremental |
| TLS/reverse proxy | Caddy or Nginx on the same CX23 | $0 incremental |
| Off-site PostgreSQL dumps | Cloudflare R2 Standard, while under its free allowance | $0 |
| Transactional email | Amazon SES | approximately $0 at low volume |
| **Bare minimum total** |  | **about $7.09/month** |
| Hetzner daily whole-server backups, recommended in addition to off-site database dumps | 20% of the server price | about $1.30/month |
| **Total with Hetzner backups** |  | **about $8.39/month** |

The CX23 has 2 shared x86 vCPUs, 4 GB RAM, and 40 GB SSD. Its post-15-June-2026
price is €5.49/$6.49 per month excluding IPv4; Hetzner charges €0.50/$0.60 for a
Primary IPv4. Hetzner's backup add-on costs 20% of the instance price and keeps
seven daily server backups.
([Hetzner June 2026 prices](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/),
[CX23 specifications](https://www.hetzner.com/cloud/cost-optimized),
[Primary IP prices](https://docs.hetzner.com/cloud/servers/primary-ips/overview/),
[backup billing](https://docs.hetzner.com/cloud/billing/faq/))

This is the lowest price I would call production-capable, but it is a
**single-server, self-managed** production stack. There is no high availability,
and the operator owns patching, hardening, monitoring, database maintenance,
backups, restore testing, and disaster recovery. Supabase explicitly assigns all
of those responsibilities to the operator when self-hosting.
([Supabase self-hosting responsibilities](https://supabase.com/docs/guides/self-hosting))

For more comfortable headroom, use a Hetzner CX33 instead: 4 shared vCPUs, 8 GB
RAM, and 80 GB SSD for $9.99/month, or approximately **$12.59/month** including
IPv4 and the 20% Hetzner backup add-on. This matches Supabase's recommended
8 GB+/4-core+/80 GB+ profile, whereas CX23 only meets the documented minimum of
4 GB/2 cores/40 GB for small-to-medium production workloads.
([Supabase Docker system requirements](https://supabase.com/docs/guides/self-hosting/docker),
[Hetzner June 2026 prices](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/))

## Why a $0 stack does not fit this repository unchanged

Supabase Free includes only a 500 MB database. It may also pause a project after
one week of low activity and does not include downloadable managed backups.
([Supabase pricing](https://supabase.com/pricing),
[free-project pausing](https://supabase.com/docs/guides/platform/free-project-pausing),
[database backups](https://supabase.com/docs/guides/platform/backups))

The currently running local database was measured as follows:

```text
database_size: 585 MB

largest relations:
card_market_prices  261 MB
cards               192 MB
mtg_card_details    116 MB
```

This was measured with:

```sh
psql postgresql://postgres:postgres@127.0.0.1:55322/postgres \
  -c "select pg_size_pretty(pg_database_size(current_database()));"
```

The catalog is already **over the Supabase Free database allowance before
meaningful user growth**. (PostgreSQL and Supabase display/storage units should
not be subtracted as if they were necessarily identical.) The size is not
incidental user/test data: the three dominant relations are populated by the
daily full MTG catalog import. The worker downloads and decompresses five
MTGJSON CSV files, imports them with PostgreSQL `COPY`, and refreshes card,
price, identifier, and purchase URL data.
([worker catalog sync](../../@app/worker/src/mtg_catalog.ts),
[catalog importer](../../scripts/import-mtg-catalog.sql),
[daily worker schedule](../../@app/worker/crontab))

Therefore, “Cloudflare Pages + Supabase Free” is useful only if the catalog
schema/data is substantially reduced. It is not a viable host for the unchanged
application.

## Why this architecture fits the code

The repository does not contain a conventional Node web API. The browser talks
directly to Supabase Auth and `${VITE_SUPABASE_URL}/graphql/v1`; the database
schema depends on `auth.users`, RLS, `auth.uid()`, and `pg_graphql`.
([Supabase client](../../@app/client/src/lib/supabase.ts),
[Apollo endpoint](../../@app/client/src/lib/apollo.ts),
[initial schema](../../@app/supabase/migrations/20260617000000_initial.sql))

The deployable parts are:

1. A static Vite build from `@app/client`.
2. Supabase Auth, PostgreSQL, `pg_graphql`, PostgREST, and the Supabase API
   gateway.
3. One continuously polling Graphile Worker with concurrency `1`.
4. Amazon SES for production email.

([root stack description](../../README.md),
[worker package](../../@app/worker/package.json),
[worker configuration](../../@app/worker/graphile.config.js),
[production email transport](../../@app/worker/src/transport.ts))

The repository does not currently include a production Dockerfile, Compose
deployment, Fly configuration, Render Blueprint, or equivalent infrastructure
manifest. The prices below are infrastructure costs, not an assertion that
deployment is already configured.

The client does not currently call Supabase Storage, Realtime, or Edge
Functions. Those services, plus Studio and development-only Inbucket, can be
omitted from a lean production Compose deployment. Supabase documents that
unused Realtime, Storage, imgproxy, and Edge Runtime services can be removed to
reduce resource requirements.
([Supabase Docker guide](https://supabase.com/docs/guides/self-hosting/docker))

As an empirical check, the full local Supabase stack currently uses about
1.8 GiB resident memory at idle before the separate worker. That makes 4 GB
plausible for a carefully pruned low-traffic setup, but the daily catalog import
is a resource spike and must be tested under the VPS limits before launch.

Cloudflare Pages is a good $0 frontend host because static asset requests are
free and unlimited. The Free plan allows 500 builds/month, 20,000 files/site,
and 25 MiB per file, all well beyond this Vite application's present shape.
([Cloudflare Workers/Pages pricing](https://developers.cloudflare.com/workers/platform/pricing/),
[Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/))

Cloudflare R2's Standard class includes 10 GB-month storage, one million Class A
operations, ten million Class B operations, and free egress each month. That is
enough for a small rolling set of encrypted PostgreSQL dumps at no charge. It
does not create or schedule the dumps; backup automation and restore tests
remain operational work.
([Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/))

The existing worker sends through Amazon SES. Low-volume email is negligible
relative to compute: SES à-la-carte outbound mail is $0.10 per 1,000 messages
plus $0.12/GB of message data. Since 2026-07-21, new SES accounts start on the
Essentials plan, whose first tier is $0.16 per 1,000 messages; AWS says an
account can switch to à-la-carte pricing.
([SES pricing](https://aws.amazon.com/ses/pricing/),
[July 2026 SES pricing-plan announcement](https://aws.amazon.com/blogs/messaging-and-targeting/introducing-amazon-simple-email-service-ses-pricing-plans/))

## Lowest-operations managed alternative

If minimizing operator time is more important than the absolute bill:

| Concern | Service | Idle / small-production cost |
| --- | --- | ---: |
| Frontend | Cloudflare Pages Free | $0 |
| Database/API/Auth | Supabase Pro, one Micro project | $25/month |
| Always-on worker | Fly.io shared-cpu-1x, 512 MB | approximately $3.19-$5.16/month by region |
| Email | Amazon SES | approximately $0 at low volume |
| **Total** |  | **approximately $28-$31/month** |

Supabase Pro includes its first Micro project's $10 compute through a matching
compute credit, so one default project totals $25/month. It includes 8 GB disk,
100,000 MAU, 250 GB uncached egress, 250 GB cached egress, 100 GB file storage,
and daily backups retained for seven days.
([Supabase pricing](https://supabase.com/pricing))

Fly.io is usage-priced with no current free allowance for new accounts. A
continuously running shared-cpu-1x machine costs from $1.94-$3.14/month at
256 MB or $3.19-$5.16/month at 512 MB depending on region. The 512 MB estimate
is the safer starting point for this Node worker and its daily import process;
actual memory should be measured after deployment.
([Fly.io resource pricing](https://fly.io/docs/about/pricing/))

Render is a simpler fixed-price worker alternative at $7/month for its Starter
0.5-vCPU/512-MB service; background workers have no Free tier. That puts the
managed total near **$32/month**.
([Render service pricing comparison](https://render.com/articles/render-vs-railway),
[Render Blueprint plan availability](https://render.com/docs/blueprint-spec))

Railway Hobby has a $5/month minimum that includes $5 of usage, then charges
$10/GB-month RAM, $20/vCPU-month CPU, $0.05/GB egress, and $0.15/GB-month volume
storage. It can be competitive for a mostly idle worker, but the bill varies
with consumption and an idle allocated service still incurs memory/CPU usage.
([Railway plan and resource pricing](https://docs.railway.com/pricing/plans),
[Railway idle billing](https://docs.railway.com/pricing/understanding-your-bill))

## Upgrade triggers

### Self-hosted CX23

Move to CX33 or a larger/multi-node design when any of these occur:

- RAM pressure or OOM during the daily catalog import, or sustained memory use
  approaches the 4 GB host limit.
- PostgreSQL data, temporary import space, images, container layers, logs, and
  local backups approach the 40 GB disk.
- The daily import or GraphQL search creates sustained CPU contention. Hetzner
  positions cost-optimized shared instances for variable low-to-medium CPU and
  traffic, not sustained high workloads.
  ([Hetzner cost-optimized positioning](https://www.hetzner.com/cloud/cost-optimized))
- A single VM's outage or maintenance window is no longer acceptable. At that
  point the requirement is high availability, not merely a bigger VPS.
- The team cannot reliably own security updates, monitoring, backups, and
  restore drills. That is the point to choose managed Supabase even if raw
  compute remains underutilized.

Hetzner's cost-optimized CX capacity is limited, so the exact cheapest instance
may not always be available. The 4-GB ARM CAX11 is $6.99/month before IPv4 and
backups, but image/dependency architecture support should be validated before
using it as a fallback.
([Hetzner cost-optimized availability](https://www.hetzner.com/cloud/cost-optimized),
[Hetzner June 2026 prices](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/))

### Managed Supabase + worker

Managed cost rises when:

- Database disk exceeds 8 GB: $0.125/GB beyond the included amount.
- Uncached egress exceeds 250 GB: $0.09/GB; cached egress beyond 250 GB is
  $0.03/GB.
- Auth exceeds 100,000 MAU: $0.00325 per additional MAU.
- The Micro database or 512 MB worker becomes CPU/memory constrained.
- Point-in-time recovery is required; Supabase lists it separately from Pro's
  daily backups.

([Supabase pricing and overages](https://supabase.com/pricing),
[Supabase database backups/PITR](https://supabase.com/docs/guides/platform/backups))

## Bottom line

- **Cheapest cash cost:** Cloudflare Pages + one self-hosted Supabase/worker
  Hetzner CX23 + off-site dumps, about **$7-$9/month** before VAT and domain.
- **Safer self-hosted starting size:** the same stack on CX33, about
  **$11-$13/month** including IPv4 and Hetzner backups.
- **Cheapest low-operations choice:** Cloudflare Pages + Supabase Pro + a small
  Fly.io worker, about **$28-$31/month**.
- **Not viable unchanged:** Supabase Free, because the current 585 MB database
  already exceeds its 500 MB allowance.
