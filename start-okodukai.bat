@echo off
setlocal
cd /d "%~dp0"

set "NODE_EXE=node"
where node >nul 2>nul
if errorlevel 1 set "NODE_EXE="
if not defined NODE_EXE if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" set "NODE_EXE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not defined NODE_EXE if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
if not defined NODE_EXE if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles(x86)%\nodejs\node.exe"

if not defined NODE_EXE (
  echo Node.js is not installed or not on PATH.
  echo Install Node.js, then run this file again.
  pause
  exit /b 1
)

echo Starting Okodukai CYO...
start "" "http://localhost:8787"
"%NODE_EXE%" server.js
pause
