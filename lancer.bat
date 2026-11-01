@echo off
title Gestion Travaux - npm run dev
cd /d "%~dp0"

if not exist node_modules (
  echo Installation des dependances...
  call npm install
)

rem Ouvre le navigateur apres quelques secondes, pendant que le serveur demarre
start "" /min cmd /c "timeout /t 4 /nobreak >nul & start http://localhost:5173"

call npm run dev
pause
