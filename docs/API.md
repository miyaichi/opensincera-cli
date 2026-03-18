# OpenSincera API Documentation

## Base URL

```
https://open.sincera.io/api
```

## Authentication

All requests require Bearer token authentication:

```
Authorization: Bearer <API_KEY>
```

## Endpoints

### Get Publisher by Domain

**Request:**
```
GET /publishers?domain=<domain>
```

**Headers:**
- `Authorization: Bearer <API_KEY>`
- `User-Agent: opensincera-cli/1.0`

**Response (200 OK):**
```json
{
  "publisher_id": 75,
  "name": "NY Times",
  "visit_enabled": true,
  "status": "available",
  "primary_supply_type": "web",
  "domain": "nytimes.com",
  "owner_domain": "nytimes.com",
  "pub_description": "The New York Times...",
  "categories": null,
  "slug": "ny-times",
  "avg_ads_to_content_ratio": 0.14254,
  "avg_ads_in_view": 0.45864,
  "avg_ad_refresh": null,
  "device_level_metrics": {
    "mobile": {
      "average_refresh_rate": null,
      "avg_ad_units_in_view": 0.38522,
      "avg_ads_to_content_ratio": 0.15384,
      "max_refresh_rate": null,
      "min_refresh_rate": null,
      "max_ad_units_in_view": 1.4037,
      "max_ads_to_content_ratio": 0.8199,
      "min_ads_to_content_ratio": 0,
      "percentage_of_ad_slots_with_refresh": 0
    },
    "desktop": {
      "average_refresh_rate": null,
      "avg_ad_units_in_view": 0.54955,
      "avg_ads_to_content_ratio": 0.12855,
      "max_refresh_rate": null,
      "min_refresh_rate": null,
      "max_ad_units_in_view": 2.2535,
      "max_ads_to_content_ratio": 0.5938,
      "min_ads_to_content_ratio": 0,
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
  "updated_at": "2026-03-18T01:00:34.128Z",
  "similar_publishers": {
    "content": [27, 37, 41, 76, 562, ...]
  }
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 401 | Invalid or missing API key |
| 404 | Domain not found in database |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

## Response Fields

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `publisher_id` | number | Unique publisher identifier |
| `name` | string | Publisher name |
| `domain` | string | Publisher domain |
| `owner_domain` | string | Owner domain (canonical) |
| `visit_enabled` | boolean | Whether verification visits are enabled |
| `status` | string | Publisher status (e.g., "available", "unavailable") |
| `updated_at` | string | Last update timestamp (ISO 8601) |

### Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `pub_description` | string | Publisher description |
| `primary_supply_type` | string | Primary supply type (e.g., "web", "app") |
| `categories` | array\|null | Content categories |
| `slug` | string | URL-friendly identifier |
| `parent_entity_id` | number | Parent entity ID (if applicable) |

### Metrics Fields

| Field | Type | Description |
|-------|------|-------------|
| `avg_ads_to_content_ratio` | number | Average ad-to-content ratio |
| `avg_ads_in_view` | number | Average number of ads in view |
| `avg_ad_refresh` | number\|null | Average ad refresh rate (seconds) |
| `avg_page_weight` | number | Average page weight (KB) |
| `avg_cpu` | number | Average CPU usage (%) |

### Supply Chain Fields

| Field | Type | Description |
|-------|------|-------------|
| `total_supply_paths` | number | Number of supply paths |
| `reseller_count` | number | Number of resellers |
| `total_unique_gpids` | number | Total unique GPIDs (Global Placement IDs) |
| `id_absorption_rate` | number | ID absorption rate |

### Device-Level Metrics

Nested under `device_level_metrics`:

```json
{
  "mobile": { ... },
  "desktop": { ... }
}
```

Each device type contains:

| Field | Type | Description |
|-------|------|-------------|
| `average_refresh_rate` | number\|null | Average refresh rate (seconds) |
| `avg_ad_units_in_view` | number | Average ad units in view |
| `avg_ads_to_content_ratio` | number | Average ad-to-content ratio |
| `max_refresh_rate` | number\|null | Maximum refresh rate |
| `min_refresh_rate` | number\|null | Minimum refresh rate |
| `max_ad_units_in_view` | number | Maximum ad units in view |
| `max_ads_to_content_ratio` | number | Maximum ad-to-content ratio |
| `min_ads_to_content_ratio` | number | Minimum ad-to-content ratio |
| `percentage_of_ad_slots_with_refresh` | number | Percentage with refresh (0-1) |

### Related Data

| Field | Type | Description |
|-------|------|-------------|
| `similar_publishers` | object | Object with `content` array of similar publisher IDs |

## Rate Limits

Rate limits are not publicly documented. Recommended approach:

- **Conservative**: 1 request per second
- **Batch processing**: Add delays between requests
- **Error handling**: Implement exponential backoff for 429 errors

## Example Requests

### Using curl

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     "https://open.sincera.io/api/publishers?domain=nytimes.com"
```

### Using opensincera-cli

```bash
export OPENSINCERA_API_KEY="your-api-key"
opensincera nytimes.com
```

### Using Node.js

```javascript
import https from 'https';

const options = {
  hostname: 'open.sincera.io',
  path: '/api/publishers?domain=nytimes.com',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(JSON.parse(data)));
});
```

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Null values indicate missing or unavailable data
- Numeric metrics may be `null` if not enough data is available
- Categories are semicolon-separated when present as a string
