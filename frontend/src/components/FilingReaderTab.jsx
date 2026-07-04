import { useEffect, useState } from "react";
import { fetchFilingItems, fetchFilings } from "../api.js";
import { formatDate } from "../utils/format.js";

const DEFAULT_ITEMS = {
  "10-K": ["Item-1", "Item-1A", "Item-7"],
  "10-Q": ["Item-1", "Item-2"],
  "8-K": ["Item-2.02"],
};

function getFilingParams(filing) {
  const type = filing.filing_type || filing.form_type || filing.type;
  const date = filing.filing_date || filing.report_date || filing.date;
  const year = date ? new Date(date).getFullYear() : undefined;
  const quarter = date ? Math.ceil((new Date(date).getMonth() + 1) / 3) : undefined;

  return {
    filing_type: type,
    year,
    quarter,
    accession_number: filing.accession_number,
    items: DEFAULT_ITEMS[type] || ["Item-1"],
  };
}

function extractSections(content) {
  if (!content) {
    return [];
  }

  if (Array.isArray(content)) {
    return content;
  }

  if (Array.isArray(content.items)) {
    return content.items;
  }

  return [];
}

export default function FilingReaderTab({ ticker }) {
  const [filings, setFilings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [sections, setSections] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ticker) {
      setFilings([]);
      setSelected(null);
      setSections([]);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoadingList(true);
        setError("");
        const result = await fetchFilings(ticker, 15, undefined);
        const supported = result.filter((item) => {
          const type = item.filing_type || item.form_type || item.type;
          return ["10-K", "10-Q", "8-K"].includes(type);
        });
        if (!cancelled) {
          setFilings(supported);
          setSelected(null);
          setSections([]);
        }
      } catch (err) {
        if (!cancelled) {
          setFilings([]);
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoadingList(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [ticker]);

  async function handleRead(filing) {
    const params = getFilingParams(filing);
    if (!params.filing_type) {
      setError("无法识别公告类型");
      return;
    }

    try {
      setLoadingContent(true);
      setError("");
      setSelected(filing);
      const content = await fetchFilingItems(ticker, params);
      setSections(extractSections(content));
    } catch (err) {
      setSections([]);
      setError(err.message);
    } finally {
      setLoadingContent(false);
    }
  }

  return (
    <div className="tab-panel filing-reader">
      {loadingList && <div className="tab-empty">公告列表加载中...</div>}
      {error && <div className="tab-error">{error}</div>}

      {!loadingList && !filings.length && (
        <div className="tab-empty">暂无可阅读的 SEC 公告</div>
      )}

      {filings.length > 0 && (
        <ul className="filings-list compact-filings-list">
          {filings.map((item, index) => {
            const type = item.filing_type || item.form_type || item.type;
            const date = item.filing_date || item.report_date || item.date;
            const isActive =
              selected &&
              (selected.accession_number || selected.filing_date) ===
                (item.accession_number || item.filing_date);

            return (
              <li key={`${type}-${date}-${index}`} className={isActive ? "active" : ""}>
                <div className="filing-main">
                  <strong>{type}</strong>
                  <span>{formatDate(date)}</span>
                </div>
                <button onClick={() => handleRead(item)} disabled={loadingContent}>
                  {loadingContent && isActive ? "加载中..." : "阅读正文"}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {sections.length > 0 && (
        <div className="filing-sections">
          {sections.map((section, index) => (
            <article key={`${section.number || section.title}-${index}`} className="filing-section">
              <h4>
                {section.number || section.item || `Section ${index + 1}`}
                {section.title ? ` · ${section.title}` : ""}
              </h4>
              <div className="filing-section-text">
                {(section.text || section.content || "").slice(0, 12000)}
                {(section.text || section.content || "").length > 12000 && "..."}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
