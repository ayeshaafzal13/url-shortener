// server.js
// A URL Shortener built ONLY with Node.js core modules:
// http (server), fs (storage), url (parsing), crypto (short code generation)
// No Express. No database. This is the point of the exercise.

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { readData, writeData } = require('./utils/fileStore');

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// ---------------------------------------------------------
// EVENT LOOP DEMO
// These three logs prove that Node does NOT run top-to-bottom
// like a simple script when async operations are involved.
// ---------------------------------------------------------
console.log('1. Server script starts executing (sync)');

fs.readFile(path.join(PUBLIC_DIR, 'index.html'), 'utf-8', () => {
  console.log('3. This runs LATER — inside the fs.readFile callback (async, event loop)');
});

console.log('2. Server script keeps running (sync) — this logs BEFORE line 3');
// Expected console order when you run `npm start`: 1, 2, then 3.
// Why: fs.readFile is handed off to Node's thread pool. The main thread
// does NOT wait for it — it moves on to the next line immediately.
// Once the file read finishes, the callback is queued and the EVENT LOOP
// picks it up only after the current synchronous code has finished.
// ---------------------------------------------------------

// Helper: generates a short random code, e.g. "a1b2c3"
function generateShortCode() {
  return crypto.randomBytes(4).toString('hex').slice(0, 6);
}

// Helper: sends a JSON response with less boilerplate
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// The actual server. createServer takes a callback that runs
// EVERY TIME a request comes in. req = incoming request, res = what we send back.
const server = http.createServer((req, res) => {
  const { method, url } = req;

  // ----- ROUTE 1: GET / -> serve the HTML form -----
  if (method === 'GET' && url === '/') {
    fs.readFile(path.join(PUBLIC_DIR, 'index.html'), 'utf-8', (err, content) => {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading page');
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    });
    return;
  }

  // ----- ROUTE 2: POST /shorten -> create a new short URL -----
  if (method === 'POST' && url === '/shorten') {
    let body = '';

    // req is a STREAM. Data arrives in chunks, not all at once.
    // We listen for 'data' events and concatenate the chunks.
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    // 'end' event fires once all chunks have arrived.
    req.on('end', () => {
      try {
        let { url: longUrl } = JSON.parse(body);
        if (!longUrl || !longUrl.trim()) {
          return sendJSON(res, 400, { error: 'URL is required' });
        }
        longUrl = longUrl.trim();

        // A redirect Location header needs a full URL (with protocol).
        // Without this, "www.example.com" is treated as a RELATIVE path
        // by the browser, not an external address — which breaks the redirect.
        if (!/^https?:\/\//i.test(longUrl)) {
          longUrl = 'https://' + longUrl;
        }

        const data = readData();          // fs READ
        const shortCode = generateShortCode();
        data[shortCode] = longUrl;
        writeData(data);                  // fs WRITE

        sendJSON(res, 201, {
          shortCode,
          shortUrl: `http://localhost:${PORT}/${shortCode}`,
        });
      } catch (err) {
        sendJSON(res, 400, { error: 'Invalid JSON body' });
      }
    });
    return;
  }

  // ----- ROUTE 3: GET /urls -> view all saved mappings -----
  if (method === 'GET' && url === '/urls') {
    const data = readData();
    return sendJSON(res, 200, data);
  }

  // ----- ROUTE 4: GET /:code -> redirect to the original long URL -----
  if (method === 'GET' && url.length > 1) {
    const shortCode = url.slice(1); // remove leading "/"
    const data = readData();

    if (data[shortCode]) {
      res.writeHead(302, { Location: data[shortCode] }); // 302 = temporary redirect
      return res.end();
    }
    return sendJSON(res, 404, { error: 'Short URL not found' });
  }

  // ----- FALLBACK: nothing matched -----
  sendJSON(res, 404, { error: 'Route not found' });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
