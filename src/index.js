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
   * Query publisher by domain
   * @param {string} domain - Publisher domain
   * @returns {Promise<object>} Publisher metadata
   */
  async getPublisherByDomain(domain) {
    return new Promise((resolve, reject) => {
      const path = `${this.apiPath}?domain=${encodeURIComponent(domain)}`;

      const options = {
        hostname: this.baseUrl,
        port: 443,
        path: path,
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
            reject(new Error(`Domain not found: ${domain}`));
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
 * @returns {string} CSV formatted string
 */
export function formatCSV(data) {
  const fields = [
    data.domain || data.owner_domain || '',
    data.publisher_id || data.id || '',
    (data.name || '').replace(/,/g, ';'),
    data.owner_domain || '',
    data.status || '',
    data.visit_enabled ? 'verified' : 'unverified'
  ];
  return fields.join(',');
}

/**
 * Get CSV header
 * @returns {string} CSV header
 */
export function getCSVHeader() {
  return 'domain,publisher_id,publisher_name,owner_domain,status,verification_status';
}
