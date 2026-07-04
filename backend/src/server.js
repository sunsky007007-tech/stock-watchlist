import "dotenv/config";
import cors from "cors";
import express from "express";
import { asyncHandler } from "./asyncHandler.js";
import { ALLOWED_FILING_TYPES, ALLOWED_KPI_TYPES, ALLOWED_METRIC_PERIODS, ALLOWED_PERIODS, ALLOWED_YEARS, DEFAULT_PORT, SCREENER_OPERATORS } from "./constants.js";
import {
  getCompanyFacts,
  getCompanyFactsBatch,
  getEarnings,
  getFilings,
  getFilingItems,
  getFinancialMetrics,
  getFinancialMetricsSnapshot,
  getFinancialStatements,
  getInsiderTrades,
  getInstitutionalHoldings,
  getInterestRates,
  getKpiData,
  getNews,
  getSegmentedFinancials,
  getStockPrices,
  getStockSnapshot,
  getStockSnapshots,
  listFilingItemTypes,
  listStockScreenerFilters,
  screenStocks,
} from "./mcpClient.js";
import { addTicker, getWatchlist, removeTicker } from "./watchlist.js";

const app = express();
const PORT = Number(process.env.PORT || DEFAULT_PORT);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true,
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    mcpConfigured: Boolean(process.env.FINANCIAL_DATASETS_API_KEY),
  });
});

app.get(
  "/api/watchlist",
  asyncHandler(async (_req, res) => {
    const tickers = await getWatchlist();
    res.json({ tickers });
  })
);

app.post(
  "/api/watchlist",
  asyncHandler(async (req, res) => {
    const tickers = await addTicker(req.body.ticker);
    res.json({ tickers });
  })
);

app.delete(
  "/api/watchlist/:ticker",
  asyncHandler(async (req, res) => {
    const tickers = await removeTicker(req.params.ticker);
    res.json({ tickers });
  })
);

app.get(
  "/api/prices/:ticker",
  asyncHandler(async (req, res) => {
    const years = Number(req.query.years || 1);

    if (!ALLOWED_YEARS.includes(years)) {
      return res.status(400).json({ error: "years 仅支持 1、2、5" });
    }

    const ticker = req.params.ticker.toUpperCase();
    const prices = await getStockPrices(ticker, years);

    res.json({ ticker, years, prices });
  })
);

app.get(
  "/api/snapshot/:ticker",
  asyncHandler(async (req, res) => {
    const snapshot = await getStockSnapshot(req.params.ticker);
    res.json(snapshot);
  })
);

app.get(
  "/api/snapshots",
  asyncHandler(async (req, res) => {
    const tickers = String(req.query.tickers || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!tickers.length) {
      return res.json({ snapshots: {}, errors: {} });
    }

    const { snapshots, errors } = await getStockSnapshots(tickers);
    res.json({ snapshots, errors });
  })
);

app.get(
  "/api/company/:ticker",
  asyncHandler(async (req, res) => {
    const company = await getCompanyFacts(req.params.ticker);
    res.json(company);
  })
);

app.get(
  "/api/companies",
  asyncHandler(async (req, res) => {
    const tickers = String(req.query.tickers || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!tickers.length) {
      return res.json({ companies: {}, errors: {} });
    }

    const { companies, errors } = await getCompanyFactsBatch(tickers);
    res.json({ companies, errors });
  })
);

app.get(
  "/api/metrics/:ticker",
  asyncHandler(async (req, res) => {
    const metrics = await getFinancialMetricsSnapshot(req.params.ticker);
    res.json(metrics);
  })
);

app.get(
  "/api/news/:ticker",
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit || 10), 30);
    const news = await getNews(req.params.ticker, limit);
    res.json({ ticker: req.params.ticker.toUpperCase(), news });
  })
);

app.get(
  "/api/financials/:ticker",
  asyncHandler(async (req, res) => {
    const period = req.query.period || "annual";
    const limit = Math.min(Number(req.query.limit || 4), 12);

    if (!ALLOWED_PERIODS.includes(period)) {
      return res.status(400).json({ error: "period 仅支持 annual、quarterly" });
    }

    const ticker = req.params.ticker.toUpperCase();
    const statements = await getFinancialStatements(ticker, period, limit);
    res.json({ ticker, ...statements });
  })
);

app.get(
  "/api/earnings/:ticker",
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit || 8), 20);
    const ticker = req.params.ticker.toUpperCase();
    const earnings = await getEarnings(ticker, limit);
    res.json({ ticker, earnings });
  })
);

app.get(
  "/api/filings/:ticker",
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit || 20), 50);
    const filingType = req.query.filing_type || undefined;
    const ticker = req.params.ticker.toUpperCase();
    const filings = await getFilings(ticker, limit, filingType);
    res.json({ ticker, filings });
  })
);

app.get(
  "/api/screener/filters",
  asyncHandler(async (_req, res) => {
    const filters = await listStockScreenerFilters();
    res.json(filters);
  })
);

app.post(
  "/api/screener",
  asyncHandler(async (req, res) => {
    const { filters, limit = 20, currency = "USD" } = req.body || {};

    if (!Array.isArray(filters) || filters.length === 0) {
      return res.status(400).json({ error: "filters 至少包含一条条件" });
    }

    for (const filter of filters) {
      if (!filter?.field || !filter?.operator || filter.value === undefined || filter.value === "") {
        return res.status(400).json({ error: "每条 filter 需包含 field、operator、value" });
      }

      if (!SCREENER_OPERATORS.includes(filter.operator)) {
        return res.status(400).json({ error: `operator 仅支持 ${SCREENER_OPERATORS.join("、")}` });
      }
    }

    const cappedLimit = Math.min(Number(limit) || 20, 100);
    const results = await screenStocks(filters, cappedLimit, currency);
    res.json({ results, count: results.length });
  })
);

app.get(
  "/api/insider-trades/:ticker",
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const ticker = req.params.ticker.toUpperCase();
    const trades = await getInsiderTrades(ticker, {
      limit,
      name: req.query.name || undefined,
      filing_date: req.query.filing_date || undefined,
      filing_date_gte: req.query.filing_date_gte || undefined,
      filing_date_lte: req.query.filing_date_lte || undefined,
    });

    res.json({ ticker, trades });
  })
);

app.get(
  "/api/institutional-holdings/:ticker",
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit || 20), 200);
    const ticker = req.params.ticker.toUpperCase();
    const holdings = await getInstitutionalHoldings(ticker, {
      limit,
      report_period: req.query.report_period || undefined,
      report_period_gte: req.query.report_period_gte || undefined,
      report_period_lte: req.query.report_period_lte || undefined,
    });

    res.json({ ticker, holdings });
  })
);

app.get(
  "/api/metrics-history/:ticker",
  asyncHandler(async (req, res) => {
    const period = req.query.period || "annual";
    const limit = Math.min(Number(req.query.limit || 8), 24);

    if (!ALLOWED_METRIC_PERIODS.includes(period)) {
      return res.status(400).json({ error: "period 仅支持 annual、quarterly、ttm" });
    }

    const ticker = req.params.ticker.toUpperCase();
    const metrics = await getFinancialMetrics(ticker, period, limit);
    res.json({ ticker, period, metrics });
  })
);

app.get(
  "/api/segments/:ticker",
  asyncHandler(async (req, res) => {
    const period = req.query.period || "annual";
    const limit = Math.min(Number(req.query.limit || 4), 12);

    if (!ALLOWED_PERIODS.includes(period)) {
      return res.status(400).json({ error: "period 仅支持 annual、quarterly" });
    }

    const ticker = req.params.ticker.toUpperCase();
    const segments = await getSegmentedFinancials(ticker, period, limit);
    res.json({ ticker, period, segments });
  })
);

app.get(
  "/api/kpi/:ticker",
  asyncHandler(async (req, res) => {
    const type = req.query.type || "metrics";
    const period = req.query.period || "quarterly";
    const limit = Math.min(Number(req.query.limit || 8), 50);

    if (!ALLOWED_KPI_TYPES.includes(type)) {
      return res.status(400).json({ error: "type 仅支持 metrics、guidance、non_gaap" });
    }

    if (!ALLOWED_PERIODS.includes(period)) {
      return res.status(400).json({ error: "period 仅支持 annual、quarterly" });
    }

    const ticker = req.params.ticker.toUpperCase();
    const items = await getKpiData(ticker, type, period, limit, req.query.metric_name || undefined);
    res.json({ ticker, type, period, items });
  })
);

app.get(
  "/api/filing-items/types",
  asyncHandler(async (_req, res) => {
    const types = await listFilingItemTypes();
    res.json(types);
  })
);

app.get(
  "/api/filing-items/:ticker",
  asyncHandler(async (req, res) => {
    const filingType = req.query.filing_type || "10-K";
    const items = String(req.query.items || "Item-1")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!ALLOWED_FILING_TYPES.includes(filingType)) {
      return res.status(400).json({ error: "filing_type 仅支持 10-K、10-Q、8-K" });
    }

    if (filingType === "8-K" && !req.query.accession_number) {
      return res.status(400).json({ error: "8-K 需提供 accession_number" });
    }

    if ((filingType === "10-K" || filingType === "10-Q") && !req.query.year) {
      return res.status(400).json({ error: "10-K / 10-Q 需提供 year" });
    }

    if (filingType === "10-Q" && !req.query.quarter) {
      return res.status(400).json({ error: "10-Q 需提供 quarter" });
    }

    const ticker = req.params.ticker.toUpperCase();
    const content = await getFilingItems(ticker, {
      filing_type: filingType,
      year: req.query.year ? Number(req.query.year) : undefined,
      quarter: req.query.quarter ? Number(req.query.quarter) : undefined,
      accession_number: req.query.accession_number || undefined,
      items,
    });

    res.json({ ticker, filing_type: filingType, items, content });
  })
);

app.get(
  "/api/macro/interest-rates",
  asyncHandler(async (_req, res) => {
    const rates = await getInterestRates();
    res.json(rates);
  })
);

app.use((error, _req, res, _next) => {
  const status = error.status || 500;
  res.status(status).json({ error: error.message || "服务器内部错误" });
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
