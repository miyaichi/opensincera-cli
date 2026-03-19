#!/bin/bash
# Batch verification

input_file=$1
output_file=${2:-verified_publishers.csv}

if [ -z "$input_file" ]; then
  echo "Usage: $0 <input_file> [output_file]"
  exit 1
fi

if [ ! -f "$input_file" ]; then
  echo "Error: Input file not found: $input_file"
  exit 1
fi

echo "domain,name,verified,supply_paths,ad_ratio" > "$output_file"

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
    echo "$(csv_escape "$domain"),$(csv_escape "$name"),$verified,$paths,$ratio" >> "$output_file"
    echo " ✓"
  else
    echo "$(csv_escape "$domain"),NOT_FOUND,false,0,0" >> "$output_file"
    echo " ✗ (not found)"
  fi

  sleep 0.5  # Rate limiting
done < "$input_file"

echo ""
echo "✓ Processed $count domains"
echo "✓ Results saved to $output_file"
