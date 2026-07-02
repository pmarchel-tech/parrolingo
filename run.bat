@echo off
start cmd.exe /c "timeout /t 3 >nul && cd /d \"c:\MARCHEL FILES\ANTIGRAVITY\PARROLINGO\" && (echo === Detached Sync Starting === && git add -A && git commit -m \"feat: add app icon + hide floating nav when modal opens\" && git pull origin main --no-rebase && git push origin main && echo === Detached Sync Finished ===) > sync_debug.log 2>&1"
