#!/bin/bash
# Rank publishers by quality score
# Score = supply_paths * (1 - ad_ratio) * (verified ? 2 : 1)
#
# Usage: rank_publishers.sh <input_file> [output_file] [--device mobile|desktop]
#   --device  Use device-specific A2CR instead of overall average for scoring

input_file=$1
output_file=${2:-ranked_publishers.txt}
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

if [ -n "$device" ]; then
  echo "Scoring using $device A2CR"
fi

temp_file=$(mktemp)

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

    # Use device-specific A2CR if requested, fall back to overall
    if [ -n "$device" ]; then
      ratio=$(echo "$json" | jq -r ".device_level_metrics.${device}.avg_ads_to_content_ratio // .avg_ads_to_content_ratio // 0")
    else
      ratio=$(echo "$json" | jq -r '.avg_ads_to_content_ratio // 0')
    fi

    # Calculate quality score
    verified_multiplier=$([ "$verified" = "true" ] && echo 2 || echo 1)
    score=$(echo "$paths * (1 - $ratio) * $verified_multiplier" | bc -l)

    printf "%.2f\t%s\t%s\n" "$score" "$domain" "$name" >> "$temp_file"
    echo " ✓ (score: $(printf "%.2f" "$score"))"
  else
    echo " ✗ (not found)"
  fi

  sleep 0.5  # Rate limiting
done < "$input_file"

# Sort by score (descending)
sort -rn "$temp_file" > "$output_file"
rm "$temp_file"

echo ""
echo "✓ Processed $count domains"
echo "✓ Rankings saved to $output_file"
echo ""
echo "Top 5 Publishers:"
head -5 "$output_file" | while IFS=$'\t' read -r score domain name; do
  printf "%-8s %-35s %s\n" "$score" "$domain" "$name"
done
