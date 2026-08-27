import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
const cardPageSource = readFileSync(
  new URL("./CardPage.tsx", import.meta.url),
  "utf8"
);
const allListingsPageSource = readFileSync(
  new URL("./CardAllListingsPage.tsx", import.meta.url),
  "utf8"
);
const printingsPageSource = readFileSync(
  new URL("./CardPrintingsPage.tsx", import.meta.url),
  "utf8"
);
const printingsQuerySource = readFileSync(
  new URL("../graphql/CardVariantsByName.graphql", import.meta.url),
  "utf8"
);
const listingPricesQuerySource = readFileSync(
  new URL("../graphql/CardListingPrices.graphql", import.meta.url),
  "utf8"
);

test("routes legacy variants URLs to the canonical printings page", () => {
  assert.match(appSource, /path="card\/:cardId\/printings"/);
  assert.match(
    appSource,
    /path="card\/:cardId\/variants"[\s\S]*?<Navigate to="\.\.\/printings" replace relative="path" \/>/
  );
  assert.match(
    printingsPageSource,
    /seoCanonicalPath = `\/card\/\$\{encodeURIComponent\(cardId\)\}\/printings`/
  );
});

test("links card-family pages to printings instead of the legacy route", () => {
  for (const source of [cardPageSource, allListingsPageSource]) {
    assert.match(source, /to=\{`\/card\/\$\{card\.id\}\/printings`\}/);
    assert.doesNotMatch(source, /to=\{`\/card\/\$\{card\.id\}\/variants`\}/);
  }
});

test("wires availability filtering and both printing views", () => {
  assert.match(
    printingsPageSource,
    /getDisplayedCardPrintings\(printingItems, sortMode, showOnlyAvailable\)/
  );
  assert.match(
    printingsPageSource,
    /const \[searchParams, setSearchParams\] = useSearchParams\(\);/
  );
  assert.match(
    printingsPageSource,
    /const viewMode: CardPrintingViewMode = isCardPrintingViewMode\(viewParam\)[\s\S]*?: "grid";/
  );
  assert.match(
    printingsPageSource,
    /nextSearchParams\.set\("view", value\);[\s\S]*?setSearchParams\(nextSearchParams\);/
  );
  assert.match(printingsPageSource, /viewMode === "grid"/);
  assert.match(printingsPageSource, /viewMode === "list"/);
  assert.match(printingsPageSource, /<ToggleGroupItem[\s\S]*?value="grid"/);
  assert.match(printingsPageSource, /<ToggleGroupItem[\s\S]*?value="list"/);
});

test("requests a listing row so each printing receives its total listing count", () => {
  assert.match(
    printingsQuerySource,
    /publicBinderCards:\s*binderCards\(first:\s*1\)\s*\{\s*totalCount/
  );
  assert.doesNotMatch(
    printingsQuerySource,
    /publicBinderCards:\s*binderCards\(first:\s*0\)/
  );
});

test("keeps all-listings summary data independent from active filters", () => {
  assert.match(
    allListingsPageSource,
    /const listingPrices = useAllCardListingPrices\(\{\s*filter: baseListingFilter,\s*skip: !card\?\.name,\s*\}\);/
  );
  assert.doesNotMatch(
    allListingsPageSource,
    /useAllCardListingPrices\(\{\s*filter: listingFilters\.filter/
  );
  assert.match(
    listingPricesQuerySource,
    /binderCardsCollection\([\s\S]*?\) \{\s*totalCount/
  );
  assert.match(
    listingPricesQuerySource,
    /edges \{\s*node \{[\s\S]*?binder \{\s*ownerId\s*\}/
  );
  assert.match(
    allListingsPageSource,
    /new Set\([\s\S]*?listingPrices\.prices[\s\S]*?listing\.binder\?\.ownerId/
  );
  assert.match(
    allListingsPageSource,
    /all_listings_page\.seller_count", \{\s*count: sellerCount/
  );
  assert.match(
    allListingsPageSource,
    /title: t\("card:all_listings_page\.total_listings"\)/
  );
  assert.match(
    allListingsPageSource,
    /listingPrices\.totalCount\.toLocaleString\(i18n\.language\)/
  );
});
