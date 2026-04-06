#!/bin/bash

echo "Starting AI service..."
python ai_service/app.py &

echo "Starting Next.js server..."
exec npm run start
