$imgPath = "C:\Users\ADMINI~1\AppData\Local\Temp\1\workbuddy-weixin-media\inbound\weixin-img-a7608185b84fc82f.jpg"
$bytes = [System.IO.File]::ReadAllBytes($imgPath)
$base64 = [Convert]::ToBase64String($bytes)

$body = @{
    imageBase64 = $base64
} | ConvertTo-Json -Compress

$headers = @{
    'Content-Type' = 'application/json'
}

try {
    $response = Invoke-WebRequest -Uri 'https://jyj.lboxshop.cc/ocr' -Method POST -Headers $headers -Body $body -TimeoutSec 60
    $response.Content | Out-File -FilePath "G:\miniprogram\hyd\scripts\ocr-result.json" -Encoding UTF8
    Write-Host "OCR结果已保存到 ocr-result.json"
} catch {
    Write-Host "请求失败: $_"
}
