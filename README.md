# opensincera-cli

Command-line tool for querying OpenSincera publisher transparency data.

## Features

- ✅ Direct API access (no MCP Server required)
- ✅ JSON and CSV output formats
- ✅ Domain-based publisher lookup
- ✅ Stdin support for batch processing
- ✅ Zero dependencies (uses Node.js built-in modules)

## Installation

### From GitHub

```bash
git clone https://github.com/miyaichi/opensincera-cli.git
cd opensincera-cli
npm install -g .
```

### From npm (Future)

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

### Basic Query

```bash
opensincera nytimes.com
```

Output:
```json
{
  "publisher_id": 75,
  "name": "NY Times",
  "domain": "nytimes.com",
  "owner_domain": "nytimes.com",
  "visit_enabled": true,
  "status": "available",
  "avg_ads_to_content_ratio": 0.14254,
  "total_supply_paths": 30,
  ...
}
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

### Batch Processing

```bash
# Multiple domains
for domain in nytimes.com washingtonpost.com google.com; do
  opensincera "$domain" --csv
done > results.csv
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

## API Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `publisher_id` | number | Unique publisher identifier |
| `name` | string | Publisher name |
| `domain` | string | Publisher domain |
| `owner_domain` | string | Owner domain |
| `visit_enabled` | boolean | Verification status |
| `status` | string | Publisher status (e.g., "available") |
| `avg_ads_to_content_ratio` | number | Average ad-to-content ratio |
| `avg_ads_in_view` | number | Average ads in view |
| `total_supply_paths` | number | Number of supply paths |
| `reseller_count` | number | Number of resellers |
| `updated_at` | string | Last update timestamp (ISO 8601) |

See [API Documentation](docs/API.md) for full field list.

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
│   └── opensincera.js     # CLI entry point
├── src/
│   └── index.js           # Core library
├── docs/
│   └── API.md             # API documentation
├── package.json
└── README.md
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

### With Transparency-Toolkit

```bash
# Check publisher metadata during validation
opensincera example.com | jq -r '.visit_enabled'
```

### With jq

```bash
# Extract specific fields
opensincera nytimes.com | jq -r '{name, domain, status}'
```

## Comparison: CLI vs MCP Server

### opensincera-cli (This Tool)
✅ Faster (no stdio overhead)  
✅ Simpler deployment  
✅ Easier debugging  
✅ Better for batch operations  
✅ Standalone tool  

### opensincera-mcp-server
✅ Better for OpenClaw integration  
✅ Standardized tool interface  
✅ Version control via MCP  

**Recommendation**: Use `opensincera-cli` for scripts and automation. Use `opensincera-mcp-server` for OpenClaw sessions.

## License

MIT

## Author

Yoshihiko Miyaichi <yoshihiko.miyaichi@pier1.co.jp>

## Links

- [OpenSincera Website](https://open.sincera.io)
- [GitHub Repository](https://github.com/miyaichi/opensincera-cli)
- [npm Package](https://www.npmjs.com/package/opensincera-cli) (Future)

## Support

For issues and questions, please open an issue on GitHub:
https://github.com/miyaichi/opensincera-cli/issues
