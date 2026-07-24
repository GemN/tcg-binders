import { Task } from "graphile-worker";

import { syncMtgCatalog } from "../mtg_catalog";

const task: Task = async () => {
  await syncMtgCatalog();
};

module.exports = task;
