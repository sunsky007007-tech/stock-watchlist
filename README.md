# 美股自选 K 线看板

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)

带前端界面的美股自选股票系统，支持查看 **1 年 / 2 年** 日 K 线图。后端通过 **Financial Datasets MCP** 获取行情数据。

## 快速体验

```powershell
git clone https://github.com/sunsky007007-tech/stock-watchlist.git
cd stock-watchlist
cd backend && copy .env.example .env
# 编辑 backend\.env，填入你在 https://financialdatasets.ai 申请的 API Key
cd ..
npm install && npm run install:all && npm run dev
```

浏览器打开 http://localhost:5173 。免费档通常可用 **AAPL、MSFT、NVDA、TSLA**。

> 每人需使用自己的 API Key，请勿将 `.env` 提交到 GitHub。

## 截图预览

| 主看板 | 选股器 |
|--------|--------|
| ![主看板](docs/screenshots/dashboard.svg) | ![选股器](docs/screenshots/screener.svg) |

将真实截图保存为 `docs/screenshots/dashboard.png` 与 `screener.png` 后，把上面表格里的 `.svg` 改成 `.png` 即可。详见 [截图说明](docs/screenshots/README.md)。

## 功能

- 自选股票列表（添加 / 删除 / 切换）
- 左侧显示最新价与涨跌幅
- 中间 K 线图 + 估值指标 + 财务/趋势/分部/KPI/业绩/公告/正文/内部人/机构 Tab
- 顶部「选股」弹窗：按财务指标筛选美股并加入自选
- 顶部宏观条：主要央行政策利率（若账号有权限）
- 右侧个股新闻
- 支持 1Y / 2Y 切换

## 架构（前后端分离，推荐保持）

当前项目已经是合理的前后端分离：

| 层级 | 职责 |
|------|------|
| 前端 | 页面、K 线图、自选列表 |
| 后端 | API、MCP 调用、API Key 保护 |
| MCP | 拉取 Financial Datasets 行情 |

**不建议合并成单体**，因为 API Key 不能暴露到浏览器，且 Vite 开发代理已足够简单。

```
前端 (React + Vite + lightweight-charts)
        ↓ REST API
后端 (Express)
        ↓ MCP Client（连接复用）
Financial Datasets MCP (get_stock_prices / get_stock_price)
```

## 前置条件

1. Node.js 18+
2. [Financial Datasets](https://financialdatasets.ai) 账号
3. 在控制台生成 **API Key**（MCP 程序化访问使用同一 Key）

> 说明：Cursor 里的 MCP OAuth 适用于 IDE；独立 Web 应用需使用 API Key 调用 `https://mcp.financialdatasets.ai/api`。

## 安装与运行

### 1. 配置 API Key

```powershell
cd backend
copy .env.example .env
# 编辑 .env，填入 FINANCIAL_DATASETS_API_KEY
```

### 2. 一键启动（推荐）

**方式 A：批处理（两个独立窗口）**

```powershell
scripts\start.bat
```

**方式 B：PowerShell（同一窗口）**

```powershell
scripts\start.ps1
```

**方式 C：npm（项目根目录）**

```powershell
npm install
npm run install:all
npm run dev
```

停止服务：

```powershell
scripts\stop.bat
# 或
scripts\stop.ps1
```

### 3. 分别启动（可选）

```powershell
cd backend && npm run dev
cd frontend && npm run dev
```

浏览器打开：http://localhost:5173

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/watchlist` | 获取自选列表 |
| POST | `/api/watchlist` | 添加股票 `{ "ticker": "NVDA" }` |
| DELETE | `/api/watchlist/:ticker` | 删除股票 |
| GET | `/api/prices/:ticker?years=1` | 获取 K 线（years: 1/2） |
| GET | `/api/snapshot/:ticker` | 获取最新价快照 |
| GET | `/api/snapshots?tickers=NVDA,AAPL` | 批量获取快照 |
| GET | `/api/company/:ticker` | 公司信息（行业、板块等） |
| GET | `/api/companies?tickers=NVDA,AAPL` | 批量公司信息 |
| GET | `/api/metrics/:ticker` | 估值与财务指标快照 |
| GET | `/api/news/:ticker?limit=10` | 个股新闻 |
| GET | `/api/financials/:ticker?period=annual&limit=4` | 三大财务报表（period: annual/quarterly） |
| GET | `/api/earnings/:ticker?limit=8` | 业绩发布记录 |
| GET | `/api/filings/:ticker?limit=20&filing_type=10-K` | SEC 公告（filing_type 可选：10-K/10-Q/8-K） |
| GET | `/api/screener/filters` | 选股器可用字段与运算符 |
| POST | `/api/screener` | 选股筛选 `{ "filters": [...], "limit": 25 }` |
| GET | `/api/insider-trades/:ticker?limit=50` | 内部人交易记录 |
| GET | `/api/institutional-holdings/:ticker?limit=30` | 机构 13F 持仓（按 ticker 查持有者） |
| GET | `/api/metrics-history/:ticker?period=annual&limit=12` | 历史财务指标趋势（period: annual/quarterly/ttm） |
| GET | `/api/segments/:ticker?period=annual&limit=4` | 分部财务拆解 |
| GET | `/api/kpi/:ticker?type=metrics&period=quarterly` | KPI（type: metrics/guidance/non_gaap） |
| GET | `/api/filing-items/types` | 可提取的 SEC 公告章节类型 |
| GET | `/api/filing-items/:ticker?filing_type=10-K&year=2025&items=Item-1,Item-7` | SEC 公告正文章节 |
| GET | `/api/macro/interest-rates` | 主要央行政策利率 |

## 数据范围说明

- **1 年 / 2 年**：免费套餐通常可用
- **选股筛选**：部分账号可能返回空结果，取决于套餐数据范围
- **分部财务 / KPI**：通常需要 Pro / Enterprise 套餐
- **宏观利率**：取决于 API 账户余额与权限

## 技术栈

- 前端：React、Vite、TradingView Lightweight Charts
- 后端：Express、@modelcontextprotocol/sdk
- 数据：Financial Datasets MCP

## 开源与贡献

- 协议：[MIT](LICENSE)
- 欢迎 Issue / Pull Request
- 仓库 Topics：`stock-watchlist` `react` `vite` `express` `financial-data` `mcp` `watchlist` `us-stocks` `tradingview-charts`
