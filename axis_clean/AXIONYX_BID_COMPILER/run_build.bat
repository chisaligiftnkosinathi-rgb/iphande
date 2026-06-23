@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo AXIONYX BID COMPILER ENGINE (ABCE) v1.0
echo ==========================================

cd /d %~dp0

echo Building deterministic SANAS RFI pack...

set BUILD_DATE=%BUILD_DATE%

python -m compiler.main

echo.
echo Build complete.
echo Output: ..\output\SANAS_RFI_PACK
pause
