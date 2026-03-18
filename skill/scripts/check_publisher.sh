#!/bin/bash
# Quick publisher check

domain=$1
if [ -z "$domain" ]; then
  echo "Usage: $0 <domain>"
  exit 1
fi

json=$(opensincera "$domain" 2>&1)
if [ $? -ne 0 ]; then
  echo "❌ $domain: Not found in OpenSincera"
  exit 1
fi

name=$(echo "$json" | jq -r '.name')
verified=$(echo "$json" | jq -r '.visit_enabled')
paths=$(echo "$json" | jq -r '.total_supply_paths')
ratio=$(echo "$json" | jq -r '.avg_ads_to_content_ratio')

echo "Publisher: $name"
echo "Domain: $domain"
echo "Verified: $([ "$verified" = "true" ] && echo "✓ Yes" || echo "✗ No")"
echo "Supply Paths: $paths"
echo "Ad/Content Ratio: $ratio"
