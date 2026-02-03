#!/bin/bash

# Customer Support Ticket System - Sample API Requests Script
# This script demonstrates all API endpoints using curl

BASE_URL="http://localhost:3000/api"
HEALTH_URL="http://localhost:3000/health"

echo "======================================"
echo " API Testing Script"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if server is running
echo -e "${BLUE}[1/12] Checking server health...${NC}"
curl -s "$HEALTH_URL" | jq '.'
echo ""
sleep 1

# Create a ticket
echo -e "${BLUE}[2/12] Creating a new ticket...${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/tickets" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "demo_001",
    "customer_email": "demo@example.com",
    "customer_name": "Demo User",
    "subject": "Cannot login to my account",
    "description": "I have been unable to login for the past 2 hours. Password reset is not working.",
    "category": "account_access",
    "priority": "high"
  }')
echo "$RESPONSE" | jq '.'
TICKET_ID=$(echo "$RESPONSE" | jq -r '.ticket.id')
echo -e "${GREEN}Created ticket ID: $TICKET_ID${NC}"
echo ""
sleep 1

# Create ticket with auto-classification
echo -e "${BLUE}[3/12] Creating ticket with auto-classification...${NC}"
curl -s -X POST "$BASE_URL/tickets?auto_classify=true" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "demo_002",
    "customer_email": "billing@example.com",
    "customer_name": "Jane Smith",
    "subject": "Double charged for subscription",
    "description": "I was charged twice this month and need a refund for the duplicate payment.",
    "category": "other",
    "priority": "medium"
  }' | jq '.'
echo ""
sleep 1

# Get all tickets
echo -e "${BLUE}[4/12] Getting all tickets...${NC}"
curl -s "$BASE_URL/tickets" | jq '.tickets | length as $count | "Total tickets: \($count)"'
echo ""
sleep 1

# Get specific ticket
echo -e "${BLUE}[5/12] Getting ticket by ID...${NC}"
curl -s "$BASE_URL/tickets/$TICKET_ID" | jq '.'
echo ""
sleep 1

# Filter tickets
echo -e "${BLUE}[6/12] Filtering tickets by category...${NC}"
curl -s "$BASE_URL/tickets?category=account_access" | jq '.count as $count | "Found \($count) account_access tickets"'
echo ""
sleep 1

# Update ticket
echo -e "${BLUE}[7/12] Updating ticket status to in_progress...${NC}"
curl -s -X PUT "$BASE_URL/tickets/$TICKET_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "assigned_to": "support_agent_1"
  }' | jq '.'
echo ""
sleep 1

# Auto-classify ticket
echo -e "${BLUE}[8/12] Running auto-classification...${NC}"
curl -s -X POST "$BASE_URL/tickets/$TICKET_ID/auto-classify" | jq '.classification'
echo ""
sleep 1

# Bulk import (JSON)
echo -e "${BLUE}[9/12] Bulk importing tickets from JSON...${NC}"
curl -s -X POST "$BASE_URL/tickets/import" \
  -H "Content-Type: application/json" \
  -d '{
    "file_type": "json",
    "file_content": "[{\"customer_id\":\"bulk_001\",\"customer_email\":\"bulk1@test.com\",\"customer_name\":\"Bulk User 1\",\"subject\":\"Bulk import test 1\",\"description\":\"This ticket was imported via bulk import API\"},{\"customer_id\":\"bulk_002\",\"customer_email\":\"bulk2@test.com\",\"customer_name\":\"Bulk User 2\",\"subject\":\"Bulk import test 2\",\"description\":\"Another ticket imported via bulk import\"}]"
  }' | jq '.summary'
echo ""
sleep 1

# Get audit logs
echo -e "${BLUE}[10/12] Getting audit logs...${NC}"
curl -s "$BASE_URL/audit-logs" | jq '.count as $count | "Total audit logs: \($count)"'
echo ""
sleep 1

# Get audit logs for specific ticket
echo -e "${BLUE}[11/12] Getting audit logs for ticket $TICKET_ID...${NC}"
curl -s "$BASE_URL/audit-logs?ticket_id=$TICKET_ID" | jq '.'
echo ""
sleep 1

# Get statistics
echo -e "${BLUE}[12/12] Getting classification statistics...${NC}"
curl -s "$BASE_URL/audit-stats" | jq '.statistics'
echo ""

echo -e "${GREEN}======================================"
echo " All API tests completed!"
echo "======================================${NC}"
echo ""
echo "Note: You can delete the test ticket with:"
echo "curl -X DELETE $BASE_URL/tickets/$TICKET_ID"
