import http from "node:http";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import { setTimeout } from "node:timers";
import process from "node:process";
import console from "node:console";

const root = new URL("./", import.meta.url);
let release;
try {
  release = JSON.parse(
    readFileSync(new URL("dist/release.json", root), "utf8"),
  );
} catch {
  throw new Error("Build the app first: npm run build");
}
const port = Number(process.env.PORT || 3100);
if (!Number.isInteger(port) || port < 0 || port > 65535)
  throw new Error("PORT must be an integer between 0 and 65535.");
function publicUrl(value) {
  try {
    const url = new URL(value || "");
    return ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
const info = {
  ...release,
  brandName: (process.env.BRAND_NAME || "PoRender").slice(0, 80),
  brandLogoUrl: publicUrl(process.env.BRAND_LOGO_URL),
  appUrl: publicUrl(process.env.APP_URL),
  deploymentId: process.env.PORENDER_DEPLOYMENT_ID || null,
  serviceId: process.env.PORENDER_SERVICE_ID || null,
  startedAt: new Date().toISOString(),
};
const files = new Map([
  ["/", ["text/html; charset=utf-8", "public/index.html"]],
  ["/styles.css", ["text/css; charset=utf-8", "public/styles.css"]],
  ["/app.js", ["text/javascript; charset=utf-8", "public/app.js"]],
]);
const assets = new Map(
  [...files].map(([route, [type, file]]) => [
    route,
    { type, body: readFileSync(new URL(file, root)) },
  ]),
);
const server = http.createServer((request, response) => {
  response.setHeader("cache-control", "no-store");
  response.setHeader("x-content-type-options", "nosniff");
  response.setHeader("x-app-version", info.version);
  response.setHeader(
    "content-security-policy",
    "default-src 'self'; img-src 'self' https: http: data:; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
  );
  if (!["GET", "HEAD"].includes(request.method || "")) {
    request.resume();
    response.writeHead(405, { allow: "GET, HEAD" }).end();
    return;
  }
  let pathname;
  try {
    pathname = new URL(request.url || "/", "http://localhost").pathname;
  } catch {
    response.writeHead(400).end();
    return;
  }
  let status = 200,
    type = "application/json; charset=utf-8",
    body;
  if (pathname === "/health") {
    status = info.healthy ? 200 : 503;
    body = JSON.stringify({ healthy: info.healthy, version: info.version });
  } else if (pathname === "/api/version") body = JSON.stringify(info);
  else if (assets.has(pathname)) ({ type, body } = assets.get(pathname));
  else {
    status = 404;
    body = JSON.stringify({ error: "Not found" });
  }
  // Health probes are intentionally quiet; query strings and environment values are never logged.
  if (pathname !== "/health")
    console.log(
      JSON.stringify({
        event: "request",
        version: info.version,
        status,
        route:
          assets.has(pathname) || pathname === "/api/version"
            ? pathname
            : "not_found",
        deploymentId: info.deploymentId,
      }),
    );
  response.writeHead(status, { "content-type": type });
  response.end(request.method === "HEAD" ? undefined : body);
});
server.headersTimeout = 5000;
server.requestTimeout = 10000;
server.listen(port, "0.0.0.0", () => {
  const address = server.address();
  console.log(
    JSON.stringify({
      event: "started",
      version: info.version,
      deploymentId: info.deploymentId,
      port: typeof address === "object" ? address.port : port,
    }),
  );
  console.log(
    "Local: http://localhost:" +
      (typeof address === "object" ? address.port : port),
  );
});
function shutdown() {
  console.log(
    JSON.stringify({
      event: "stopping",
      version: info.version,
      deploymentId: info.deploymentId,
    }),
  );
  server.close(() => process.exit(0));
  server.closeIdleConnections();
  setTimeout(() => process.exit(1), 5000).unref();
}
process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
