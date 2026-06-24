import { fetchCurrencyRates } from "../currency_rates";

fetchCurrencyRates()
  .then((rates) => {
    const rateDate = rates[0]?.rate_date;
    const quotes = rates
      .map((rate) => `${rate.quote_currency}=${rate.rate}`)
      .join(", ");

    console.log(`Fetched ${rates.length} currency rates for ${rateDate}: ${quotes}`);
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
