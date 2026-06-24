import supabase from "./utils/supabase";

const baseCurrency = "USD";
const provider = "frankfurter";
const targetCurrencies = ["EUR", "USD", "THB", "GBP"] as const;
const quoteCurrencies = targetCurrencies.filter(
  (currency) => currency !== baseCurrency
);

type CurrencyCode = (typeof targetCurrencies)[number];

interface ProviderRate {
  date: string;
  base: string;
  quote: string;
  rate: number;
}

interface CurrentCurrencyRateRow {
  base_currency: CurrencyCode;
  quote_currency: CurrencyCode;
  rate: string;
  rate_date: string;
  provider: string;
  fetched_at: string;
}

export async function fetchCurrencyRates(): Promise<CurrentCurrencyRateRow[]> {
  const providerRates = await fetchProviderRates();
  const fetchedAt = new Date().toISOString();
  const rateDate = getRateDate(providerRates);
  const rows: CurrentCurrencyRateRow[] = targetCurrencies.map((quoteCurrency) => {
    const rate =
      quoteCurrency === baseCurrency
        ? 1
        : getProviderRate(providerRates, quoteCurrency);

    return {
      base_currency: baseCurrency,
      quote_currency: quoteCurrency,
      rate: String(rate),
      rate_date: rateDate,
      provider,
      fetched_at: fetchedAt,
    };
  });

  const { error } = await supabase
    .from("currency_rates")
    .upsert(rows, { onConflict: "base_currency,quote_currency" });

  if (error) {
    throw new Error(`Failed to upsert currency rates: ${error.message}`);
  }

  return rows;
}

async function fetchProviderRates(): Promise<ProviderRate[]> {
  const url = new URL("https://api.frankfurter.dev/v2/rates");
  url.searchParams.set("base", baseCurrency);
  url.searchParams.set("quotes", quoteCurrencies.join(","));

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch currency rates: ${response.status} ${response.statusText}`
    );
  }

  const payload = await response.json();
  return parseProviderRates(payload);
}

function parseProviderRates(payload: unknown): ProviderRate[] {
  if (!Array.isArray(payload)) {
    throw new Error("Unexpected currency-rate response: expected an array");
  }

  const rates = payload.map(parseProviderRate);
  const missingQuotes = quoteCurrencies.filter(
    (quoteCurrency) =>
      !rates.some((rate) => rate.base === baseCurrency && rate.quote === quoteCurrency)
  );

  if (missingQuotes.length > 0) {
    throw new Error(
      `Currency-rate response is missing quotes: ${missingQuotes.join(", ")}`
    );
  }

  return rates;
}

function parseProviderRate(value: unknown): ProviderRate {
  if (!isRecord(value)) {
    throw new Error("Unexpected currency-rate row: expected an object");
  }

  const { date, base, quote, rate } = value;
  if (
    typeof date !== "string" ||
    !date.match(/^\d{4}-\d{2}-\d{2}$/) ||
    base !== baseCurrency ||
    typeof quote !== "string" ||
    !isQuoteCurrency(quote) ||
    typeof rate !== "number" ||
    !Number.isFinite(rate) ||
    rate <= 0
  ) {
    throw new Error("Unexpected currency-rate row shape");
  }

  return { date, base, quote, rate };
}

function getRateDate(rates: ProviderRate[]) {
  const [firstRate] = rates;
  if (!firstRate) {
    throw new Error("Currency-rate response is empty");
  }

  const rateDate = firstRate.date;
  if (!rates.every((rate) => rate.date === rateDate)) {
    throw new Error("Currency-rate response contains multiple rate dates");
  }

  return rateDate;
}

function getProviderRate(rates: ProviderRate[], quoteCurrency: CurrencyCode) {
  const providerRate = rates.find(
    (rate) => rate.base === baseCurrency && rate.quote === quoteCurrency
  );

  if (!providerRate) {
    throw new Error(`Currency-rate response is missing ${quoteCurrency}`);
  }

  return providerRate.rate;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isQuoteCurrency(value: string): value is CurrencyCode {
  return quoteCurrencies.includes(value as (typeof quoteCurrencies)[number]);
}
