@echo off
title Planboard (SQL Server + tunel)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-planboard.ps1"
echo.
echo El servidor se ha detenido.
pause
