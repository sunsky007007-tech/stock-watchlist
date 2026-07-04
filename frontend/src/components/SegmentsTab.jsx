import { useEffect, useMemo, useState } from "react";
import { fetchSegments } from "../api.js";
import { formatMoney } from "../utils/format.js";

function collectSegmentRows(segments) {
  const rows = [];

  for (const periodBlock of segments) {
    const periodLabel = periodBlock.fiscal_period || periodBlock.report_period || "--";
    const segmentList =
      periodBlock.segments ||
      periodBlock.segment_data ||
      periodBlock.breakdown ||
      periodBlock.items ||
      [];

    if (Array.isArray(segmentList) && segmentList.length) {
      for (const segment of segmentList) {
        rows.push({
          period: periodLabel,
          name: segment.segment_name || segment.name || segment.segment || "--",
          revenue: segment.revenue ?? segment.segment_revenue,
          operatingIncome:
            segment.operating_income ?? segment.segment_operating_income ?? segment.operating_profit,
          assets: segment.assets ?? segment.segment_assets,
          capex: segment.capital_expenditure ?? segment.capex,
        });
      }
      continue;
    }

    for (const [key, value] of Object.entries(periodBlock)) {
      if (
        ["ticker", "report_period", "fiscal_period", "period", "currency", "filing_date"].includes(key)
      ) {
        continue;
      }

      if (value && typeof value === "object" && !Array.isArray(value)) {
        rows.push({
          period: periodLabel,
          name: key,
          revenue: value.revenue,
          operatingIncome: value.operating_income,
          assets: value.assets,
          capex: value.capital_expenditure ?? value.capex,
        });
      }
    }
  }

  return rows;
}

export default function SegmentsTab({ ticker }) {
  const [period, setPeriod] = useState("annual");
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ticker) {
      setSegments([]);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const result = await fetchSegments(ticker, period, 4);
        if (!cancelled) {
          setSegments(result);
        }
      } catch (err) {
        if (!cancelled) {
          setSegments([]);
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

  const rows = useMemo(() => collectSegmentRows(segments), [segments]);

  return (
    <div className="tab-panel">
      <div className="tab-toolbar">
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

      {loading && <div className="tab-empty">分部数据加载中...</div>}
      {error && <div className="tab-error">{error}</div>}

      {!loading && !error && !rows.length && (
        <div className="tab-empty">
          暂无分部财务数据。部分公司或免费套餐可能不提供分部拆解。
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>期间</th>
                <th>分部</th>
                <th>营收</th>
                <th>营业利润</th>
                <th>资产</th>
                <th>资本开支</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.period}-${row.name}-${index}`}>
                  <td>{row.period}</td>
                  <td>{row.name}</td>
                  <td>{formatMoney(row.revenue)}</td>
                  <td>{formatMoney(row.operatingIncome)}</td>
                  <td>{formatMoney(row.assets)}</td>
                  <td>{formatMoney(row.capex)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
