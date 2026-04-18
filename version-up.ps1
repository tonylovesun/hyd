# 自动递增版本号脚本
# 用法: .\version-up.ps1 [版本号]
# 不带参数时自动递增 patch 版本

param(
    [string]$NewVersion = ""
)

$appJsPath = "G:\miniprogram\hyd\app.js"

if ($NewVersion -eq "") {
    # 读取当前版本
    $lines = Get-Content $appJsPath
    foreach ($line in $lines) {
        if ($line -match "VERSION:\s*'([\d.]+)'") {
            $current = $Matches[1]
            $parts = $current -split '\.'
            $parts[2] = [int]$parts[2] + 1
            $NewVersion = $parts -join '.'
            break
        }
    }
    if ($NewVersion -eq "") {
        $NewVersion = "1.0.0"
    }
}

# 逐行替换，保持原有格式
$output = @()
$found = $false
foreach ($line in (Get-Content $appJsPath)) {
    if ($line -match "VERSION:\s*'[0-9.]+'" -and -not $found) {
        $output += "    VERSION: '$NewVersion', // 统一版本号"
        $found = $true
    } else {
        $output += $line
    }
}

Set-Content -Path $appJsPath -Value $output -Encoding UTF8
Write-Host "版本号已更新为: $NewVersion"
