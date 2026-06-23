@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo AXIONYX BID COMPILER DELEGATION LAYER
echo ==========================================

cd /d %~dp0

echo Redirecting to AXIONYX BID COMPILER ENGINE...
cd AXIONYX_BID_COMPILER

call run_build.bat

echo.
echo LEGACY WRAPPER COMPLETE
pause
