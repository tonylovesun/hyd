$body = @{
    imageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
} | ConvertTo-Json -Compress

$result = Invoke-WebRequest -Uri 'https://jyj.lboxshop.cc/ocr' -Method POST -Body $body -ContentType 'application/json' -TimeoutSec 30
Write-Host "状态码: $($result.StatusCode)"
Write-Host "响应: $($result.Content)"
