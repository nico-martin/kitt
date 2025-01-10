import dotenv from "dotenv";
import fs from "fs";
import http from "http";
import https from "https";
import fetch from "node-fetch";
import url from "url";

dotenv.config();

console.log(process.env.SSL_KEY);
console.log(process.env.SSL_CRT);
// Load SSL credentials from .env file
const sslKey = fs.readFileSync(process.env.SSL_KEY);
const sslCert = fs.readFileSync(process.env.SSL_CRT);

// Create an HTTPS server
const server = https.createServer(
  {
    key: sslKey,
    cert: sslCert,
  },
  (req, res) => {
    const allowedOrigin = req.headers.origin;
    if (allowedOrigin) {
      res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    }
    res.setHeader("Access-Control-Allow-Methods", "GET");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    const queryObject = url.parse(req.url, true).query;
    const targetUrl = queryObject.url;

    if (!targetUrl) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end(
        "Error: Please provide a URL as a query parameter, e.g., ?url=https://example.com"
      );
      return;
    }

    // Validate the target URL (only allow http and https protocols)
    try {
      const parsedUrl = new URL(targetUrl);
      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        throw new Error("Invalid protocol", parsedUrl.protocol);
      }
    } catch (err) {
      res.writeHead(400, { "Content-Type": "text/html" });
      res.end("Error: Invalid URL");
      return;
    }

    fetch(targetUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then((data) => {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(data);
      })
      .catch((err) => {
        res.writeHead(500, { "Content-Type": "text/html" });
        res.end(`Error fetching content: ${err.message}`);
      });
  }
);

// Start the server
const PORT = 8443;
server.listen(PORT, () => {
  console.log(`HTTPS server is running on port ${PORT}`);
});
