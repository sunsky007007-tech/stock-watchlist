const API_BASE = "/api";

import { formatDataError } from "./utils/dataStatus.js";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(formatDataError(data.error || "请求失败"));
  }

  return data;
}

export function fetchWatchlist() {
  return request("/watchlist").then((data) => data.tickers);
}

export function addWatchlistTicker(ticker) {
  return request("/watchlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticker }),
  }).then((data) => data.tickers);
}

export function removeWatchlistTicker(ticker) {
  return request(`/watchlist/${ticker}`, {
    method: "DELETE",
  }).then((data) => data.tickers);
}

export function fetchPrices(ticker, years) {
  return request(`/prices/${ticker}?years=${years}`).then((data) => data.prices);
}

export function fetchSnapshot(ticker) {
  return request(`/snapshot/${ticker}`);
}

export function fetchSnapshots(tickers) {
  if (!tickers.length) {
    return Promise.resolve({ snapshots: {}, errors: {} });
  }

  const query = encodeURIComponent(tickers.join(","));
  return request(`/snapshots?tickers=${query}`);
}

export function fetchCompanies(tickers) {
  if (!tickers.length) {
    return Promise.resolve({ companies: {}, errors: {} });
  }

  const query = encodeURIComponent(tickers.join(","));
  return request(`/companies?tickers=${query}`);
}

export function fetchCompany(ticker) {
  return request(`/company/${ticker}`);
}

export function fetchMetrics(ticker) {
  return request(`/metrics/${ticker}`);
}

export function fetchNews(ticker, limit = 10) {
  return request(`/news/${ticker}?limit=${limit}`).then((data) => data.news);
}

export function fetchFinancials(ticker, period = "annual", limit = 4) {
  return request(`/financials/${ticker}?period=${period}&limit=${limit}`);
}

export function fetchEarnings(ticker, limit = 8) {
  return request(`/earnings/${ticker}?limit=${limit}`).then((data) => data.earnings);
}

export function fetchFilings(ticker, limit = 20, filingType) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (filingType) {
    params.set("filing_type", filingType);
  }
  return request(`/filings/${ticker}?${params.toString()}`).then((data) => data.filings);
}

export function fetchScreenerFilters() {
  return request("/screener/filters");
}

export function runStockScreener(filters, limit = 25) {
  return request("/screener", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filters, limit }),
  }).then((data) => data.results);
}

export function fetchInsiderTrades(ticker, limit = 50) {
  return request(`/insider-trades/${ticker}?limit=${limit}`).then((data) => data.trades);
}

export function fetchInstitutionalHoldings(ticker, limit = 30) {
  return request(`/institutional-holdings/${ticker}?limit=${limit}`).then((data) => data.holdings);
}

export function fetchMetricsHistory(ticker, period = "annual", limit = 12) {
  return request(`/metrics-history/${ticker}?period=${period}&limit=${limit}`).then(
    (data) => data.metrics
  );
}

export function fetchSegments(ticker, period = "annual", limit = 4) {
  return request(`/segments/${ticker}?period=${period}&limit=${limit}`).then((data) => data.segments);
}

export function fetchKpi(ticker, type = "metrics", period = "quarterly", limit = 12) {
  const params = new URLSearchParams({
    type,
    period,
    limit: String(limit),
  });
  return request(`/kpi/${ticker}?${params.toString()}`).then((data) => data.items);
}

export function fetchFilingItems(ticker, params) {
  const query = new URLSearchParams({
    filing_type: params.filing_type,
    items: params.items.join(","),
  });

  if (params.year) {
    query.set("year", String(params.year));
  }
  if (params.quarter) {
    query.set("quarter", String(params.quarter));
  }
  if (params.accession_number) {
    query.set("accession_number", params.accession_number);
  }

  return request(`/filing-items/${ticker}?${query.toString()}`).then((data) => data.content);
}

export function fetchInterestRates() {
  return request("/macro/interest-rates");
}
