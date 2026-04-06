#!/bin/bash
set -e

echo "Starting AI service..."
python ai_service/app.py &
AI_PID=$!

echo "Starting Next.js server..."
npm run start &
APP_PID=$!

echo "Both services started (AI PID: $AI_PID, App PID: $APP_PID)"

wait -n
echo "A process exited — restarting..."
kill $AI_PID $APP_PID 2>/dev/null || true
exit 1
