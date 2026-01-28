#!/bin/bash

# Customer Support Ticket System - Unix/Linux/Mac Start Script

echo "======================================"
echo " Customer Support Ticket System"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "[INFO] Node.js version:"
node --version
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "[INFO] Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to install dependencies!"
        exit 1
    fi
    echo ""
fi

echo "[INFO] Starting the server..."
echo "[INFO] The application will be available at:"
echo "       http://localhost:3000"
echo ""
echo "[INFO] Press Ctrl+C to stop the server"
echo ""

# Start the application
npm start
