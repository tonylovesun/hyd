@echo off
chcp 65001 >nul
echo ========================================
echo   简医记 - 微信小程序上传工具
echo ========================================
echo.

set CLI_PATH="D:\Program Files (x86)\微信web开发者工具\cli.bat"
set PROJECT_PATH=G:\miniprogram\hyd
set APPID=wx4f599453c329d464

REM 获取版本号（如果未提供参数，使用 package.json 中的版本）
if "%~1"=="" (
    for /f "tokens=2 delims=:," %%a in ('findstr /C:"version" %PROJECT_PATH%\package.json') do (
        set VERSION=%%~a
        set VERSION=!VERSION:"=!
        set VERSION=!VERSION: =!
    )
) else (
    set VERSION=%~1
)

REM 获取描述（如果未提供，使用当前时间）
if "%~2"=="" (
    set DESC=本地 CLI 上传 - %date% %time%
) else (
    set DESC=%~2
)

echo 项目路径: %PROJECT_PATH%
echo 版本号: %VERSION%
echo 描述: %DESC%
echo.

echo 正在启动微信开发者工具并上传...
echo （如果开发者工具未启动，会先启动它）
echo.

%CLI_PATH% upload ^
    --project %PROJECT_PATH% ^
    --appid %APPID% ^
    --version %VERSION% ^
    --desc %DESC%

if %errorlevel% neq 0 (
    echo.
    echo [错误] 上传失败！
    pause
    exit /b 1
)

echo.
echo [成功] 上传完成！
echo.
echo 请到微信公众平台确认：
echo https://mp.weixin.qq.com
echo.
pause
