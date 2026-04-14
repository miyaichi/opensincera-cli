#!/bin/bash
# Quick publisher check

domain=$1
if [ -z "$domain" ]; then
  echo "Usage: $0 <domain>"
  exit 1
fi

json=$(opensincera "$domain" 2>/tmp/opensincera_err)
if [ $? -ne 0 ]; then
  err=$(cat /tmp/opensincera_err)
  echo "❌ $domain: ${err#Error: }"
  exit 1
fi

name=$(echo "$json" | jq -r '.name')
verified=$(echo "$json" | jq -r '.visit_enabled')
paths=$(echo "$json" | jq -r '.total_supply_paths')
ratio=$(echo "$json" | jq -r '.avg_ads_to_content_ratio')
mobile_a2cr=$(echo "$json" | jq -r '.device_level_metrics.mobile.avg_ads_to_content_ratio // "N/A"')
desktop_a2cr=$(echo "$json" | jq -r '.device_level_metrics.desktop.avg_ads_to_content_ratio // "N/A"')

echo "Publisher: $name"
echo "Domain: $domain"
echo "Verified: $([ "$verified" = "true" ] && echo "✓ Yes" || echo "✗ No")"
echo "Supply Paths: $paths"
echo "Ad/Content Ratio (overall):  $ratio"
echo "Ad/Content Ratio (mobile):   $mobile_a2cr"
echo "Ad/Content Ratio (desktop):  $desktop_a2cr"
