#!/usr/bin/env node

/**
 * OpenSincera CLI - Command Line Interface
 */

import { OpenSinceraClient, formatCSV, getCSVHeader } from '../src/index.js';

const API_KEY = process.env.OPENSINCERA_API_KEY;

/**
 * Print usage information
 */
function printUsage() {
  console.error(`
Usage: opensincera <domain> [options]
       opensincera --id <publisher_id> [options]

Options:
  --id <id>            Look up publisher by ID instead of domain
  --device <type>      Filter to device-level metrics: mobile or desktop
  --csv                Output in CSV format (default: JSON)
  --header             Include CSV header (only with --csv)
  --help, -h           Show this help message

Environment Variables:
  OPENSINCERA_API_KEY  API key (required)

Examples:
  opensincera nytimes.com
  opensincera --id 75
  opensincera nytimes.com --device mobile
  opensincera nytimes.com --device desktop --csv --header
  echo "nytimes.com" | opensincera --csv

  # Multiple domains
  for domain in nytimes.com google.com; do
    opensincera $domain --csv
  done
`);
}

/**
 * Validate domain format
 * @param {string} domain
 * @returns {boolean}
 */
function isValidDomain(domain) {
  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  return domainRegex.test(domain);
}

/**
 * Filter JSON output to device-level metrics for the specified device.
 * Replaces device_level_metrics with the selected device's data under
 * the key "device_metrics", and adds a "device" field.
 * @param {object} data - Full API response
 * @param {string} device - 'mobile' or 'desktop'
 * @returns {object}
 */
function applyDeviceFilter(data, device) {
  const { device_level_metrics, ...rest } = data;
  return {
    ...rest,
    device,
    device_metrics: device_level_metrics?.[device] ?? null,
  };
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  // Check API key
  if (!API_KEY) {
    console.error('Error: OPENSINCERA_API_KEY environment variable is required');
    console.error('Set it with: export OPENSINCERA_API_KEY="your-api-key"');
    process.exit(1);
  }

  // Parse options
  const outputCSV = args.includes('--csv');
  const includeHeader = args.includes('--header');

  const idIndex = args.indexOf('--id');
  const publisherId = idIndex !== -1 ? args[idIndex + 1] : null;

  const deviceIndex = args.indexOf('--device');
  const device = deviceIndex !== -1 ? args[deviceIndex + 1] : null;

  if (device && device !== 'mobile' && device !== 'desktop') {
    console.error(`Error: --device must be "mobile" or "desktop", got: ${device}`);
    process.exit(1);
  }

  // Determine lookup target
  let targetDomain = null;

  if (!publisherId) {
    const skipValues = new Set([
      ...(idIndex !== -1 ? [args[idIndex + 1]] : []),
      ...(deviceIndex !== -1 ? [args[deviceIndex + 1]] : []),
    ]);
    const domain = args.find(arg => !arg.startsWith('--') && !skipValues.has(arg));

    if (domain) {
      targetDomain = domain;
    } else if (!process.stdin.isTTY) {
      const stdinBuffer = [];
      for await (const chunk of process.stdin) {
        stdinBuffer.push(chunk);
      }
      targetDomain = Buffer.concat(stdinBuffer).toString('utf-8').trim();
    } else {
      console.error('Error: No domain or --id provided');
      printUsage();
      process.exit(1);
    }

    if (!targetDomain) {
      console.error('Error: Empty domain');
      process.exit(1);
    }

    if (!isValidDomain(targetDomain)) {
      console.error(`Error: Invalid domain format: ${targetDomain}`);
      process.exit(1);
    }
  }

  // Query API
  try {
    const client = new OpenSinceraClient(API_KEY);
    const result = publisherId
      ? await client.getPublisherById(publisherId)
      : await client.getPublisherByDomain(targetDomain);

    // Output
    if (outputCSV) {
      if (includeHeader) {
        console.log(getCSVHeader(device));
      }
      console.log(formatCSV(result, device));
    } else {
      const output = device ? applyDeviceFilter(result, device) : result;
      console.log(JSON.stringify(output, null, 2));
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run
main();
