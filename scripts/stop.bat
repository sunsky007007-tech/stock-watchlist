@echo off
setlocal

echo 正在停止 stock-watchlist 服务...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
  taskkill /PID %%a /F >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do (
  taskkill /PID %%a /F >nul 2>&1
)

echo 已尝试释放 3001 和 5173 端口。
pause
