$ports = 3001, 5173

foreach ($port in $ports) {
  $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  foreach ($connection in $connections) {
    Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue
  }
}

Write-Host "已尝试停止 3001 和 5173 端口上的服务。"
