#!/bin/bash

# Stop any AI service running on 5005
PID=$(lsof -t -i:5005)
if [ -n "$PID" ]; then
    echo "Stopping AI service on port 5005 (PID: $PID)..."
    kill "$PID"
    echo "AI service stopped."
else
    echo "No AI service found running on port 5005."
fi
