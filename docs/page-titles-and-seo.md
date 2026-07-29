# SEO Future Work

## Public-page rendering and delivery

Add request-time rendering for public routes when the deployment runtime is
introduced. Public titles, descriptions, canonical links, social metadata, and
JSON-LD should be present in the initial HTML response so crawlers do not depend
on client-side JavaScript.

The runtime work should also:

- return an HTTP 404 status for unknown, private, and missing public resources;
- generate a production sitemap from canonical, indexable URLs;
- include the home page, card printing pages, and listed binders in the sitemap;
- exclude unlisted binders and all `noindex` routes;
- derive the production origin from deployment configuration rather than
  hard-coding a host in the client.

## Card-family canonical URLs

The listings and variants routes currently use a printing ID even though their
contents are grouped by card name. Multiple printings of the same card can
therefore produce duplicate family pages:

```text
/card/<printing-a>/listings
/card/<printing-b>/listings
```

When family-page indexing becomes a priority, introduce a durable family URL
based on the MTG `oracle_id`, for example:

```text
/cards/<oracle-id>/<slug>/listings
/cards/<oracle-id>/<slug>/variants
```

Existing printing-based family URLs should then redirect or canonicalize to the
durable family URL. The listings and variants pages can become indexable only
after this canonical issue is resolved.

## Seller-profile indexing

Make seller profiles indexable after they expose meaningful public content, such
as the seller's listed binders. At that point:

- add the profiles to the production sitemap;
- add page-owned `ProfilePage` JSON-LD whose `mainEntity` is a `Person`;
- define the canonical behavior for nickname changes.
