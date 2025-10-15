#!/bin/bash
echo "🚀 Starting backend server..."
cd backend
pip install -r requirements.txt
gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT
