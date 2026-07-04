import { useState } from "react";

import { formatDataError, isValidSnapshot } from "../utils/dataStatus.js";

export default function Watchlist({
  tickers,
  selected,
  snapshots,
  companies,
  dataErrors,
  onSelect,
  onAdd,
  onRemove,
}) {
  const [input, setInput] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!input.trim()) return;
    await onAdd(input.trim().toUpperCase());
    setInput("");
  };

  return (
    <aside className="watchlist">
      <div className="panel-header">
        <h2>自选股票</h2>
        <span>{tickers.length} 只</span>
      </div>

      <form className="add-form" onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          placeholder="输入代码，如 NVDA"
        />
        <button type="submit">添加</button>
      </form>

      <ul className="ticker-list">
        {tickers.map((ticker) => {
          const snapshot = snapshots[ticker];
          const company = companies[ticker];
          const dataError = dataErrors[ticker];
          const hasData = isValidSnapshot(snapshot);
          const change = hasData ? snapshot.day_change_percent : null;
          const changeClass =
            change > 0 ? "up" : change < 0 ? "down" : "flat";

          return (
            <li
              key={ticker}
              className={selected === ticker ? "active" : ""}
              onClick={() => onSelect(ticker)}
            >
              <div className="ticker-main">
                <div>
                  <strong>{ticker}</strong>
                  {company?.name && (
                    <div className="ticker-company">{company.name}</div>
                  )}
                </div>
                <button
                  className="remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(ticker);
                  }}
                >
                  ×
                </button>
              </div>
              <div className="ticker-industry">
                {company?.industry || company?.sector || (dataError ? "数据不可用" : "加载公司信息...")}
              </div>
              <div className="ticker-meta">
                <span>{hasData ? `$${snapshot.price.toFixed(2)}` : "--"}</span>
                <span className={changeClass}>
                  {change != null ? `${change.toFixed(2)}%` : dataError ? "无数据" : "--"}
                </span>
              </div>
              {dataError && !hasData && (
                <div className="ticker-warning">{formatDataError(dataError)}</div>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
