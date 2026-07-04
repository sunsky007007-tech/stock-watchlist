import { useEffect, useState } from "react";
import { fetchFilings } from "../api.js";
import { formatDate } from "../utils/format.js";

const FILING_FILTERS = [
  { id: "", label: "全部" },
  { id: "10-K", label: "10-K" },
  { id: "10-Q", label: "10-Q" },
  { id: "8-K", label: "8-K" },
];

export default function FilingsTab({ ticker }) {
  const [filingType, setFilingType] = useState("");
  const [filings, setFilings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ticker) {
      setFilings([]);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const result = await fetchFilings(ticker, 20, filingType || undefined);
        if (!cancelled) {
          setFilings(result);
        }
      } catch (err) {
        if (!cancelled) {
          setFilings([]);
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
  }, [ticker, filingType]);

  return (
    <div className="tab-panel">
      <div className="tab-toolbar">
        <div className="segment-switch">
          {FILING_FILTERS.map((item) => (
            <button
              key={item.id || "all"}
              className={filingType === item.id ? "active" : ""}
              onClick={() => setFilingType(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="tab-empty">公告加载中...</div>}
      {error && <div className="tab-error">{error}</div>}

      {!loading && !error && !filings.length && (
        <div className="tab-empty">暂无 SEC 公告</div>
      )}

      {!loading && !error && filings.length > 0 && (
        <ul className="filings-list">
          {filings.map((item, index) => {
            const type = item.filing_type || item.form_type || item.type || "Filing";
            const date = item.filing_date || item.report_date || item.date;
            const url = item.filing_url || item.url || item.document_url;

            return (
              <li key={`${type}-${date}-${index}`}>
                <div className="filing-main">
                  <strong>{type}</strong>
                  <span>{formatDate(date)}</span>
                </div>
                <div className="filing-meta">
                  <span>{item.report_period || item.accession_number || ""}</span>
                  {url && (
                    <a href={url} target="_blank" rel="noreferrer">
                      打开文件
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
