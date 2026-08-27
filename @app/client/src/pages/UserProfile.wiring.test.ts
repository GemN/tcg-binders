import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const profileSource = readFileSync(
  new URL("./UserProfile.tsx", import.meta.url),
  "utf8"
);
const publicBindersQuerySource = readFileSync(
  new URL("../graphql/PublicBindersByOwner.graphql", import.meta.url),
  "utf8"
);

test("filters profile binders to listed visibility in GraphQL", () => {
  assert.match(
    publicBindersQuerySource,
    /filter:\s*\{[\s\S]*?ownerId:\s*\{ eq: \$ownerId \}[\s\S]*?visibility:\s*\{ eq: listed \}[\s\S]*?\}/
  );
  assert.match(profileSource, /fetchPolicy: "network-only"/);
});
