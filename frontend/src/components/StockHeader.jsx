import { formatDataError, isValidSnapshot } from "../utils/dataStatus.js";

export default function StockHeader({ ticker, company, snapshot, loading, dataError }) {
  if (!ticker) {
    return (
      <div className="stock-header">
        <h2>请选择股票</h2>
      </div>
    );
  }

  const hasData = isValidSnapshot(snapshot);
  const change = hasData ? snapshot.day_change_percent : null;
  const changeClass = change > 0 ? "up" : change < 0 ? "down" : "flat";

  return (
    <div className="stock-header">
      <div>
        <div className="stock-title-row">
          <h2>{ticker}</h2>
          {company?.name && <span className="company-name">{company.name}</span>}
        </div>
        <p className="stock-subtitle">
          {company?.sector || (dataError ? "数据不可用" : "未知板块")}
          {company?.industry ? ` · ${company.industry}` : ""}
          {company?.exchange ? ` · ${company.exchange}` : ""}
        </p>
        {dataError && !hasData && (
          <p className="stock-data-warning">{formatDataError(dataError)}</p>
        )}
      </div>

      <div className="stock-price-block">
        {loading && !hasData && !dataError ? (
          <span className="loading">加载中...</span>
        ) : (
          <>
            <strong className="stock-price">
              {hasData ? `$${snapshot.price.toFixed(2)}` : "--"}
            </strong>
            <span className={changeClass}>
              {change != null ? `${change > 0 ? "+" : ""}${change.toFixed(2)}%` : "--"}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
