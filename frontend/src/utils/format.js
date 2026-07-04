export function formatMarketCap(value) {
  if (value == null || Number.isNaN(value)) {
    return "--";
  }

  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  }

  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  }

  if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  }

  return `$${value.toLocaleString()}`;
}

export function formatPercent(value, digits = 1) {
  if (value == null || Number.isNaN(value)) {
    return "--";
  }

  return `${(value * 100).toFixed(digits)}%`;
}

export function formatRatio(value, digits = 1) {
  if (value == null || Number.isNaN(value)) {
    return "--";
  }

  return value.toFixed(digits);
}

export function formatMoney(value) {
  if (value == null || Number.isNaN(value)) {
    return "--";
  }

  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (abs >= 1e12) {
    return `${sign}$${(abs / 1e12).toFixed(2)}T`;
  }

  if (abs >= 1e9) {
    return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  }

  if (abs >= 1e6) {
    return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  }

  return `${sign}$${abs.toLocaleString()}`;
}

export function formatDate(value) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("zh-CN");
}
