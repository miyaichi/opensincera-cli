#!/bin/bash
# Batch verification
#
# Usage: batch_verify.sh <input_file> [output_file] [--device mobile|desktop]

input_file=$1
output_file=${2:-verified_publishers.csv}
device=""

# Parse optional --device flag
for arg in "$@"; do
  if [ "$prev" = "--device" ]; then
    device="$arg"
  fi
  prev="$arg"
done

if [ -z "$input_file" ]; then
  echo "Usage: $0 <input_file> [output_file] [--device mobile|desktop]"
  exit 1
fi

if [ ! -f "$input_file" ]; then
  echo "Error: Input file not found: $input_file"
  exit 1
fi

if [ -n "$device" ] && [ "$device" != "mobile" ] && [ "$device" != "desktop" ]; then
  echo "Error: --device must be 'mobile' or 'desktop'"
  exit 1
fi

# CSV-escape a value per RFC 4180
csv_escape() {
  local val="$1"
  if echo "$val" | grep -qE '[,"\n\r]'; then
    val="${val//\"/\"\"}"
    echo "\"$val\""
  else
    echo "$val"
  fi
}

# Write header
if [ -n "$device" ]; then
  echo "domain,name,verified,supply_paths,ad_ratio,device,device_a2cr,avg_ad_units_in_view,avg_refresh_rate,pct_slots_with_refresh" > "$output_file"
else
  echo "domain,name,verified,supply_paths,ad_ratio" > "$output_file"
fi

count=0
while read domain; do
  # Skip empty lines and comments
  [[ -z "$domain" || "$domain" =~ ^# ]] && continue

  count=$((count + 1))
  echo -n "[$count] Processing $domain..."

  json=$(opensincera "$domain" 2>/dev/null)
  if [ $? -eq 0 ]; then
    name=$(echo "$json" | jq -r '.name // "Unknown"')
    verified=$(echo "$json" | jq -r '.visit_enabled')
    paths=$(echo "$json" | jq -r '.total_supply_paths // 0')
    ratio=$(echo "$json" | jq -r '.avg_ads_to_content_ratio // 0')

    row="$(csv_escape "$domain"),$(csv_escape "$name"),$verified,$paths,$ratio"

    if [ -n "$device" ]; then
      d_a2cr=$(echo "$json" | jq -r ".device_level_metrics.${device}.avg_ads_to_content_ratio // \"\"")
      d_aiv=$(echo "$json" | jq -r ".device_level_metrics.${device}.avg_ad_units_in_view // \"\"")
      d_refresh=$(echo "$json" | jq -r ".device_level_metrics.${device}.average_refresh_rate // \"\"")
      d_pct=$(echo "$json" | jq -r ".device_level_metrics.${device}.percentage_of_ad_slots_with_refresh // \"\"")
      row="$row,$device,$d_a2cr,$d_aiv,$d_refresh,$d_pct"
    fi

    echo "$row" >> "$output_file"
    echo " ✓"
  else
    if [ -n "$device" ]; then
      echo "$(csv_escape "$domain"),NOT_FOUND,false,0,0,$device,,,," >> "$output_file"
    else
      echo "$(csv_escape "$domain"),NOT_FOUND,false,0,0" >> "$output_file"
    fi
    echo " ✗ (not found)"
  fi

  sleep 0.5  # Rate limiting
done < "$input_file"

echo ""
echo "✓ Processed $count domains"
echo "✓ Results saved to $output_file"
