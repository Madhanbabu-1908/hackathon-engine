@echo off
title TCS GenAI Lab - Hackathon Engine
color 0B

echo.
echo  ============================================================
echo   TCS GenAI Lab - Hackathon Orchestration Engine
echo   Enter as a Learner - Exit as an AI Engineer
echo  ============================================================
echo.

cd /d "%~dp0"

start "Hackathon Server" cmd /k "cd server && npm run dev"
timeout /t 3 /nobreak > nul
start "Hackathon Client" cmd /k "cd client && npm run dev"
timeout /t 4 /nobreak > nul
start http://localhost:5173

echo  Engine running! Two terminal windows opened.
timeout /t 3 /nobreak > nul
exit
