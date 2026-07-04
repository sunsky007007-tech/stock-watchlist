@echo off
setlocal
cd /d "%~dp0.."

if not exist "backend\.env" (
  echo [错误] 未找到 backend\.env
  echo 请先复制 backend\.env.example 为 backend\.env 并填入 API Key
  pause
  exit /b 1
)

if not exist "backend\node_modules" (
  echo 正在安装后端依赖...
  npm install --prefix backend
)

if not exist "frontend\node_modules" (
  echo 正在安装前端依赖...
  npm install --prefix frontend
)

echo.
echo 启动后端: http://localhost:3001
echo 启动前端: http://localhost:5173
echo.

start "stock-watchlist-backend" cmd /k "cd /d \"%CD%\backend\" && npm run dev"
start "stock-watchlist-frontend" cmd /k "cd /d \"%CD%\frontend\" && npm run dev"

echo 已在两个独立窗口中启动前后端。
echo 关闭对应窗口即可停止服务。
pause
