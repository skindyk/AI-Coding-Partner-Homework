#!/usr/bin/env bash
# run.sh — Start the demo API server
# Usage: bash homework-4/demo/run.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$SCRIPT_DIR/../demo-bug-fix"

echo "================================================"
echo "  Homework 4 — Bug-Fixed Demo API"
echo "================================================"
echo ""
echo "Starting server at http://localhost:3000 ..."
echo "Press Ctrl+C to stop."
echo ""

cd "$APP_DIR"

# Install deps if node_modules missing
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
  echo ""
fi

npm start
