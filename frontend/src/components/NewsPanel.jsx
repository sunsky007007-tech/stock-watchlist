function formatNewsDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
  });
}

export default function NewsPanel({ news, loading, ticker }) {
  return (
    <aside className="news-panel">
      <div className="panel-header">
        <h2>相关新闻</h2>
        <span>{ticker || "--"}</span>
      </div>

      {loading && <div className="news-empty">新闻加载中...</div>}

      {!loading && !news?.length && (
        <div className="news-empty">暂无相关新闻</div>
      )}

      {!loading && news?.length > 0 && (
        <ul className="news-list">
          {news.map((item, index) => {
            const title = item.title || item.headline || "无标题";
            const url = item.url || item.link;
            const source = item.source || item.publisher || item.site;
            const date = formatNewsDate(item.published_at || item.date || item.time);

            return (
              <li key={`${title}-${index}`}>
                {url ? (
                  <a href={url} target="_blank" rel="noreferrer">
                    {title}
                  </a>
                ) : (
                  <span>{title}</span>
                )}
                <div className="news-meta">
                  {source && <span>{source}</span>}
                  {date && <span>{date}</span>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
