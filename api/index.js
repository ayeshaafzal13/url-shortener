const { readData, writeData } = require('../utils/fileStore');
const crypto = require('crypto');

function generateShortCode() {
  return crypto.randomBytes(4).toString('hex').slice(0, 6);
}

function sendJSON(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

module.exports = (req, res) => {

  // POST /shorten
  if (req.method === 'POST') {

    try {
      const parsed = req.body;

      let longUrl = parsed?.url;

      if (!longUrl || !longUrl.trim()) {
        return sendJSON(res, 400, {
          error: 'URL is required'
        });
      }

      longUrl = longUrl.trim();

      if (!/^https?:\/\//i.test(longUrl)) {
        longUrl = 'https://' + longUrl;
      }

     const shortCode = generateShortCode();

const baseUrl = `https://${req.headers.host}`;

return sendJSON(res, 201, {
  shortCode,
  shortUrl: `${baseUrl}/${shortCode}`
});

    } catch (error) {
      console.error(error);

      return sendJSON(res, 400, {
        error: 'Could not process request'
      });
    }
  }

  // GET /urls
  if (req.method === 'GET') {

    const data = readData();

    return sendJSON(res, 200, data);
  }

  return sendJSON(res, 404, {
    error: 'Route not found'
  });
};