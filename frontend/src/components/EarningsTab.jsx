import { useEffect, useState } from "react";
import { fetchEarnings } from "../api.js";
import { formatDate, formatMoney } from "../utils/format.js";

function EarningsBlock({ title, block }) {
  if (!block) {
    return null;
  }

  return (
    <div className="earnings-block">
      <h4>{title}</h4>
      <div className="earnings-grid">
        <span>营收</span>
        <strong>{formatMoney(block.revenue)}</strong>
        <span>净利润</span>
        <strong>{formatMoney(block.net_income)}</strong>
        <span>EPS</span>
        <strong>{block.eps ?? block.earnings_per_share ?? "--"}</strong>
      </div>
    </div>
  );
}

export default function EarningsTab({ ticker }) {
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ticker) {
      setEarnings([]);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const result = await fetchEarnings(ticker, 8);
        if (!cancelled) {
          setEarnings(result);
        }
      } catch (err) {
        if (!cancelled) {
          setEarnings([]);
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
    return <div className="tab-empty">业绩数据加载中...</div>;
  }

  if (error) {
    return <div className="tab-error">{error}</div>;
  }

  if (!earnings.length) {
    return <div className="tab-empty">暂无业绩数据</div>;
  }

  return (
    <div className="tab-panel">
      <ul className="earnings-list">
        {earnings.map((item, index) => (
          <li key={`${item.report_period}-${item.filing_date}-${index}`}>
            <div className="earnings-header">
              <div>
                <strong>{item.fiscal_period || item.report_period}</strong>
                <span>{item.source_type || "SEC Filing"}</span>
              </div>
              <span>{formatDate(item.filing_date || item.report_period)}</span>
            </div>
            <EarningsBlock title="季度" block={item.quarterly} />
            <EarningsBlock title="年度" block={item.annual} />
            {item.filing_url && (
              <a href={item.filing_url} target="_blank" rel="noreferrer">
                查看 SEC 文件
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
