#!/usr/bin/env node
// One-off migration: strip the per-page OCR `text` field out of src/fileList.json
// (the bulk of its ~5MB) into a flat public/searchIndex.json lookup, fetched
// lazily by the app only when the user actually searches. Run once:
//   node scripts/splitFileList.js
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE_LIST_PATH = path.join(__dirname, '..', 'src', 'fileList.json');
const SEARCH_INDEX_PATH = path.join(__dirname, '..', 'public', 'searchIndex.json');

const fileList = JSON.parse(readFileSync(FILE_LIST_PATH, 'utf-8'));

const searchIndex = {};
let entryCount = 0;
let withText = 0;

for (const yearContent of Object.values(fileList)) {
  for (const images of Object.values(yearContent)) {
    for (const entry of images) {
      entryCount++;
      if (typeof entry.text === 'string' && entry.text.length > 0) {
        searchIndex[entry.image] = entry.text;
        withText++;
      }
      delete entry.text;
    }
  }
}

writeFileSync(FILE_LIST_PATH, JSON.stringify(fileList));
writeFileSync(SEARCH_INDEX_PATH, JSON.stringify(searchIndex));

console.log(`Entries processed: ${entryCount}, with OCR text: ${withText}`);
console.log(`Wrote ${FILE_LIST_PATH}`);
console.log(`Wrote ${SEARCH_INDEX_PATH}`);
