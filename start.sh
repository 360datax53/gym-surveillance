#!/bin/bash

export PORT=${PORT:-3000}

echo "Starting AI service on port 8000..."
python ai_service/app.py &

echo "Starting Next.js server on port $PORT..."
exec npx next start -p $PORT -H 0.0.0.0
