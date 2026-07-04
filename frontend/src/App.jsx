import { useCallback, useEffect, useState } from "react";
import {
  addWatchlistTicker,
  fetchCompanies,
  fetchMetrics,
  fetchNews,
  fetchPrices,
  fetchSnapshots,
  fetchWatchlist,
  removeWatchlistTicker,
} from "./api.js";
import MacroBar from "./components/MacroBar.jsx";
import ScreenerModal from "./components/ScreenerModal.jsx";
import KlineChart from "./components/KlineChart.jsx";
import DetailTabs from "./components/DetailTabs.jsx";
import MetricsBar from "./components/MetricsBar.jsx";
import NewsPanel from "./components/NewsPanel.jsx";
import StockHeader from "./components/StockHeader.jsx";
import Watchlist from "./components/Watchlist.jsx";

import { formatDataError, isValidSnapshot } from "./utils/dataStatus.js";

const YEAR_OPTIONS = [1, 2];

export default function App() {
  const [tickers, setTickers] = useState([]);
  const [selected, setSelected] = useState("");
  const [years, setYears] = useState(1);
  const [prices, setPrices] = useState([]);
  const [snapshots, setSnapshots] = useState({});
  const [companies, setCompanies] = useState({});
  const [dataErrors, setDataErrors] = useState({});
  const [metrics, setMetrics] = useState(null);
  const [news, setNews] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [screenerOpen, setScreenerOpen] = useState(false);
  const [error, setError] = useState("");

  const refreshSnapshots = useCallback(async (list) => {
    const [snapshotResult, companyResult] = await Promise.all([
      fetchSnapshots(list),
      fetchCompanies(list),
    ]);

    setSnapshots(snapshotResult.snapshots || {});
    setCompanies(companyResult.companies || {});
    setDataErrors({
      ...(snapshotResult.errors || {}),
      ...(companyResult.errors || {}),
    });
  }, []);

  const loadWatchlist = useCallback(async () => {
    try {
      setError("");
      const list = await fetchWatchlist();
      setTickers(list);
      setSelected((current) => current || list[0] || "");
      await refreshSnapshots(list);
    } catch (err) {
      setError(err.message);
    }
  }, [refreshSnapshots]);

  const loadChart = useCallback(async (ticker, rangeYears) => {
    if (!ticker) {
      setPrices([]);
      return;
    }

    try {
      setChartLoading(true);
      setError("");
      const data = await fetchPrices(ticker, rangeYears);
      setPrices(data);
    } catch (err) {
      setPrices([]);
      setError(err.message);
    } finally {
      setChartLoading(false);
    }
  }, []);

  const loadStockDetails = useCallback(async (ticker) => {
    if (!ticker) {
      setMetrics(null);
      setNews([]);
      return;
    }

    try {
      setDetailLoading(true);
      setError("");
      const [nextMetrics, nextNews] = await Promise.all([
        fetchMetrics(ticker),
        fetchNews(ticker, 10),
      ]);
      setMetrics(nextMetrics);
      setNews(nextNews);
    } catch (err) {
      setMetrics(null);
      setNews([]);
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  useEffect(() => {
    loadChart(selected, years);
  }, [selected, years, loadChart]);

  useEffect(() => {
    loadStockDetails(selected);
  }, [selected, loadStockDetails]);

  async function handleAdd(ticker) {
    try {
      setError("");
      const list = await addWatchlistTicker(ticker);
      setTickers(list);
      setSelected(ticker);
      await refreshSnapshots(list);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemove(ticker) {
    try {
      setError("");
      const list = await removeWatchlistTicker(ticker);
      setTickers(list);
      setSelected((current) => (current === ticker ? list[0] || "" : current));
      await refreshSnapshots(list);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleScreenerAdd(ticker) {
    try {
      setError("");
      const list = await addWatchlistTicker(ticker);
      setTickers(list);
      setSelected(ticker);
      await refreshSnapshots(list);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleScreenerSelect(ticker) {
    setSelected(ticker);
    setScreenerOpen(false);
  }

  const snapshot = snapshots[selected];
  const company = companies[selected];
  const selectedDataError = dataErrors[selected];
  const showDataWarning = selected && selectedDataError && !isValidSnapshot(snapshot);

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>美股自选 K 线看板</h1>
          <p>数据来自 Financial Datasets MCP</p>
        </div>
        <div className="topbar-actions">
          <button className="screener-btn" onClick={() => setScreenerOpen(true)}>
            选股
          </button>
          <div className="range-switch">
            {YEAR_OPTIONS.map((option) => (
              <button
                key={option}
                className={years === option ? "active" : ""}
                onClick={() => setYears(option)}
              >
                {option} 年
              </button>
            ))}
          </div>
        </div>
      </header>

      <MacroBar />

      {error && <div className="error-banner">{formatDataError(error)}</div>}
      {showDataWarning && (
        <div className="warning-banner">
          {selected} 数据不可用：{formatDataError(selectedDataError)}。请在{" "}
          <a href="https://financialdatasets.ai" target="_blank" rel="noreferrer">
            financialdatasets.ai
          </a>{" "}
          检查 API 余额或升级套餐。
        </div>
      )}

      <main className="layout">
        <Watchlist
          tickers={tickers}
          selected={selected}
          snapshots={snapshots}
          companies={companies}
          dataErrors={dataErrors}
          onSelect={setSelected}
          onAdd={handleAdd}
          onRemove={handleRemove}
        />

        <section className="main-panel">
          <StockHeader
            ticker={selected}
            company={company}
            snapshot={snapshot}
            dataError={selectedDataError}
            loading={detailLoading}
          />
          <MetricsBar metrics={metrics} loading={detailLoading} />
          <div className="chart-wrap">
            {chartLoading && <span className="loading chart-loading">K 线加载中...</span>}
            <KlineChart prices={prices} ticker={selected} years={years} />
          </div>
          <DetailTabs ticker={selected} />
        </section>

        <NewsPanel news={news} loading={detailLoading} ticker={selected} />
      </main>

      <ScreenerModal
        open={screenerOpen}
        onClose={() => setScreenerOpen(false)}
        onAddTicker={handleScreenerAdd}
        onSelectTicker={handleScreenerSelect}
      />
    </div>
  );
}
