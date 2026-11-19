import process from "node:process";
import console from "node:console";
import http from "node:http";
import pg from "pg";

const pool = process.env.DATABASE_URL
  ? new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2,
      connectionTimeoutMillis: 3000, query_timeout: 3000 })
  : null;
pool?.on("error", () => console.error("database connection unavailable"));
const server = http.createServer(async (request, response) => {
  if (!["/", "/health"].includes(request.url)) {
    response.writeHead(404); response.end("Not found"); return;
  }
  try {
    if (pool) await pool.query("SELECT 1");
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({
      status: "ok", version: process.env.APP_VERSION || "v1",
      message: process.env.APP_MESSAGE || "Hello from PoRender",
      database: pool ? "connected" : "not_configured",
    }));
    console.log("request " + request.url + " 200");
  } catch {
    response.writeHead(503); response.end("Database unavailable");
    console.error("database health check failed");
  }
});
server.listen(Number(process.env.PORT || 10000), "0.0.0.0", () => {
  console.log("starter ready");
});
process.once("SIGTERM", () => server.close(async () => {
  await pool?.end(); process.exit(0);
}));
