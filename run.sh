#!/bin/sh
(sleep 3 && git add -A && git commit -m "feat: add app icon + hide floating nav when modal opens" && git pull origin main --no-rebase && git push origin main) > sync_debug.log 2>&1 &
