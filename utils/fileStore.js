// utils/fileStore.js
// This file is a small "helper module" — a core Node.js concept.
// It groups together all the fs (file system) logic in one place,
// and other files can import it using CommonJS's require().

const fs = require('fs');
const path = require('path');

// path.join builds an absolute path safely across OSes (Windows vs Linux/Mac)
const DATA_FILE = path.join(__dirname, '..', 'data.json');

// ---- READ ----
// Reads data.json and returns it as a JS object.
// We use the SYNC version here (readFileSync) deliberately in a couple of
// places for simplicity, but the server itself uses the ASYNC versions
// (see server.js) so we can demonstrate the event loop properly.
function readData() {
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw || '{}');
}

// ---- WRITE ----
// Takes a JS object, converts it to JSON text, and writes it to data.json
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// module.exports is how CommonJS shares code between files.
// Anything attached here becomes available via require('./utils/fileStore')
module.exports = { readData, writeData, DATA_FILE };
