# 截图说明

将界面截图放在本目录，README 会自动展示。建议文件名：

| 文件名 | 内容 |
|--------|------|
| `dashboard.png` | 主看板：自选列表 + K 线 + 指标 + 新闻 |
| `screener.png` | 选股弹窗 |
| `financials.png` | 财务 / 趋势 Tab（可选） |

## 如何截图

1. 本地启动项目：`npm run dev`，打开 http://localhost:5173
2. 选一只免费档可用的股票（如 AAPL、NVDA）
3. Windows：`Win + Shift + S` 区域截图，或浏览器全页截图
4. 保存为 PNG，放入本目录，覆盖上述文件名
5. 提交并推送到 GitHub：

```powershell
git add docs/screenshots/
git commit -m "Add project screenshots"
git push
```

## 建议

- 宽度 1200–1600px，PNG 格式
- 截图前关闭无关窗口，界面尽量完整
- 不要截图含 API Key 的 `.env` 或终端敏感信息
