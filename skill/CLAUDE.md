# opensincera-cli

Query OpenSincera publisher transparency data from the command line.

## Setup

```bash
export OPENSINCERA_API_KEY="your-api-key-here"
```

## Commands

```bash
# Look up by domain
opensincera <domain>

# Look up by publisher ID
opensincera --id <publisher_id>

# Filter to device-level metrics (JSON)
opensincera <domain> --device mobile
opensincera <domain> --device desktop

# CSV output
opensincera <domain> --csv
opensincera <domain> --csv --header

# CSV with device-level columns
opensincera <domain> --device mobile --csv --header
```

## Output

Default JSON output includes all API fields:
- `publisher_id`, `name`, `domain`, `owner_domain`
- `visit_enabled` — verification status (true = verified)
- `status` — publisher availability
- `avg_ads_to_content_ratio`, `avg_ads_in_view`, `avg_ad_refresh`
- `avg_page_weight`, `avg_cpu`
- `total_supply_paths`, `reseller_count`, `total_unique_gpids`, `id_absorption_rate`
- `device_level_metrics.mobile` / `.desktop` — per-device A2CR, ads in view, refresh rate
- `similar_publishers.content` — array of similar publisher IDs
- `parent_entity_id`, `updated_at`

With `--device mobile|desktop`, the output replaces `device_level_metrics` with a flat
`device_metrics` object and adds a `device` field.

CSV columns (no `--device`): `domain, publisher_id, publisher_name, owner_domain, status, verification_status`
CSV columns (with `--device`): above + `device, a2cr, avg_ad_units_in_view, avg_refresh_rate, pct_slots_with_refresh`

## Common Workflows

```bash
# Check if a domain is verified
opensincera nytimes.com | jq -r '.visit_enabled'

# Compare mobile vs desktop A2CR
opensincera nytimes.com | jq '{
  mobile: .device_level_metrics.mobile.avg_ads_to_content_ratio,
  desktop: .device_level_metrics.desktop.avg_ads_to_content_ratio
}'

# Batch: process domains from file
cat domains.txt | while read domain; do
  opensincera "$domain" --csv
  sleep 0.5
done > results.csv

# Batch with mobile metrics
cat domains.txt | while read domain; do
  opensincera "$domain" --device mobile --csv
  sleep 0.5
done > mobile_results.csv
```

## Skill Scripts

```bash
# Single publisher check (shows overall + mobile/desktop A2CR)
./skill/scripts/check_publisher.sh nytimes.com

# Batch verification
./skill/scripts/batch_verify.sh domains.txt output.csv
./skill/scripts/batch_verify.sh domains.txt output.csv --device mobile

# Rank publishers by quality score
./skill/scripts/rank_publishers.sh domains.txt ranked.txt
./skill/scripts/rank_publishers.sh domains.txt ranked.txt --device desktop
```

## Error Codes

| Message | Meaning |
|---------|---------|
| `Domain not found: <domain>` | Not in OpenSincera database (404) |
| `Publisher ID not found: <id>` | ID not found (404) |
| `Invalid API key` | Check OPENSINCERA_API_KEY (401) |
| `Rate limit exceeded` | Add `sleep 0.5` between requests (429) |
| `Request timeout` | Retry or check connectivity |

## Reference

- Full API fields: `docs/API.md`
- Usage examples: `README.md`
