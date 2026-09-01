// server.js
// A URL Shortener built ONLY with Node.js core modules:
// http (server), fs (storage), url (parsing), crypto (short code generation)
// No Express. No database. This is the point of the exercise.

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { readData, writeData } = require('./utils/fileStore');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// ---------------------------------------------------------
// EVENT LOOP DEMO
// ---------------------------------------------------------
console.log('1. Server script starts executing (sync)');

fs.readFile(path.join(PUBLIC_DIR, 'index.html'), 'utf-8', () => {
  console.log('3. This runs LATER — inside the fs.readFile callback (async, event loop)');
});

console.log('2. Server script keeps running (sync) — this logs BEFORE line 3');
// ---------------------------------------------------------

function generateShortCode() {
  return crypto.randomBytes(4).toString('hex').slice(0, 6);
}

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  const { method, url } = req;

  // =============================================
  // ROUTE 1: GET / -> serve the HTML form
  // =============================================
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

  // =============================================
  // ROUTE 2: POST /shorten -> create a new short URL
  // =============================================
  if (method === 'POST' && url === '/shorten') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      console.log('📥 Raw body received:', body); // Debug log

      // ✅ FIX: Check if body is empty
      if (!body || body.trim() === '') {
        console.log('❌ Empty body');
        return sendJSON(res, 400, { error: 'Request body is empty' });
      }

      try {
        const parsed = JSON.parse(body);
        console.log('✅ Parsed JSON:', parsed); // Debug log

        let longUrl = parsed.url;

        if (!longUrl || !longUrl.trim()) {
          return sendJSON(res, 400, { error: 'URL is required' });
        }

        longUrl = longUrl.trim();

        // Add https:// if missing
        if (!/^https?:\/\//i.test(longUrl)) {
          longUrl = 'https://' + longUrl;
        }

        const data = readData();
        const shortCode = generateShortCode();
        data[shortCode] = longUrl;
        writeData(data);

        // ✅ FIX: Correct URL for Vercel
        const baseUrl = process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : `http://localhost:${PORT}`;

        console.log('✅ Short URL created:', shortCode); // Debug log

        sendJSON(res, 201, {
          shortCode,
          shortUrl: `${baseUrl}/${shortCode}`,
        });
      } catch (err) {
        console.log('❌ JSON Parse Error:', err.message); // Debug log
        sendJSON(res, 400, { error: 'Invalid JSON format. Please send valid JSON.' });
      }
    });
    return;
  }

  // =============================================
  // ROUTE 3: GET /urls -> view all saved mappings
  // =============================================
  if (method === 'GET' && url === '/urls') {
    const data = readData();
    return sendJSON(res, 200, data);
  }

  // =============================================
  // ROUTE 4: GET /:code -> redirect to the original long URL
  // =============================================
  if (method === 'GET' && url && url.length > 1 && url !== '/favicon.ico') {
    const shortCode = url.slice(1);
    const data = readData();

    if (data[shortCode]) {
      res.writeHead(302, { Location: data[shortCode] });
      return res.end();
    }
    return sendJSON(res, 404, { error: 'Short URL not found' });
  }

  // =============================================
  // FALLBACK: nothing matched
  // =============================================
  sendJSON(res, 404, { error: 'Route not found' });
});

server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`📁 Routes:`);
  console.log(`   GET  /           - Home page`);
  console.log(`   POST /shorten    - Create short URL`);
  console.log(`   GET  /urls       - View all URLs`);
  console.log(`   GET  /:code      - Redirect to original URL`);
});