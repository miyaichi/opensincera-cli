# opensincera-cli

Command-line tool for querying OpenSincera publisher transparency data.

## Features

- ✅ Direct API access (no MCP Server required)
- ✅ JSON and CSV output formats
- ✅ Domain-based publisher lookup
- ✅ Full API response including device-level metrics (mobile/desktop)
- ✅ Stdin support for batch processing
- ✅ Zero dependencies (uses Node.js built-in modules)

## Installation

### From GitHub

```bash
git clone https://github.com/miyaichi/opensincera-cli.git
cd opensincera-cli
npm install -g .
```

### From npm

```bash
npm install -g opensincera-cli
```

## Setup

Set your OpenSincera API key:

```bash
export OPENSINCERA_API_KEY="your-api-key-here"
```

Add to `~/.zshrc` or `~/.bashrc` for persistence.

## Usage

```
opensincera <domain> [options]
opensincera --id <publisher_id> [options]
```

| Option | Description |
|--------|-------------|
| `--id <id>` | Look up publisher by ID instead of domain |
| `--device mobile\|desktop` | Filter JSON to device-level metrics; adds device columns to CSV |
| `--csv` | Output in CSV format (default: JSON) |
| `--header` | Include CSV header (only with `--csv`) |
| `--help`, `-h` | Show help |

### Basic Query

```bash
opensincera nytimes.com
```

Output (abbreviated):
```json
{
  "publisher_id": 75,
  "name": "NY Times",
  "domain": "nytimes.com",
  "owner_domain": "nytimes.com",
  "visit_enabled": true,
  "status": "available",
  "primary_supply_type": "web",
  "avg_ads_to_content_ratio": 0.14254,
  "avg_ads_in_view": 0.45864,
  "avg_ad_refresh": null,
  "device_level_metrics": {
    "mobile": {
      "avg_ads_to_content_ratio": 0.15384,
      "avg_ad_units_in_view": 0.38522,
      "max_ads_to_content_ratio": 0.8199,
      "min_ads_to_content_ratio": 0,
      "max_ad_units_in_view": 1.4037,
      "average_refresh_rate": null,
      "max_refresh_rate": null,
      "min_refresh_rate": null,
      "percentage_of_ad_slots_with_refresh": 0
    },
    "desktop": {
      "avg_ads_to_content_ratio": 0.12855,
      "avg_ad_units_in_view": 0.54955,
      "max_ads_to_content_ratio": 0.5938,
      "min_ads_to_content_ratio": 0,
      "max_ad_units_in_view": 2.2535,
      "average_refresh_rate": null,
      "max_refresh_rate": null,
      "min_refresh_rate": null,
      "percentage_of_ad_slots_with_refresh": 0
    }
  },
  "total_unique_gpids": 283,
  "id_absorption_rate": 0,
  "avg_page_weight": 22.6588,
  "avg_cpu": 34.8847,
  "total_supply_paths": 30,
  "reseller_count": 0,
  "parent_entity_id": 75,
  "similar_publishers": {
    "content": [27, 37, 41, 76, 562]
  },
  "updated_at": "2026-03-18T01:00:34.128Z"
}
```

### Publisher ID Lookup

```bash
opensincera --id 75
```

### CSV Output

```bash
opensincera nytimes.com --csv
```

Output:
```
nytimes.com,75,NY Times,nytimes.com,available,verified
```

### With Header

```bash
opensincera nytimes.com --csv --header
```

Output:
```
domain,publisher_id,publisher_name,owner_domain,status,verification_status
nytimes.com,75,NY Times,nytimes.com,available,verified
```

### Device-Level Metrics (JSON)

```bash
# Show only mobile metrics (device_level_metrics replaced by device_metrics)
opensincera nytimes.com --device mobile

# Show only desktop metrics
opensincera --id 75 --device desktop
```

### Device-Level Metrics (CSV)

```bash
# Adds device, a2cr, avg_ad_units_in_view, avg_refresh_rate, pct_slots_with_refresh columns
opensincera nytimes.com --device mobile --csv --header
```

Output:
```
domain,publisher_id,publisher_name,owner_domain,status,verification_status,device,a2cr,avg_ad_units_in_view,avg_refresh_rate,pct_slots_with_refresh
nytimes.com,75,NY Times,nytimes.com,available,verified,mobile,0.15384,0.38522,,0
```

### Batch Processing

```bash
# Multiple domains
for domain in nytimes.com washingtonpost.com google.com; do
  opensincera "$domain" --csv
done > results.csv

# Mobile metrics for multiple domains
for domain in nytimes.com washingtonpost.com; do
  opensincera "$domain" --device mobile --csv
done > mobile_results.csv
```

### From Stdin

```bash
echo "nytimes.com" | opensincera --csv
```

### Pipeline Example

```bash
# Process domains from file
cat domains.txt | while read domain; do
  opensincera "$domain" --csv
done
```

## Extracting Specific Fields with jq

The full JSON response can be filtered with [jq](https://stedolan.github.io/jq/):

```bash
# Overall metrics
opensincera nytimes.com | jq '{name, domain, avg_ads_to_content_ratio, total_supply_paths}'

# Mobile A2CR only
opensincera nytimes.com | jq '.device_level_metrics.mobile.avg_ads_to_content_ratio'

# Compare mobile vs desktop A2CR
opensincera nytimes.com | jq '{
  mobile_a2cr: .device_level_metrics.mobile.avg_ads_to_content_ratio,
  desktop_a2cr: .device_level_metrics.desktop.avg_ads_to_content_ratio
}'

# Extract similar publisher IDs
opensincera nytimes.com | jq '.similar_publishers.content'
```

## API Response Fields

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `publisher_id` | number | Unique publisher identifier |
| `name` | string | Publisher name |
| `domain` | string | Publisher domain |
| `owner_domain` | string | Owner domain (canonical) |
| `visit_enabled` | boolean | Whether verification visits are enabled |
| `status` | string | Publisher status (e.g., `available`) |
| `updated_at` | string | Last update timestamp (ISO 8601) |

### Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `pub_description` | string | Publisher description |
| `primary_supply_type` | string | Primary supply type (e.g., `web`, `ctv`) |
| `categories` | array\|null | IAB 3.0 content categories |
| `slug` | string | URL-friendly identifier |
| `parent_entity_id` | number | Parent entity ID (if applicable) |
| `similar_publishers` | object | Object with `content` array of similar publisher IDs |

### Overall Metrics

| Field | Type | Description |
|-------|------|-------------|
| `avg_ads_to_content_ratio` | number\|null | Average ad-to-content ratio (overall) |
| `avg_ads_in_view` | number\|null | Average number of ads in view (overall) |
| `avg_ad_refresh` | number\|null | Average ad refresh interval in seconds (overall) |
| `avg_page_weight` | number | Average page weight (MB) |
| `avg_cpu` | number | Average CPU usage (seconds) |
| `total_supply_paths` | number | Number of supply paths |
| `reseller_count` | number | Number of resellers |
| `total_unique_gpids` | number | Total unique Global Placement IDs |
| `id_absorption_rate` | number | ID absorption rate (0–1) |

### Device-Level Metrics

Nested under `device_level_metrics.mobile` and `device_level_metrics.desktop`:

| Field | Type | Description |
|-------|------|-------------|
| `avg_ads_to_content_ratio` | number\|null | Average A2CR for this device type |
| `max_ads_to_content_ratio` | number\|null | Maximum A2CR observed |
| `min_ads_to_content_ratio` | number\|null | Minimum A2CR observed |
| `avg_ad_units_in_view` | number\|null | Average ad units in viewport |
| `max_ad_units_in_view` | number\|null | Maximum ad units in viewport |
| `average_refresh_rate` | number\|null | Average ad refresh interval (seconds) |
| `max_refresh_rate` | number\|null | Maximum refresh interval (seconds) |
| `min_refresh_rate` | number\|null | Minimum refresh interval (seconds) |
| `percentage_of_ad_slots_with_refresh` | number | Percentage of ad slots with refresh enabled (0–100) |

See [docs/API.md](docs/API.md) for full field reference and example responses.

## Error Handling

| Error | Description |
|-------|-------------|
| `Domain not found` | Domain not in OpenSincera database (404) |
| `Invalid API key` | Authentication failed (401) |
| `Rate limit exceeded` | Too many requests (429) |
| `Request timeout` | API did not respond in time |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENSINCERA_API_KEY` | Yes | - | OpenSincera API key |

## Development

### Project Structure

```
opensincera-cli/
├── bin/
│   └── opensincera.js           # CLI entry point
├── src/
│   └── index.js                 # Core library (OpenSinceraClient)
├── skill/                       # OpenClaw skill (source)
│   ├── SKILL.md                 # Skill documentation
│   ├── README.md                # Skill quick start
│   ├── scripts/
│   │   ├── check_publisher.sh   # Single publisher check
│   │   ├── batch_verify.sh      # Batch verification
│   │   └── rank_publishers.sh   # Quality ranking
│   └── examples/
│       └── sample_domains.txt   # Sample input
├── docs/
│   └── API.md                   # Full API field reference
├── INSTALL.md                   # Installation guide
├── package.json
└── README.md
```

**Installation flow:**
```
opensincera-cli/skill/
    ↓ (npm run install-skill)
~/.openclaw/workspace/skills/opensincera-cli/
    ↓ (OpenClaw reads SKILL.md)
Agent can use scripts and commands
```

### Testing

```bash
# Local testing
cd opensincera-cli
export OPENSINCERA_API_KEY="your-api-key"
node bin/opensincera.js nytimes.com
```

### Publishing to npm

```bash
npm login
npm publish
```

## Integration Examples

### With jq

```bash
# Extract overall and device-level A2CR
opensincera nytimes.com | jq '{
  overall: .avg_ads_to_content_ratio,
  mobile: .device_level_metrics.mobile.avg_ads_to_content_ratio,
  desktop: .device_level_metrics.desktop.avg_ads_to_content_ratio
}'
```

### With Transparency-Toolkit

```bash
# Check verification status
opensincera example.com | jq -r '.visit_enabled'
```

## OpenClaw Skill

This tool includes an OpenClaw skill for easy integration.

**Installation:**
```bash
# 1. Install CLI globally
cd ~/workspace/opensincera-cli
npm install -g .

# 2. Copy skill to OpenClaw workspace
cp -r skill/ ~/.openclaw/workspace/skills/opensincera-cli/

# 3. Set API key (add to ~/.zshrc for persistence)
export OPENSINCERA_API_KEY="your-api-key-here"
```

**Verify installation:**
```bash
cd ~/.openclaw/workspace/skills/opensincera-cli
./scripts/check_publisher.sh nytimes.com
```

**Features:**
- ✅ Publisher verification scripts
- ✅ Batch processing workflows
- ✅ Quality-based ranking
- ✅ Example domains and use cases

**Usage from OpenClaw:**
- "Check if nytimes.com is verified"
- "Rank these publishers by quality"
- "Which domains have more than 100 supply paths?"

See `skill/SKILL.md` or `~/.openclaw/workspace/skills/opensincera-cli/SKILL.md` for full documentation.

## Comparison: CLI vs MCP Server

### opensincera-cli (This Tool)
✅ Faster (no stdio overhead)  
✅ Simpler deployment  
✅ Easier debugging  
✅ Better for batch operations  
✅ Standalone tool  
✅ OpenClaw skill integration  

### opensincera-mcp-server
✅ Better for interactive sessions  
✅ Standardized tool interface  
✅ Publisher comparison and media evaluation  
✅ Formatted output with metric descriptions  

**Recommendation**: Use `opensincera-cli` for scripts and automation. Use `opensincera-mcp-server` for OpenClaw/Claude sessions.

## License

MIT

## Author

Yoshihiko Miyaichi <yoshihiko.miyaichi@pier1.co.jp>

## Links

- [OpenSincera Website](https://open.sincera.io)
- [GitHub Repository](https://github.com/miyaichi/opensincera-cli)
- [npm Package](https://www.npmjs.com/package/opensincera-cli)

## Support

For issues and questions, please open an issue on GitHub:
https://github.com/miyaichi/opensincera-cli/issues
