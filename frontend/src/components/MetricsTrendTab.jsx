import { useEffect, useMemo, useState } from "react";
import { fetchMetricsHistory } from "../api.js";
import { formatPercent, formatRatio } from "../utils/format.js";
import LineChart from "./LineChart.jsx";

const METRIC_OPTIONS = [
  { key: "price_to_earnings_ratio", label: "P/E", format: (v) => formatRatio(v, 1) },
  { key: "price_to_sales_ratio", label: "P/S", format: (v) => formatRatio(v, 1) },
  { key: "price_to_book_ratio", label: "P/B", format: (v) => formatRatio(v, 1) },
  { key: "gross_margin", label: "毛利率", format: (v) => formatPercent(v) },
  { key: "operating_margin", label: "营业利润率", format: (v) => formatPercent(v) },
  { key: "net_margin", label: "净利率", format: (v) => formatPercent(v) },
  { key: "return_on_equity", label: "ROE", format: (v) => formatPercent(v) },
  { key: "return_on_assets", label: "ROA", format: (v) => formatPercent(v) },
  { key: "free_cash_flow_yield", label: "FCF Yield", format: (v) => formatPercent(v) },
  { key: "revenue_growth", label: "营收增速", format: (v) => formatPercent(v) },
];

function toChartPoints(records, metricKey) {
  return records
    .map((record) => {
      const value = record[metricKey];
      const time = record.report_period;
      if (value == null || !time) {
        return null;
      }

      return { time, value: Number(value) };
    })
    .filter(Boolean);
}

export default function MetricsTrendTab({ ticker }) {
  const [period, setPeriod] = useState("annual");
  const [metricKey, setMetricKey] = useState("price_to_earnings_ratio");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ticker) {
      setRecords([]);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const result = await fetchMetricsHistory(ticker, period, 12);
        if (!cancelled) {
          setRecords(result);
        }
      } catch (err) {
        if (!cancelled) {
          setRecords([]);
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [ticker, period]);

  const activeMetric = METRIC_OPTIONS.find((item) => item.key === metricKey) || METRIC_OPTIONS[0];
  const chartPoints = useMemo(() => toChartPoints(records, metricKey), [records, metricKey]);
  const sortedRecords = [...records].sort((a, b) =>
    (a.report_period || "") < (b.report_period || "") ? 1 : -1
  );

  return (
    <div className="tab-panel">
      <div className="tab-toolbar">
        <div className="segment-switch">
          {METRIC_OPTIONS.map((item) => (
            <button
              key={item.key}
              className={metricKey === item.key ? "active" : ""}
              onClick={() => setMetricKey(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="segment-switch">
          <button className={period === "annual" ? "active" : ""} onClick={() => setPeriod("annual")}>
            年报
          </button>
          <button
            className={period === "quarterly" ? "active" : ""}
            onClick={() => setPeriod("quarterly")}
          >
            季报
          </button>
          <button className={period === "ttm" ? "active" : ""} onClick={() => setPeriod("ttm")}>
            TTM
          </button>
        </div>
      </div>

      {loading && <div className="tab-empty">指标趋势加载中...</div>}
      {error && <div className="tab-error">{error}</div>}

      {!loading && !error && (
        <>
          <LineChart
            points={chartPoints}
            valueFormatter={(value) => activeMetric.format(value)}
          />
          <div className="table-wrap trend-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>期间</th>
                  <th>{activeMetric.label}</th>
                </tr>
              </thead>
              <tbody>
                {sortedRecords.map((record) => (
                  <tr key={record.report_period || record.fiscal_period}>
                    <td>{record.fiscal_period || record.report_period}</td>
                    <td>{activeMetric.format(record[metricKey])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
