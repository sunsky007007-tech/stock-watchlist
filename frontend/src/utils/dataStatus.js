export function isValidSnapshot(snapshot) {
  return Boolean(snapshot && typeof snapshot === "object" && snapshot.price != null);
}

export function isValidCompany(company) {
  return Boolean(company && typeof company === "object" && (company.name || company.sector));
}

export function formatDataError(message) {
  if (!message) {
    return "暂无数据";
  }

  if (message.includes("add more credits") || message.includes("balance is $0")) {
    return "Financial Datasets API 余额不足，无法拉取该股票数据";
  }

  if (message.includes("valid ticker")) {
    return "无效的股票代码";
  }

  if (message.includes("end_date must be today")) {
    return "行情日期同步中，请稍后刷新（美东交易日边界）";
  }

  if (message.startsWith("Error fetching")) {
    return message.replace(/^Error fetching [^:]+:\s*/, "");
  }

  if (
    message.includes("-32000") ||
    message.includes("Connection closed") ||
    message.includes("connection closed") ||
    message.startsWith("MCP error")
  ) {
    return "Financial Datasets 连接暂时中断，请稍后刷新重试";
  }

  return message;
}
