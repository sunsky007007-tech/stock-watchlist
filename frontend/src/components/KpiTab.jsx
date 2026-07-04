import { useEffect, useState } from "react";
import { fetchKpi } from "../api.js";
import { formatDate, formatMoney, formatPercent, formatRatio } from "../utils/format.js";

const KPI_TYPES = [
  { id: "metrics", label: "经营指标" },
  { id: "guidance", label: "业绩指引" },
  { id: "non_gaap", label: "非 GAAP" },
];

function formatKpiValue(value, unit) {
  if (value == null) {
    return "--";
  }

  if (typeof value === "number") {
    if (unit?.includes("percent") || (Math.abs(value) <= 1 && unit !== "dollars")) {
      return formatPercent(value);
    }

    if (Math.abs(value) >= 1_000_000) {
      return formatMoney(value);
    }

    return formatRatio(value, 2);
  }

  return String(value);
}

export default function KpiTab({ ticker }) {
  const [type, setType] = useState("metrics");
  const [period, setPeriod] = useState("quarterly");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ticker) {
      setItems([]);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const result = await fetchKpi(ticker, type, period, 12);
        if (!cancelled) {
          setItems(result);
        }
      } catch (err) {
        if (!cancelled) {
          setItems([]);
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
  }, [ticker, type, period]);

  return (
    <div className="tab-panel">
      <div className="tab-toolbar">
        <div className="segment-switch">
          {KPI_TYPES.map((item) => (
            <button
              key={item.id}
              className={type === item.id ? "active" : ""}
              onClick={() => setType(item.id)}
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
        </div>
      </div>

      {loading && <div className="tab-empty">KPI 数据加载中...</div>}
      {error && <div className="tab-error">{error}</div>}

      {!loading && !error && !items.length && (
        <div className="tab-empty">
          暂无 KPI 数据。KPI 指标通常需要 Financial Datasets Pro / Enterprise 套餐。
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <ul className="kpi-list">
          {items.map((item, index) => {
            const metricName =
              item.metric_name || item.name || item.guidance_metric || item.title || "指标";
            const periodLabel = item.fiscal_period || item.report_period || item.period;
            const value =
              item.value ??
              item.metric_value ??
              item.point_estimate ??
              item.actual ??
              item.amount;

            return (
              <li key={`${metricName}-${periodLabel}-${index}`}>
                <div className="kpi-header">
                  <strong>{metricName}</strong>
                  <span>{formatDate(item.report_period || item.filing_date)}</span>
                </div>
                <div className="kpi-body">
                  <span>{periodLabel || "--"}</span>
                  <strong>{formatKpiValue(value, item.unit)}</strong>
                </div>
                {(item.guidance_low != null || item.guidance_high != null) && (
                  <div className="kpi-range">
                    区间：{formatKpiValue(item.guidance_low, item.unit)} -{" "}
                    {formatKpiValue(item.guidance_high, item.unit)}
                  </div>
                )}
                {item.commentary && <p className="kpi-commentary">{item.commentary}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
