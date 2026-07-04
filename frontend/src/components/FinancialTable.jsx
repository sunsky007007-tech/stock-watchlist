import { formatMoney } from "../utils/format.js";

export default function FinancialTable({ rows, periods, emptyText = "暂无数据" }) {
  if (!periods?.length) {
    return <div className="tab-empty">{emptyText}</div>;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>项目</th>
            {periods.map((period) => (
              <th key={period.key}>{period.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td>{row.label}</td>
              {periods.map((period) => (
                <td key={`${row.key}-${period.key}`}>
                  {row.format
                    ? row.format(period.record[row.key])
                    : period.record[row.key] ?? "--"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function buildPeriodColumns(records) {
  return records.map((record) => ({
    key: record.report_period || record.fiscal_period,
    label: record.fiscal_period || record.report_period || "--",
    record,
  }));
}

export const INCOME_ROWS = [
  { key: "revenue", label: "营收", format: formatMoney },
  { key: "gross_profit", label: "毛利润", format: formatMoney },
  { key: "operating_income", label: "营业利润", format: formatMoney },
  { key: "net_income", label: "净利润", format: formatMoney },
  { key: "earnings_per_share_diluted", label: "稀释 EPS" },
];

export const BALANCE_ROWS = [
  { key: "total_assets", label: "总资产", format: formatMoney },
  { key: "total_liabilities", label: "总负债", format: formatMoney },
  { key: "shareholders_equity", label: "股东权益", format: formatMoney },
  { key: "cash_and_equivalents", label: "现金及等价物", format: formatMoney },
  { key: "inventory", label: "存货", format: formatMoney },
];

export const CASHFLOW_ROWS = [
  { key: "net_cash_flow_from_operations", label: "经营现金流", format: formatMoney },
  { key: "net_cash_flow_from_investing", label: "投资现金流", format: formatMoney },
  { key: "net_cash_flow_from_financing", label: "融资现金流", format: formatMoney },
  { key: "free_cash_flow", label: "自由现金流", format: formatMoney },
];
