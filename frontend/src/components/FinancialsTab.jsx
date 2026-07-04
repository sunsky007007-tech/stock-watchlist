import { useEffect, useState } from "react";
import { fetchFinancials } from "../api.js";
import FinancialTable, {
  BALANCE_ROWS,
  buildPeriodColumns,
  CASHFLOW_ROWS,
  INCOME_ROWS,
} from "./FinancialTable.jsx";

const STATEMENT_TABS = [
  { id: "income", label: "利润表", rows: INCOME_ROWS, key: "income" },
  { id: "balance", label: "资产负债表", rows: BALANCE_ROWS, key: "balance" },
  { id: "cashflow", label: "现金流量表", rows: CASHFLOW_ROWS, key: "cashflow" },
];

export default function FinancialsTab({ ticker }) {
  const [period, setPeriod] = useState("annual");
  const [statement, setStatement] = useState("income");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ticker) {
      setData(null);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const result = await fetchFinancials(ticker, period, 4);
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setData(null);
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

  const active = STATEMENT_TABS.find((item) => item.id === statement);
  const records = data?.[active.key] || [];
  const periods = buildPeriodColumns(records);

  return (
    <div className="tab-panel">
      <div className="tab-toolbar">
        <div className="segment-switch">
          {STATEMENT_TABS.map((item) => (
            <button
              key={item.id}
              className={statement === item.id ? "active" : ""}
              onClick={() => setStatement(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="segment-switch">
          <button
            className={period === "annual" ? "active" : ""}
            onClick={() => setPeriod("annual")}
          >
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

      {loading && <div className="tab-empty">财务数据加载中...</div>}
      {error && <div className="tab-error">{error}</div>}
      {!loading && !error && (
        <FinancialTable rows={active.rows} periods={periods} />
      )}
    </div>
  );
}
