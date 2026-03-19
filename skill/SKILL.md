# opensincera-cli Skill

## Overview

Query publisher transparency data from OpenSincera using the `opensincera-cli` command-line tool. Useful for publisher verification, selection, and quality assessment.

## Installation

To make it globally available:
```bash
git clone https://github.com/miyaichi/opensincera-cli.git
cd opensincera-cli
npm install -g .
```

## Prerequisites

**API Key**: Set `OPENSINCERA_API_KEY` environment variable:
```bash
export OPENSINCERA_API_KEY="your-api-key"
```

Add to `~/.zshrc` for persistence.

## Basic Usage

### Single Domain Query

```bash
# JSON output (full metadata)
opensincera nytimes.com

# CSV output
opensincera nytimes.com --csv

# CSV with header
opensincera nytimes.com --csv --header
```

### Batch Processing

```bash
# Multiple domains
for domain in nytimes.com washingtonpost.com google.com; do
  opensincera "$domain" --csv
done > results.csv

# From file
cat domains.txt | while read domain; do
  opensincera "$domain" --csv
done
```

### With jq (JSON filtering)

```bash
# Extract specific fields
opensincera nytimes.com | jq '{name, domain, visit_enabled, total_supply_paths}'

# Check verification status
opensincera nytimes.com | jq -r '.visit_enabled'

# Get supply path count
opensincera nytimes.com | jq -r '.total_supply_paths'
```

## Publisher Selection Use Cases

### 1. Verify Publisher Legitimacy

Check if a domain is in OpenSincera database and verified:

```bash
domain="example.com"
if opensincera "$domain" > /dev/null 2>&1; then echo "FOUND"; else echo "NOT FOUND"; fi

# Check verification status
opensincera "$domain" | jq -r 'if .visit_enabled then "VERIFIED" else "UNVERIFIED" end'
```

### 2. Filter by Supply Path Count

Find publishers with substantial supply paths (indicates established presence):

```bash
# Check if publisher has sufficient supply paths
threshold=10
count=$(opensincera "$domain" | jq -r '.total_supply_paths // 0')
if [ "$count" -ge "$threshold" ]; then
  echo "✓ $domain has $count supply paths (>= $threshold)"
else
  echo "✗ $domain has only $count supply paths (< $threshold)"
fi
```

### 3. Check Ad Quality Metrics

Assess ad-to-content ratio:

```bash
# Get ad-to-content ratio
ratio=$(opensincera "$domain" | jq -r '.avg_ads_to_content_ratio // 0')
echo "$domain: Ad-to-Content Ratio = $ratio"

# Flag high ratios (e.g., > 0.3)
if (( $(echo "$ratio > 0.3" | bc -l) )); then
  echo "⚠️  High ad density"
fi
```

### 4. Generate Publisher Report

Create a summary report for multiple domains:

```bash
cat << 'EOF' > report_publishers.sh
#!/bin/bash
echo "domain,name,verified,supply_paths,ad_ratio,resellers"
while read domain; do
  json=$(opensincera "$domain" 2>/dev/null)
  if [ $? -eq 0 ]; then
    name=$(echo "$json" | jq -r '.name // "N/A"')
    verified=$(echo "$json" | jq -r '.visit_enabled // false')
    paths=$(echo "$json" | jq -r '.total_supply_paths // 0')
    ratio=$(echo "$json" | jq -r '.avg_ads_to_content_ratio // 0')
    resellers=$(echo "$json" | jq -r '.reseller_count // 0')
    echo "$domain,$name,$verified,$paths,$ratio,$resellers"
  else
    echo "$domain,NOT_FOUND,false,0,0,0"
  fi
  sleep 0.5  # Rate limiting
done
EOF

chmod +x report_publishers.sh
cat domains.txt | ./report_publishers.sh > publisher_report.csv
```

## Integration with Transparency-Toolkit

### Cross-Reference ads.txt with OpenSincera

```bash
# Extract system domains from ads.txt validation results
# Then check each in OpenSincera

# Example: Check if Google (from ads.txt) is verified
opensincera google.com | jq '{
  domain: .domain,
  verified: .visit_enabled,
  supply_paths: .total_supply_paths,
  resellers: .reseller_count
}'
```

### Validate Publisher Identity

```bash
# Compare owner_domain from sellers.json with OpenSincera
seller_domain="example.com"
owner=$(opensincera "$seller_domain" | jq -r '.owner_domain')

if [ "$seller_domain" = "$owner" ]; then
  echo "✓ Domain matches owner_domain"
else
  echo "⚠️  Domain ($seller_domain) != owner_domain ($owner)"
fi
```

## Advanced Workflows

### 1. Filter Verified Publishers

```bash
cat domains.txt | while read domain; do
  verified=$(opensincera "$domain" 2>/dev/null | jq -r '.visit_enabled // false')
  if [ "$verified" = "true" ]; then
    echo "$domain"
  fi
done > verified_publishers.txt
```

### 2. Rank by Supply Paths

```bash
# Get supply path counts for all domains
cat domains.txt | while read domain; do
  paths=$(opensincera "$domain" 2>/dev/null | jq -r '.total_supply_paths // 0')
  echo "$paths $domain"
done | sort -rn > ranked_publishers.txt
```

### 3. Quality Score Calculation

```bash
# Calculate custom quality score
# Lower ad ratio + more supply paths + verified = higher score

cat domains.txt | while read domain; do
  json=$(opensincera "$domain" 2>/dev/null)
  if [ $? -eq 0 ]; then
    verified=$(echo "$json" | jq -r '.visit_enabled // false')
    paths=$(echo "$json" | jq -r '.total_supply_paths // 0')
    ratio=$(echo "$json" | jq -r '.avg_ads_to_content_ratio // 0')
    
    # Score = paths * (1 - ratio) * (verified ? 2 : 1)
    score=$(echo "$paths * (1 - $ratio) * $([ "$verified" = "true" ] && echo 2 || echo 1)" | bc -l)
    printf "%.2f %s\n" "$score" "$domain"
  fi
done | sort -rn > quality_scores.txt
```

## Error Handling

| Error | Meaning | Action |
|-------|---------|--------|
| `Domain not found` | Not in OpenSincera DB | Consider alternative verification |
| `Invalid API key` | Authentication failed | Check `OPENSINCERA_API_KEY` |
| `Rate limit exceeded` | Too many requests | Add delays (`sleep 0.5`) |
| `Request timeout` | API unresponsive | Retry or check connectivity |

## Performance Tips

1. **Rate Limiting**: Add `sleep 0.5` between requests (2 req/sec)
2. **Parallel Processing**: Use `xargs -P` for batch jobs (with caution)
3. **Caching**: Save results to avoid duplicate queries
4. **Error Logs**: Redirect stderr to log file for debugging

```bash
# Example with rate limiting and error logging
cat domains.txt | while read domain; do
  opensincera "$domain" --csv 2>> errors.log
  sleep 0.5
done > results.csv
```

## Output Fields Reference

### Key Fields for Publisher Selection

| Field | Type | Use Case |
|-------|------|----------|
| `visit_enabled` | boolean | Verification status (preferred: `true`) |
| `total_supply_paths` | number | Established presence indicator |
| `reseller_count` | number | Supply chain transparency |
| `avg_ads_to_content_ratio` | number | Ad quality (lower is better) |
| `avg_ads_in_view` | number | Inventory density |
| `status` | string | Publisher availability |

See [API Documentation](../docs/API.md) for full field list.

## Example Scripts

### scripts/check_publisher.sh

```bash
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
```

### scripts/batch_verify.sh

```bash
#!/bin/bash
# Batch verification

input_file=$1
output_file=${2:-verified_publishers.csv}

echo "domain,name,verified,supply_paths,ad_ratio" > "$output_file"

while read domain; do
  json=$(opensincera "$domain" 2>/dev/null)
  if [ $? -eq 0 ]; then
    name=$(echo "$json" | jq -r '.name // "Unknown"')
    verified=$(echo "$json" | jq -r '.visit_enabled')
    paths=$(echo "$json" | jq -r '.total_supply_paths // 0')
    ratio=$(echo "$json" | jq -r '.avg_ads_to_content_ratio // 0')
    echo "$domain,$name,$verified,$paths,$ratio" >> "$output_file"
  fi
  sleep 0.5
done < "$input_file"

echo "✓ Results saved to $output_file"
```

## References

- [opensincera-cli GitHub](https://github.com/miyaichi/opensincera-cli)
- [OpenSincera Website](https://open.sincera.io)
- [API Documentation](../docs/API.md)

## Notes

- Always respect rate limits (recommend 1-2 req/sec)
- Cache results when processing same domains multiple times
- Verify API key is set: `echo $OPENSINCERA_API_KEY`
- Repository: https://github.com/miyaichi/opensincera-cli
