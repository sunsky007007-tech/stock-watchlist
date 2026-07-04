import { useEffect, useState } from "react";
import { fetchInstitutionalHoldings } from "../api.js";
import { formatDate, formatMoney } from "../utils/format.js";

export default function HoldingsTab({ ticker }) {
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ticker) {
      setHoldings([]);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const result = await fetchInstitutionalHoldings(ticker, 30);
        if (!cancelled) {
          setHoldings(result);
        }
      } catch (err) {
        if (!cancelled) {
          setHoldings([]);
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
  }, [ticker]);

  if (loading) {
    return <div className="tab-empty">机构持仓加载中...</div>;
  }

  if (error) {
    return <div className="tab-error">{error}</div>;
  }

  if (!holdings.length) {
    return <div className="tab-empty">暂无机构持仓数据</div>;
  }

  const reportPeriod = holdings[0]?.report_period;

  return (
    <div className="tab-panel">
      {reportPeriod && (
        <div className="tab-meta-line">报告期：{formatDate(reportPeriod)}</div>
      )}
      <div className="table-wrap">
        <table className="data-table holdings-table">
          <thead>
            <tr>
              <th>机构</th>
              <th>持股数</th>
              <th>市值</th>
              <th>占比</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((item, index) => {
              const shares = item.shares ?? item.share_count ?? item.quantity;
              const value = item.market_value ?? item.value_usd ?? item.value;
              const weight = item.portfolio_weight ?? item.weight ?? item.percent_of_portfolio;

              return (
                <tr key={`${item.filer_cik}-${item.filer_name}-${index}`}>
                  <td>
                    <div className="filer-name">{item.filer_name || item.investor_name || "--"}</div>
                    {item.filer_cik && <div className="filer-cik">CIK {item.filer_cik}</div>}
                  </td>
                  <td>{shares != null ? Number(shares).toLocaleString() : "--"}</td>
                  <td>{value != null ? formatMoney(value) : "--"}</td>
                  <td>
                    {weight != null
                      ? `${(weight > 1 ? weight : weight * 100).toFixed(2)}%`
                      : "--"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
