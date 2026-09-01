const { readData, writeData } = require('../utils/fileStore');
const crypto = require('crypto');

function generateShortCode() {
  return crypto.randomBytes(4).toString('hex').slice(0, 6);
}

module.exports = (req, res) => {

  // POST /shorten
  if (req.method === 'POST') {

    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {

      try {
        const parsed = JSON.parse(body);

        let longUrl = parsed.url;

        if (!longUrl || !longUrl.trim()) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({
            error: 'URL is required'
          }));
        }

        longUrl = longUrl.trim();

        if (!/^https?:\/\//i.test(longUrl)) {
          longUrl = 'https://' + longUrl;
        }

        const data = readData();

        const shortCode = generateShortCode();

        data[shortCode] = longUrl;

        writeData(data);

        const baseUrl = `https://${req.headers.host}`;

        res.statusCode = 201;
        res.setHeader('Content-Type', 'application/json');

        res.end(JSON.stringify({
          shortCode,
          shortUrl: `${baseUrl}/${shortCode}`
        }));

      } catch (error) {

        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');

        res.end(JSON.stringify({
          error: 'Invalid JSON format. Please send valid JSON.'
        }));
      }
    });

    return;
  }

  // GET /urls
  if (req.method === 'GET') {

    const data = readData();

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');

    return res.end(JSON.stringify(data));
  }

  res.statusCode = 404;
  res.end('Route not found');
};