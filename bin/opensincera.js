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

Options:
  --csv          Output in CSV format (default: JSON)
  --header       Include CSV header (only with --csv)
  --help, -h     Show this help message

Environment Variables:
  OPENSINCERA_API_KEY    API key (required)

Examples:
  opensincera nytimes.com
  opensincera nytimes.com --csv
  echo "nytimes.com" | opensincera --csv --header
  
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
  // Basic domain validation: labels separated by dots, no leading/trailing hyphens
  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  return domainRegex.test(domain);
}

/**
 * Main execution
 */
async function main() {
  // Parse arguments
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
  const domain = args.find(arg => !arg.startsWith('--'));

  // Get domain from args or stdin
  let targetDomain;
  
  if (domain) {
    targetDomain = domain;
  } else if (!process.stdin.isTTY) {
    // Read from stdin
    const stdinBuffer = [];
    for await (const chunk of process.stdin) {
      stdinBuffer.push(chunk);
    }
    targetDomain = Buffer.concat(stdinBuffer).toString('utf-8').trim();
  } else {
    console.error('Error: No domain provided');
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

  // Query API
  try {
    const client = new OpenSinceraClient(API_KEY);
    const result = await client.getPublisherByDomain(targetDomain);

    // Output
    if (outputCSV) {
      if (includeHeader) {
        console.log(getCSVHeader());
      }
      console.log(formatCSV(result));
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run
main();
