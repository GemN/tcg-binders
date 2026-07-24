import { syncMtgCatalog } from "../mtg_catalog";

syncMtgCatalog().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
