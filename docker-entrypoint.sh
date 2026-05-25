#!/bin/sh
cd /app

# Health trước — Fly proxy /health vẫn OK khi chưa có appstate
node scripts/fly-health.js &
echo "[fly] health server PID $! — http://0.0.0.0:${PORT:-8080}/health"

node scripts/prepare-deploy.js
PREPARE_EXIT=$?

if [ "$PREPARE_EXIT" -ne 0 ]; then
  echo "=============================================="
  echo "[fly] THIEU APPSTATE — bot chua the dang nhap Facebook"
  echo ""
  echo "Cach 1 — day appstate len GitHub (nhanh nhat):"
  echo "  Copy appstate.json -> data/appstate.json"
  echo "  git add data/appstate.json && git push"
  echo "  fly deploy -a bot-kurumi"
  echo ""
  echo "Cach 2 — secrets:"
  echo '  .\scripts\set-fly-secrets.ps1 -App bot-kurumi'
  echo ""
  echo "Cach 3 — SSH upload:"
  echo "  fly ssh console -a bot-kurumi"
  echo "  (tao file /app/appstate.json roi restart)"
  echo "=============================================="
  # Khong exit — giu may chay de /health pass + fly ssh
  exec sleep infinity
fi

exec npm start
