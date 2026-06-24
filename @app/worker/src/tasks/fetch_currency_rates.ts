import { Task } from "graphile-worker";

import { fetchCurrencyRates } from "../currency_rates";

const task: Task = async () => {
  await fetchCurrencyRates();
};

module.exports = task;
