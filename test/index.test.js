/**
 * Tests for opensincera-cli core module
 *
 * Uses Node.js built-in test runner (node:test) — no external dependencies required.
 * Run with: npm test
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { OpenSinceraClient, formatCSV, getCSVHeader } from '../src/index.js';

// ---------------------------------------------------------------------------
// OpenSinceraClient
// ---------------------------------------------------------------------------

describe('OpenSinceraClient', () => {
  test('throws when no API key is provided', () => {
    assert.throws(
      () => new OpenSinceraClient(),
      { message: 'API key is required' }
    );
  });

  test('instantiates with an API key', () => {
    const client = new OpenSinceraClient('test-key');
    assert.ok(client);
  });

  test('applies default options', () => {
    const client = new OpenSinceraClient('test-key');
    assert.equal(client.baseUrl, 'open.sincera.io');
    assert.equal(client.timeout, 10000);
  });

  test('accepts custom options', () => {
    const client = new OpenSinceraClient('test-key', {
      baseUrl: 'custom.api.example.com',
      timeout: 5000,
    });
    assert.equal(client.baseUrl, 'custom.api.example.com');
    assert.equal(client.timeout, 5000);
  });
});

// ---------------------------------------------------------------------------
// formatCSV
// ---------------------------------------------------------------------------

describe('formatCSV', () => {
  const baseData = {
    domain: 'nytimes.com',
    publisher_id: 'pub-123',
    name: 'The New York Times',
    owner_domain: 'nytimes.com',
    status: 'active',
    visit_enabled: true,
  };

  test('formats basic data correctly', () => {
    const csv = formatCSV(baseData);
    assert.equal(csv, 'nytimes.com,pub-123,The New York Times,nytimes.com,active,verified');
  });

  test('marks unverified publishers', () => {
    const csv = formatCSV({ ...baseData, visit_enabled: false });
    assert.ok(csv.endsWith(',unverified'));
  });

  test('quotes fields containing commas (RFC 4180)', () => {
    const csv = formatCSV({ ...baseData, name: 'Acme, Inc.' });
    assert.ok(csv.includes('"Acme, Inc."'));
  });

  test('escapes double-quotes inside quoted fields (RFC 4180)', () => {
    const csv = formatCSV({ ...baseData, name: 'Say "Hello"' });
    assert.ok(csv.includes('"Say ""Hello"""'));
  });

  test('handles missing fields gracefully', () => {
    const csv = formatCSV({});
    assert.equal(csv, ',,,,,unverified');
  });

  test('falls back to owner_domain when domain is absent', () => {
    const csv = formatCSV({ owner_domain: 'example.com', visit_enabled: false });
    assert.ok(csv.startsWith('example.com,'));
  });
});

// ---------------------------------------------------------------------------
// getCSVHeader
// ---------------------------------------------------------------------------

describe('getCSVHeader', () => {
  test('returns the expected column names', () => {
    const header = getCSVHeader();
    assert.equal(
      header,
      'domain,publisher_id,publisher_name,owner_domain,status,verification_status'
    );
  });

  test('column count matches formatCSV output column count', () => {
    const headerCols = getCSVHeader().split(',').length;
    const dataCols = formatCSV({}).split(',').length;
    assert.equal(headerCols, dataCols);
  });
});
