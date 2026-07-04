import { useEffect, useState } from "react";
import { fetchInsiderTrades } from "../api.js";
import { formatDate, formatMoney } from "../utils/format.js";

const TRANSACTION_LABELS = {
  P: "买入",
  S: "卖出",
  A: "授予",
  M: "行权",
  G: "赠与",
  F: "缴税卖出",
};

function getTransactionLabel(item) {
  const code = item.transaction_code || item.transaction_type || item.type;
  if (typeof code === "string" && TRANSACTION_LABELS[code]) {
    return TRANSACTION_LABELS[code];
  }
  return item.transaction_description || code || "其他";
}

function getTransactionClass(item) {
  const code = item.transaction_code || item.transaction_type || item.type;
  if (code === "P" || code === "A" || code === "M") {
    return "up";
  }
  if (code === "S" || code === "F") {
    return "down";
  }
  return "flat";
}

export default function InsiderTab({ ticker }) {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ticker) {
      setTrades([]);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const result = await fetchInsiderTrades(ticker, 50);
        if (!cancelled) {
          setTrades(result);
        }
      } catch (err) {
        if (!cancelled) {
          setTrades([]);
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
    return <div className="tab-empty">内部人交易加载中...</div>;
  }

  if (error) {
    return <div className="tab-error">{error}</div>;
  }

  if (!trades.length) {
    return <div className="tab-empty">暂无内部人交易记录</div>;
  }

  return (
    <div className="tab-panel">
      <div className="table-wrap">
        <table className="data-table insider-table">
          <thead>
            <tr>
              <th>日期</th>
              <th>内部人</th>
              <th>职务</th>
              <th>类型</th>
              <th>股数</th>
              <th>价格</th>
              <th>金额</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((item, index) => {
              const shares = item.transaction_shares ?? item.shares ?? item.quantity;
              const price = item.transaction_price_per_share ?? item.price_per_share ?? item.price;
              const value = item.transaction_value ?? (shares != null && price != null ? shares * price : null);

              return (
                <tr key={`${item.filing_date}-${item.name}-${index}`}>
                  <td>{formatDate(item.filing_date || item.transaction_date)}</td>
                  <td>{item.name || item.insider_name || "--"}</td>
                  <td>{item.title || item.officer_title || item.relationship || "--"}</td>
                  <td className={getTransactionClass(item)}>{getTransactionLabel(item)}</td>
                  <td>{shares != null ? Number(shares).toLocaleString() : "--"}</td>
                  <td>{price != null ? `$${Number(price).toFixed(2)}` : "--"}</td>
                  <td>{value != null ? formatMoney(value) : "--"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
