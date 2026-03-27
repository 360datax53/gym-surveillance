#!/bin/bash

# Navigate to AI service directory
cd "$(dirname "$0")/ai_service" || exit

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv and install dependencies
source venv/bin/activate
pip install -r requirements.txt

# Stop any existing AI service running on 5005
PIDS=$(lsof -t -i:5005)
if [ -n "$PIDS" ]; then
    echo "Stopping existing AI service on port 5005 (PIDs: $PIDS)..."
    echo "$PIDS" | xargs kill
    sleep 1
fi

# Start the AI service
echo "Starting AI service..."
nohup python app.py > ai_service.log 2>&1 &

echo "AI service started in the background. Logs are available in ai_service/ai_service.log"
echo "Health check: curl http://localhost:5005/health"
