const http = require("http");
const https = require("https");
const url = require("url");

const PORT = process.env.PORT || 3131;
const CUPS_TARGET = process.env.CUPS_TARGET || "https://ts4:631";

const parsedCups = url.parse(CUPS_TARGET);
const isHttps = parsedCups.protocol === "https:";
const transport = isHttps ? https : http;

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const cupsReq = transport.request(
    {
      hostname: parsedCups.hostname,
      port: parsedCups.port || (isHttps ? 443 : 80),
      path: req.url,
      method: req.method,
      rejectUnauthorized: false,
      headers: {
        ...req.headers,
        host: parsedCups.host,
      },
    },
    (cupsRes) => {
      res.writeHead(cupsRes.statusCode, {
        ...cupsRes.headers,
        "Access-Control-Allow-Origin": "*",
      });
      cupsRes.pipe(res);
    }
  );

  cupsReq.on("error", (err) => {
    console.error("CUPS proxy error:", err.message);
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  });

  req.pipe(cupsReq);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`CUPS Print Agent on http://0.0.0.0:${PORT} -> ${CUPS_TARGET}`);
});
