#!/bin/bash

echo "Starting AI service on port 8000..."
python ai_service/app.py &

echo "Starting Next.js server on port 3000..."
exec npm run start
