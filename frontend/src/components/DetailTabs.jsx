import { useState } from "react";
import EarningsTab from "./EarningsTab.jsx";
import FilingReaderTab from "./FilingReaderTab.jsx";
import FilingsTab from "./FilingsTab.jsx";
import FinancialsTab from "./FinancialsTab.jsx";
import HoldingsTab from "./HoldingsTab.jsx";
import InsiderTab from "./InsiderTab.jsx";
import KpiTab from "./KpiTab.jsx";
import MetricsTrendTab from "./MetricsTrendTab.jsx";
import SegmentsTab from "./SegmentsTab.jsx";

const TABS = [
  { id: "financials", label: "财务" },
  { id: "trends", label: "趋势" },
  { id: "segments", label: "分部" },
  { id: "kpi", label: "KPI" },
  { id: "earnings", label: "业绩" },
  { id: "filings", label: "公告" },
  { id: "reader", label: "正文" },
  { id: "insider", label: "内部人" },
  { id: "holdings", label: "机构" },
];

export default function DetailTabs({ ticker }) {
  const [activeTab, setActiveTab] = useState("financials");

  return (
    <section className="detail-tabs">
      <div className="detail-tab-nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? "active" : ""}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="detail-tab-content">
        {activeTab === "financials" && <FinancialsTab ticker={ticker} />}
        {activeTab === "trends" && <MetricsTrendTab ticker={ticker} />}
        {activeTab === "segments" && <SegmentsTab ticker={ticker} />}
        {activeTab === "kpi" && <KpiTab ticker={ticker} />}
        {activeTab === "earnings" && <EarningsTab ticker={ticker} />}
        {activeTab === "filings" && <FilingsTab ticker={ticker} />}
        {activeTab === "reader" && <FilingReaderTab ticker={ticker} />}
        {activeTab === "insider" && <InsiderTab ticker={ticker} />}
        {activeTab === "holdings" && <HoldingsTab ticker={ticker} />}
      </div>
    </section>
  );
}
