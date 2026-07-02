@echo off
echo === Git Sync Script Starting === > sync_debug.log
echo [1] Running git add... >> sync_debug.log
git add -A >> sync_debug.log 2>&1
echo [2] Running git commit... >> sync_debug.log
git commit -m "feat: add app icon + hide floating nav when modal opens" >> sync_debug.log 2>&1
echo [3] Running git pull... >> sync_debug.log
git pull origin main --no-rebase >> sync_debug.log 2>&1
echo [4] Running git push... >> sync_debug.log
git push origin main >> sync_debug.log 2>&1
echo === Git Sync Script Finished === >> sync_debug.log
