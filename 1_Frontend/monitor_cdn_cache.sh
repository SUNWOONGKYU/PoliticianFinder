#!/bin/bash

for i in {1..6}; do
  echo "================================================================"
  echo "CDN Cache Check Attempt $i/6 ($(date '+%H:%M:%S'))"
  echo ""

  response=$(curl -X POST https://politicianfinder.com/api/politicians/verify/send-code \
    -H "Content-Type: application/json" \
    -d '{"name":"오세훈","party":"국민의힘","position":"서울특별시장"}' \
    -w "\nHTTP_STATUS:%{http_code}" \
    -s 2>&1)

  status=$(echo "$response" | grep "HTTP_STATUS" | cut -d':' -f2)
  body=$(echo "$response" | sed '/HTTP_STATUS/d')

  echo "HTTP Status: $status"

  if [ "$status" = "200" ]; then
    echo "SUCCESS! CDN Cache Updated - API Working"
    echo ""
    echo "Response:"
    echo "$body" | head -20
    exit 0
  elif [ "$status" = "405" ]; then
    echo "WAITING: Still 405 Error - CDN Cache Not Updated"
  else
    echo "WARNING: Unexpected Status Code: $status"
    echo "Response: $body" | head -10
  fi

  if [ $i -lt 6 ]; then
    echo ""
    echo "Retrying in 5 minutes..."
    sleep 300
  fi
done

echo ""
echo "================================================================"
echo "TIMEOUT: CDN cache not updated after 30 minutes"
echo "RECOMMENDATION: Manual Cache Purge via Vercel Dashboard"
