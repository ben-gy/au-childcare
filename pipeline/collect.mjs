// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
// Fetch ACECQA Services CSV + Providers CSV.
// Saves raw CSVs into pipeline/cache/ for the aggregate step.

import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE = join(__dirname, 'cache');

const SOURCES = [
  {
    url: 'https://www.acecqa.gov.au/sites/default/files/national-registers/services/Education-services-au-export.csv',
    file: 'services.csv',
  },
  {
    url: 'https://www.acecqa.gov.au/sites/default/files/national-registers/providers/Approved-providers-au-export.csv',
    file: 'providers.csv',
  },
];

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';

async function fetchCsv(url) {
  const r = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: 'text/csv, */*',
      'Accept-Language': 'en-AU,en;q=0.9',
    },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} fetching ${url}`);
  return await r.text();
}

async function main() {
  await mkdir(CACHE, { recursive: true });
  for (const s of SOURCES) {
    process.stdout.write(`Fetching ${s.file} ... `);
    const text = await fetchCsv(s.url);
    await writeFile(join(CACHE, s.file), text);
    const lines = text.split('\n').length;
    console.log(`${(text.length / 1024 / 1024).toFixed(2)} MB, ~${lines.toLocaleString()} lines`);
  }
  console.log('Collection complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
