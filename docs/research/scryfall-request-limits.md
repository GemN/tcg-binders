# Scryfall request limits

Verified against Scryfall's first-party documentation on 2026-07-22.

## Conclusion

Scryfall applies numeric request limits to `api.scryfall.com`, but not to direct
files served from `*.scryfall.io`. Since card image URLs use
`cards.scryfall.io`, Scryfall does not publish or require a numeric
requests-per-second limit for direct image downloads.

Consequently, the API limits should not be applied to browser requests made
directly to `cards.scryfall.io`. A small client concurrency cap may still be
useful for browser/network performance, but it is not a Scryfall rate-limit
requirement.

## `api.scryfall.com`

Scryfall's current [Rate Limits documentation](https://scryfall.com/docs/api/rate-limits)
lists these hard limits:

| Endpoint | Limit | Minimum interval |
| --- | ---: | ---: |
| `/cards/search` | 2 requests/second | 500 ms |
| `/cards/named` | 2 requests/second | 500 ms |
| `/cards/random` | 2 requests/second | 500 ms |
| `/cards/collection` | 2 requests/second | 500 ms |
| `/cards/manifest` | 10 requests/minute | 10,000 ms |
| All other API methods | 10 requests/second | 100 ms |

Scryfall says an API overload can return HTTP 429 and limit access for 30
seconds. Clients must reduce their request rate rather than repeatedly retrying
through the response. The same page recommends caching downloaded data for at
least 24 hours and using [bulk data](https://scryfall.com/docs/api/bulk-data)
when resolving many cards or images.

Scryfall's [API troubleshooting FAQ](https://scryfall.com/docs/faqs/i-m-having-trouble-accessing-the-scryfall-api-or-i-m-blocked-17)
likewise says API traffic should remain under 10 requests per second and warns
that repeatedly or excessively receiving HTTP 429 can result in a permanent
block. The endpoint-specific limits above are stricter where applicable.

## `cards.scryfall.io` image files

Scryfall's [Card Imagery documentation](https://scryfall.com/docs/api/images)
says that card objects expose image links through `image_uris`, and its example
image links point directly to `https://cards.scryfall.io/...`.

The [Rate Limits documentation](https://scryfall.com/docs/api/rate-limits)
explicitly says direct file origins at `*.scryfall.io` "do not have rate
limits." The [troubleshooting FAQ](https://scryfall.com/docs/faqs/i-m-having-trouble-accessing-the-scryfall-api-or-i-m-blocked-17)
independently confirms that files on `*.scryfall.io` do not have the API
limits.

Therefore:

- Direct requests to an `image_uris` URL on `cards.scryfall.io` have no
  Scryfall-published numeric rate limit.
- A request made to `api.scryfall.com` with an image response format is still
  an API request and is subject to that endpoint's API limit; Scryfall then
  redirects the client to the image file.
- No first-party Scryfall source reviewed specifies a separate concurrency,
  spacing, or requests-per-second limit for direct image downloads.

## Sources

- [Scryfall API: Rate Limits](https://scryfall.com/docs/api/rate-limits)
- [Scryfall API: Card Imagery](https://scryfall.com/docs/api/images)
- [Scryfall FAQ: API access and blocking](https://scryfall.com/docs/faqs/i-m-having-trouble-accessing-the-scryfall-api-or-i-m-blocked-17)
