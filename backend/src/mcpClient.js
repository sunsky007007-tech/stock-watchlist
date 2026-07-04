import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const MCP_URL = process.env.FINANCIAL_DATASETS_MCP_URL || "https://mcp.financialdatasets.ai/api";
const API_KEY = process.env.FINANCIAL_DATASETS_API_KEY;

let sharedClientPromise = null;

function formatMarketDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function yearsAgo(years) {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return formatMarketDate(date);
}

export function getDateRange(years) {
  return {
    start_date: yearsAgo(years),
    end_date: formatMarketDate(new Date()),
  };
}

function ensureApiKey() {
  if (!API_KEY) {
    throw new Error("请设置 FINANCIAL_DATASETS_API_KEY 环境变量");
  }
}

async function createClient() {
  ensureApiKey();

  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL), {
    requestInit: {
      headers: {
        "X-API-KEY": API_KEY,
      },
    },
  });

  const client = new Client({
    name: "stock-watchlist",
    version: "1.0.0",
  });

  await client.connect(transport);
  return client;
}

async function getSharedClient() {
  if (!sharedClientPromise) {
    sharedClientPromise = createClient().catch((error) => {
      sharedClientPromise = null;
      throw error;
    });
  }

  return sharedClientPromise;
}

async function resetClient() {
  if (sharedClientPromise) {
    try {
      const client = await sharedClientPromise;
      await client.close();
    } catch {
      // ignore close errors during reset
    }
    sharedClientPromise = null;
  }
}

async function withMcpClient(fn) {
  const client = await getSharedClient();
  return await fn(client);
}

function isTransientMcpError(error) {
  const message = error?.message || String(error);
  return (
    message.includes("-32000") ||
    message.includes("Connection closed") ||
    message.includes("connection closed") ||
    message.includes("ECONNRESET") ||
    message.includes("ECONNREFUSED") ||
    message.includes("fetch failed") ||
    message.includes("terminated") ||
    message.includes("transport closed")
  );
}

function formatMcpErrorMessage(message) {
  if (!message) {
    return "数据服务暂时不可用，请稍后重试";
  }

  if (isTransientMcpError({ message })) {
    return "Financial Datasets 连接暂时中断，请稍后刷新重试";
  }

  if (message.includes("add more credits") || message.includes("balance is $0")) {
    return "API 余额不足，请在 financialdatasets.ai 充值后重试";
  }

  if (message.includes("valid ticker")) {
    return "无效的股票代码";
  }

  if (message.includes("end_date must be today")) {
    return "行情日期同步中，请稍后刷新（美东交易日边界）";
  }

  if (message.startsWith("Error fetching")) {
    return message.replace(/^Error fetching [^:]+:\s*/, "");
  }

  if (message.startsWith("MCP error")) {
    return "Financial Datasets 数据服务异常，请稍后重试";
  }

  return message;
}

function toMcpError(error, fallback = "MCP 调用失败") {
  const friendly = new Error(formatMcpErrorMessage(error?.message || fallback));
  friendly.status = error?.status || (isTransientMcpError(error) ? 503 : 502);
  return friendly;
}

function parseToolResult(result) {
  const text = result.content?.find((item) => item.type === "text")?.text;
  if (!text) {
    return [];
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function unwrapMcpData(data) {
  if (typeof data === "string") {
    const message = data.trim();
    if (
      message.startsWith("Error ") ||
      message.includes("add more credits") ||
      message.includes("valid ticker")
    ) {
      const error = new Error(message);
      error.status = message.includes("credits") ? 402 : 502;
      throw error;
    }
  }

  return data;
}

function normalizeTicker(ticker) {
  return ticker.trim().toUpperCase();
}

function asArray(data) {
  if (Array.isArray(data)) {
    return data;
  }

  return data?.items || data?.filings || data?.earnings || data?.holdings || data?.trades || data?.results || data?.stocks || data?.segments || data?.metrics || [];
}

async function fetchStatement(toolName, ticker, period = "annual", limit = 4) {
  const data = await callTool(toolName, {
    ticker: normalizeTicker(ticker),
    period,
    limit,
  });

  return asArray(data);
}

async function callTool(name, args) {
  const maxAttempts = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await withMcpClient(async (client) => {
        const result = await client.callTool({ name, arguments: args });

        if (result.isError) {
          const message = parseToolResult(result);
          throw new Error(typeof message === "string" ? message : `MCP 工具 ${name} 调用失败`);
        }

        return unwrapMcpData(parseToolResult(result));
      });
    } catch (error) {
      lastError = error;
      const shouldRetry = attempt < maxAttempts && isTransientMcpError(error);

      if (shouldRetry) {
        await resetClient();
        await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
        continue;
      }

      await resetClient();
      throw toMcpError(error);
    }
  }

  throw toMcpError(lastError);
}

export async function getStockPrices(ticker, years) {
  const { start_date, end_date } = getDateRange(years);
  const data = await callTool("get_stock_prices", {
    ticker: normalizeTicker(ticker),
    interval: "day",
    interval_multiplier: 1,
    start_date,
    end_date,
  });

  return Array.isArray(data) ? data : data?.prices || [];
}

export async function getStockSnapshot(ticker) {
  return callTool("get_stock_price", {
    ticker: normalizeTicker(ticker),
  });
}

export async function getStockSnapshots(tickers) {
  const uniqueTickers = [...new Set(tickers.map(normalizeTicker).filter(Boolean))];
  const errors = {};
  const entries = await Promise.all(
    uniqueTickers.map(async (symbol) => {
      try {
        const snapshot = await getStockSnapshot(symbol);
        return [symbol, snapshot];
      } catch (error) {
        errors[symbol] = error.message;
        return [symbol, null];
      }
    })
  );

  return {
    snapshots: Object.fromEntries(entries),
    errors,
  };
}

export async function getCompanyFacts(ticker) {
  return callTool("get_company_facts", {
    ticker: normalizeTicker(ticker),
  });
}

export async function getCompanyFactsBatch(tickers) {
  const uniqueTickers = [...new Set(tickers.map(normalizeTicker).filter(Boolean))];
  const errors = {};
  const entries = await Promise.all(
    uniqueTickers.map(async (symbol) => {
      try {
        const facts = await getCompanyFacts(symbol);
        return [symbol, facts];
      } catch (error) {
        errors[symbol] = error.message;
        return [symbol, null];
      }
    })
  );

  return {
    companies: Object.fromEntries(entries),
    errors,
  };
}

export async function getFinancialMetricsSnapshot(ticker) {
  return callTool("get_financial_metrics_snapshot", {
    ticker: normalizeTicker(ticker),
  });
}

export async function getNews(ticker, limit = 10) {
  const data = await callTool("get_news", {
    ticker: normalizeTicker(ticker),
    limit,
  });

  if (Array.isArray(data)) {
    return data;
  }

  return data?.news || data?.articles || [];
}

export async function getIncomeStatement(ticker, period = "annual", limit = 4) {
  return fetchStatement("get_income_statement", ticker, period, limit);
}

export async function getBalanceSheet(ticker, period = "annual", limit = 4) {
  return fetchStatement("get_balance_sheet", ticker, period, limit);
}

export async function getCashFlowStatement(ticker, period = "annual", limit = 4) {
  return fetchStatement("get_cash_flow_statement", ticker, period, limit);
}

export async function getFinancialStatements(ticker, period = "annual", limit = 4) {
  const [income, balance, cashflow] = await Promise.all([
    getIncomeStatement(ticker, period, limit),
    getBalanceSheet(ticker, period, limit),
    getCashFlowStatement(ticker, period, limit),
  ]);

  return { income, balance, cashflow, period, limit };
}

export async function getEarnings(ticker, limit = 8) {
  const data = await callTool("get_earnings", {
    ticker: normalizeTicker(ticker),
  });

  const items = asArray(data);
  return items.slice(0, limit);
}

export async function getFilings(ticker, limit = 20, filingType) {
  const args = {
    ticker: normalizeTicker(ticker),
    limit,
  };

  if (filingType) {
    args.filing_type = filingType;
  }

  const data = await callTool("get_filings", args);
  return asArray(data);
}

export async function listStockScreenerFilters() {
  return callTool("list_stock_screener_filters", {});
}

export async function screenStocks(filters, limit = 20, currency = "USD") {
  const data = await callTool("screen_stocks", {
    filters,
    limit,
    currency,
  });

  if (Array.isArray(data)) {
    return data;
  }

  return data?.results || data?.stocks || data?.items || [];
}

export async function getInsiderTrades(ticker, options = {}) {
  const args = {
    ticker: normalizeTicker(ticker),
    limit: options.limit ?? 50,
  };

  if (options.name) {
    args.name = options.name;
  }
  if (options.filing_date) {
    args.filing_date = options.filing_date;
  }
  if (options.filing_date_gte) {
    args.filing_date_gte = options.filing_date_gte;
  }
  if (options.filing_date_lte) {
    args.filing_date_lte = options.filing_date_lte;
  }

  const data = await callTool("get_insider_trades", args);
  return asArray(data);
}

export async function getInstitutionalHoldings(ticker, options = {}) {
  const args = {
    ticker: normalizeTicker(ticker),
    limit: options.limit ?? 20,
  };

  if (options.report_period) {
    args.report_period = options.report_period;
  }
  if (options.report_period_gte) {
    args.report_period_gte = options.report_period_gte;
  }
  if (options.report_period_lte) {
    args.report_period_lte = options.report_period_lte;
  }

  const data = await callTool("get_institutional_holdings", args);
  return asArray(data);
}

export async function getFinancialMetrics(ticker, period = "annual", limit = 8) {
  const data = await callTool("get_financial_metrics", {
    ticker: normalizeTicker(ticker),
    period,
    limit,
  });

  return asArray(data);
}

export async function getSegmentedFinancials(ticker, period = "annual", limit = 4) {
  const data = await callTool("get_segmented_financials", {
    ticker: normalizeTicker(ticker),
    period,
    limit,
  });

  if (Array.isArray(data)) {
    return data;
  }

  return data?.segments || data?.items || [];
}

export async function getKpiData(ticker, type = "metrics", period = "quarterly", limit = 8, metricName) {
  const toolMap = {
    metrics: "get_kpi_metrics",
    guidance: "get_kpi_guidance",
    non_gaap: "get_kpi_non_gaap",
  };

  const toolName = toolMap[type];
  if (!toolName) {
    throw new Error(`不支持的 KPI 类型: ${type}`);
  }

  const args = {
    ticker: normalizeTicker(ticker),
    period,
    limit,
  };

  if (metricName) {
    args.metric_name = metricName;
  }

  const data = await callTool(toolName, args);
  return asArray(data);
}

export async function listFilingItemTypes() {
  return callTool("list_filing_item_types", {});
}

export async function getFilingItems(ticker, options = {}) {
  const args = {
    ticker: normalizeTicker(ticker),
    filing_type: options.filing_type,
  };

  if (options.year) {
    args.year = Number(options.year);
  }
  if (options.quarter) {
    args.quarter = Number(options.quarter);
  }
  if (options.accession_number) {
    args.accession_number = options.accession_number;
  }
  if (options.items?.length) {
    args.item = options.items;
  }

  return callTool("get_filing_items", args);
}

export async function getInterestRates() {
  const data = await callTool("get_interest_rates", {});

  if (typeof data === "string") {
    return { rates: [], error: data };
  }

  return data;
}
