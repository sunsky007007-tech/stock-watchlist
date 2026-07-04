import { useEffect, useMemo, useState } from "react";
import { fetchScreenerFilters, runStockScreener } from "../api.js";
import { formatMarketCap, formatPercent, formatRatio } from "../utils/format.js";

const PRESETS = [
  {
    id: "large-cap",
    label: "大盘股",
    filters: [{ field: "market_cap", operator: "gt", value: 100_000_000_000 }],
  },
  {
    id: "value",
    label: "低估值",
    filters: [
      { field: "pe_ratio", operator: "lt", value: 20 },
      { field: "market_cap", operator: "gt", value: 10_000_000_000 },
    ],
  },
  {
    id: "growth",
    label: "高增长",
    filters: [
      { field: "revenue_growth", operator: "gt", value: 0.15 },
      { field: "market_cap", operator: "gt", value: 5_000_000_000 },
    ],
  },
  {
    id: "profitable",
    label: "高盈利",
    filters: [
      { field: "net_income", operator: "gt", value: 1_000_000_000 },
      { field: "gross_margin", operator: "gt", value: 0.4 },
    ],
  },
];

const OPERATORS = [
  { id: "gt", label: ">" },
  { id: "gte", label: ">=" },
  { id: "lt", label: "<" },
  { id: "lte", label: "<=" },
  { id: "eq", label: "=" },
];

const EMPTY_FILTER = { field: "market_cap", operator: "gt", value: "" };

function flattenFilterOptions(filterGroups) {
  if (!filterGroups || typeof filterGroups !== "object") {
    return [];
  }

  const options = [];

  if (filterGroups.metrics) {
    for (const [category, fields] of Object.entries(filterGroups.metrics)) {
      if (!Array.isArray(fields)) {
        continue;
      }

      for (const field of fields) {
        options.push({
          value: field,
          label: `${category} · ${field}`,
        });
      }
    }
  }

  if (filterGroups.company) {
    for (const field of Object.keys(filterGroups.company)) {
      options.push({
        value: field,
        label: `company · ${field}`,
      });
    }
  }

  return options;
}

function formatResultValue(key, value) {
  if (value == null) {
    return "--";
  }

  if (key.includes("margin") || key.includes("growth") || key.includes("return")) {
    return formatPercent(value);
  }

  if (key.includes("ratio") || key === "pe_ratio" || key === "ps_ratio") {
    return formatRatio(value, 1);
  }

  if (key.includes("cap") || key.includes("revenue") || key.includes("income")) {
    return formatMarketCap(value);
  }

  return String(value);
}

export default function ScreenerModal({ open, onClose, onAddTicker, onSelectTicker }) {
  const [filterOptions, setFilterOptions] = useState([]);
  const [customFilters, setCustomFilters] = useState([{ ...EMPTY_FILTER }]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function loadFilters() {
      try {
        const data = await fetchScreenerFilters();
        if (!cancelled) {
          setFilterOptions(flattenFilterOptions(data));
        }
      } catch {
        if (!cancelled) {
          setFilterOptions([]);
        }
      }
    }

    loadFilters();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const fieldSelectOptions = useMemo(() => {
    if (filterOptions.length) {
      return filterOptions;
    }

    return [
      { value: "market_cap", label: "市值 market_cap" },
      { value: "pe_ratio", label: "市盈率 pe_ratio" },
      { value: "revenue", label: "营收 revenue" },
      { value: "net_income", label: "净利润 net_income" },
      { value: "revenue_growth", label: "营收增速 revenue_growth" },
      { value: "gross_margin", label: "毛利率 gross_margin" },
      { value: "sector", label: "板块 sector" },
      { value: "industry", label: "行业 industry" },
    ];
  }, [filterOptions]);

  if (!open) {
    return null;
  }

  async function runScreen(filters) {
    try {
      setLoading(true);
      setError("");
      const nextResults = await runStockScreener(filters, 25);
      setResults(nextResults);
      setCustomFilters(filters.map((item) => ({ ...item, value: String(item.value) })));
    } catch (err) {
      setResults([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function updateFilter(index, key, value) {
    setCustomFilters((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      )
    );
  }

  function addFilterRow() {
    setCustomFilters((current) => [...current, { ...EMPTY_FILTER }]);
  }

  function removeFilterRow(index) {
    setCustomFilters((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function handleRunCustom() {
    const filters = customFilters
      .filter((item) => item.field && item.operator && item.value !== "")
      .map((item) => {
        const numeric = Number(item.value);
        return {
          field: item.field,
          operator: item.operator,
          value: Number.isNaN(numeric) ? item.value : numeric,
        };
      });

    if (!filters.length) {
      setError("请至少填写一条有效筛选条件");
      return;
    }

    runScreen(filters);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel screener-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>选股筛选</h2>
            <p>基于 Financial Datasets 财务指标筛选美股</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="screener-presets">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              disabled={loading}
              onClick={() => runScreen(preset.filters)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="screener-filters">
          {customFilters.map((filter, index) => (
            <div className="filter-row" key={`filter-${index}`}>
              <select
                value={filter.field}
                onChange={(e) => updateFilter(index, "field", e.target.value)}
              >
                {fieldSelectOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={filter.operator}
                onChange={(e) => updateFilter(index, "operator", e.target.value)}
              >
                {OPERATORS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                value={filter.value}
                onChange={(e) => updateFilter(index, "value", e.target.value)}
                placeholder="数值或文本"
              />
              <button
                className="filter-remove"
                onClick={() => removeFilterRow(index)}
                disabled={customFilters.length === 1}
              >
                删除
              </button>
            </div>
          ))}
        </div>

        <div className="screener-actions">
          <button onClick={addFilterRow}>添加条件</button>
          <button className="primary" disabled={loading} onClick={handleRunCustom}>
            {loading ? "筛选中..." : "开始筛选"}
          </button>
        </div>

        {error && <div className="tab-error screener-error">{error}</div>}

        <div className="screener-results">
          <div className="screener-results-header">
            <strong>筛选结果</strong>
            <span>{results.length} 只</span>
          </div>

          {!loading && !results.length && (
            <div className="tab-empty">
              暂无匹配股票。可尝试调整条件；若账号为免费套餐，选股结果可能受限。
            </div>
          )}

          {results.length > 0 && (
            <ul className="screener-list">
              {results.map((item) => {
                const ticker = item.ticker || item.symbol;
                const metrics = Object.entries(item).filter(
                  ([key]) => !["ticker", "symbol", "name", "company_name"].includes(key)
                );

                return (
                  <li key={ticker}>
                    <div className="screener-item-main">
                      <div>
                        <strong>{ticker}</strong>
                        <span>{item.name || item.company_name || ""}</span>
                      </div>
                      <div className="screener-item-actions">
                        <button onClick={() => onSelectTicker?.(ticker)}>查看</button>
                        <button onClick={() => onAddTicker?.(ticker)}>加入自选</button>
                      </div>
                    </div>
                    <div className="screener-metrics">
                      {metrics.slice(0, 6).map(([key, value]) => (
                        <span key={key}>
                          {key}: {formatResultValue(key, value)}
                        </span>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
