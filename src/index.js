/**
 * OpenSincera CLI - Core Module
 *
 * Query publisher metadata from OpenSincera API.
 */

import https from 'https';

const DEFAULT_BASE_URL = 'open.sincera.io';
const DEFAULT_API_PATH = '/api/publishers';
const DEFAULT_TIMEOUT = 10000;

/**
 * OpenSincera API Client
 */
export class OpenSinceraClient {
  constructor(apiKey, options = {}) {
    if (!apiKey) {
      throw new Error('API key is required');
    }

    this.apiKey = apiKey;
    this.baseUrl = options.baseUrl || DEFAULT_BASE_URL;
    this.apiPath = options.apiPath || DEFAULT_API_PATH;
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
  }

  /**
   * Shared HTTP GET helper
   * @param {string} path - Request path
   * @returns {Promise<object>} Parsed JSON response
   */
  _get(path) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.baseUrl,
        port: 443,
        path,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'opensincera-cli/1.0'
        },
        timeout: this.timeout
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(new Error(`Failed to parse JSON: ${e.message}`));
            }
          } else if (res.statusCode === 404) {
            reject(new Error(`Publisher not found`));
          } else if (res.statusCode === 401) {
            reject(new Error('Invalid API key'));
          } else if (res.statusCode === 429) {
            reject(new Error('Rate limit exceeded'));
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (e) => {
        reject(new Error(`Request failed: ${e.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timeout after ${this.timeout}ms`));
      });

      req.end();
    });
  }

  /**
   * Query publisher by domain
   * @param {string} domain - Publisher domain
   * @returns {Promise<object>} Publisher metadata
   */
  async getPublisherByDomain(domain) {
    const path = `${this.apiPath}?domain=${encodeURIComponent(domain)}`;
    try {
      return await this._get(path);
    } catch (e) {
      if (e.message === 'Publisher not found') {
        throw new Error(`Domain not found: ${domain}`);
      }
      throw e;
    }
  }

  /**
   * Query publisher by ID
   * @param {string|number} publisherId - Publisher ID
   * @returns {Promise<object>} Publisher metadata
   */
  async getPublisherById(publisherId) {
    const path = `${this.apiPath}?id=${encodeURIComponent(publisherId)}`;
    try {
      return await this._get(path);
    } catch (e) {
      if (e.message === 'Publisher not found') {
        throw new Error(`Publisher ID not found: ${publisherId}`);
      }
      throw e;
    }
  }

  /**
   * Health check
   * @returns {Promise<boolean>} API availability
   */
  async healthCheck() {
    try {
      await this.getPublisherByDomain('google.com');
      return true;
    } catch (error) {
      if (error.message.includes('Domain not found')) {
        return true; // API is working, domain just not found
      }
      return false;
    }
  }
}

/**
 * Format publisher data as CSV
 * @param {object} data - Publisher metadata
 * @param {string|null} device - 'mobile', 'desktop', or null for overall only
 * @returns {string} CSV formatted string
 */
export function formatCSV(data, device = null) {
  const fields = [
    data.domain || data.owner_domain || '',
    data.publisher_id || data.id || '',
    data.name || '',
    data.owner_domain || '',
    data.status || '',
    data.visit_enabled ? 'verified' : 'unverified'
  ];

  if (device) {
    const dm = data.device_level_metrics?.[device] || {};
    fields.push(
      device,
      dm.avg_ads_to_content_ratio ?? '',
      dm.avg_ad_units_in_view ?? '',
      dm.average_refresh_rate ?? '',
      dm.percentage_of_ad_slots_with_refresh ?? ''
    );
  }

  return fields.map(csvEscape).join(',');
}

/**
 * Escape a value for RFC 4180 CSV
 * @param {string} value
 * @returns {string}
 */
function csvEscape(value) {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Get CSV header
 * @param {string|null} device - 'mobile', 'desktop', or null for overall only
 * @returns {string} CSV header
 */
export function getCSVHeader(device = null) {
  const base = 'domain,publisher_id,publisher_name,owner_domain,status,verification_status';
  if (device) {
    return base + ',device,a2cr,avg_ad_units_in_view,avg_refresh_rate,pct_slots_with_refresh';
  }
  return base;
}
