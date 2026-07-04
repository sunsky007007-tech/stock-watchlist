import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const WATCHLIST_FILE = path.join(DATA_DIR, "watchlist.json");

const DEFAULT_WATCHLIST = ["NVDA", "AAPL", "MSFT", "TSLA", "AMD"];

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(WATCHLIST_FILE);
  } catch {
    await fs.writeFile(
      WATCHLIST_FILE,
      JSON.stringify({ tickers: DEFAULT_WATCHLIST }, null, 2),
      "utf8"
    );
  }
}

export async function getWatchlist() {
  await ensureDataFile();
  const raw = await fs.readFile(WATCHLIST_FILE, "utf8");
  const data = JSON.parse(raw);
  return data.tickers || [];
}

export async function addTicker(ticker) {
  const symbol = ticker.trim().toUpperCase();
  if (!symbol) {
    throw badRequest("股票代码不能为空");
  }

  const tickers = await getWatchlist();
  if (tickers.includes(symbol)) {
    return tickers;
  }

  const next = [...tickers, symbol];
  await fs.writeFile(WATCHLIST_FILE, JSON.stringify({ tickers: next }, null, 2), "utf8");
  return next;
}

export async function removeTicker(ticker) {
  const symbol = ticker.trim().toUpperCase();
  const next = (await getWatchlist()).filter((item) => item !== symbol);
  await fs.writeFile(WATCHLIST_FILE, JSON.stringify({ tickers: next }, null, 2), "utf8");
  return next;
}
