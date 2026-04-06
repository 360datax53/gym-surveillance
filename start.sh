#!/bin/bash

export PORT=${PORT:-5000}

echo "Starting AI service on port 8000..."
python ai_service/app.py &

echo "Starting Next.js server on port $PORT..."
npm run start
