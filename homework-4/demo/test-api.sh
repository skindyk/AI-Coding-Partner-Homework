#!/usr/bin/env bash
# test-api.sh — Tests for the fixed GET /api/users/:id endpoint
# Usage: bash homework-4/demo/test-api.sh [HOST]
#
# Requires the server to be running (bash demo/run.sh in another terminal).
# Requires curl.

HOST="${1:-http://localhost:3000}"
PASS=0
FAIL=0

# ── helpers ──────────────────────────────────────────────────────────────────

green() { printf '\033[32m%s\033[0m\n' "$*"; }
red()   { printf '\033[31m%s\033[0m\n' "$*"; }
bold()  { printf '\033[1m%s\033[0m\n'  "$*"; }
dim()   { printf '\033[2m%s\033[0m\n'  "$*"; }

check() {
  local label="$1"
  local expected_status="$2"
  local expected_body_pattern="$3"
  local url="$4"

  local response
  response=$(curl -s -w "\n__STATUS__%{http_code}" "$url" 2>/dev/null)

  local body status
  body=$(echo "$response" | sed '$d')
  status=$(echo "$response" | tail -1 | sed 's/__STATUS__//')

  local ok=true

  if [ "$status" != "$expected_status" ]; then
    ok=false
  fi

  if [ -n "$expected_body_pattern" ] && ! echo "$body" | grep -q "$expected_body_pattern"; then
    ok=false
  fi

  if $ok; then
    green "  PASS  $label"
    dim   "        status=$status  body=$body"
    PASS=$((PASS + 1))
  else
    red   "  FAIL  $label"
    dim   "        expected status=$expected_status  pattern=$expected_body_pattern"
    dim   "        got      status=$status  body=$body"
    FAIL=$((FAIL + 1))
  fi
}

# ── wait for server ───────────────────────────────────────────────────────────

echo ""
bold "Waiting for server at $HOST ..."
for i in $(seq 1 10); do
  if curl -s "$HOST/health" | grep -q "ok"; then
    green "Server is up."
    break
  fi
  if [ "$i" -eq 10 ]; then
    red "Server did not respond after 10s. Is it running?"
    red "Start it with:  bash homework-4/demo/run.sh"
    exit 1
  fi
  sleep 1
done

echo ""
bold "================================================"
bold "  API Tests — GET /api/users/:id  (bug fixed)"
bold "================================================"
echo ""

# ── health check ─────────────────────────────────────────────────────────────

bold "Health check"
check \
  "GET /health returns 200 ok" \
  "200" \
  '"status":"ok"' \
  "$HOST/health"

echo ""

# ── GET /api/users (all users — unchanged endpoint) ───────────────────────────

bold "GET /api/users — all users (unchanged, should still work)"
check \
  "returns 200 with array of 3 users" \
  "200" \
  '"id":123' \
  "$HOST/api/users"

echo ""

# ── GET /api/users/:id — happy paths (the fixed bug) ─────────────────────────

bold "GET /api/users/:id — valid IDs (bug fix regression tests)"
check \
  "id=123 → 200 Alice Smith" \
  "200" \
  '"name":"Alice Smith"' \
  "$HOST/api/users/123"

check \
  "id=456 → 200 Bob Johnson" \
  "200" \
  '"name":"Bob Johnson"' \
  "$HOST/api/users/456"

check \
  "id=789 → 200 Charlie Brown" \
  "200" \
  '"name":"Charlie Brown"' \
  "$HOST/api/users/789"

echo ""

# ── GET /api/users/:id — 404 paths ───────────────────────────────────────────

bold "GET /api/users/:id — invalid IDs (expected 404)"
check \
  "id=999 (non-existent) → 404" \
  "404" \
  '"error":"User not found"' \
  "$HOST/api/users/999"

check \
  "id=0 (not in array) → 404" \
  "404" \
  '"error":"User not found"' \
  "$HOST/api/users/0"

check \
  "id=abc (non-numeric, parseInt→NaN) → 404" \
  "404" \
  '"error":"User not found"' \
  "$HOST/api/users/abc"

echo ""

# ── summary ──────────────────────────────────────────────────────────────────

bold "================================================"
TOTAL=$((PASS + FAIL))
if [ "$FAIL" -eq 0 ]; then
  green "  RESULT: $PASS/$TOTAL passed — all tests green"
else
  red   "  RESULT: $PASS/$TOTAL passed — $FAIL failed"
fi
bold "================================================"
echo ""

[ "$FAIL" -eq 0 ]
