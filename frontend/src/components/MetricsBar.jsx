import { formatMarketCap, formatPercent, formatRatio } from "../utils/format.js";

const METRIC_ITEMS = [
  { key: "market_cap", label: "市值", format: formatMarketCap },
  { key: "price_to_earnings_ratio", label: "P/E", format: (v) => formatRatio(v, 1) },
  { key: "price_to_sales_ratio", label: "P/S", format: (v) => formatRatio(v, 1) },
  { key: "return_on_equity", label: "ROE", format: (v) => formatPercent(v) },
  { key: "gross_margin", label: "毛利率", format: (v) => formatPercent(v) },
  { key: "operating_margin", label: "营业利润率", format: (v) => formatPercent(v) },
  { key: "revenue_growth", label: "营收增速", format: (v) => formatPercent(v) },
];

export default function MetricsBar({ metrics, loading }) {
  if (loading) {
    return <div className="metrics-bar loading-bar">指标加载中...</div>;
  }

  if (!metrics) {
    return null;
  }

  return (
    <div className="metrics-bar">
      {METRIC_ITEMS.map((item) => (
        <div key={item.key} className="metric-card">
          <span className="metric-label">{item.label}</span>
          <strong className="metric-value">{item.format(metrics[item.key])}</strong>
        </div>
      ))}
    </div>
  );
}
