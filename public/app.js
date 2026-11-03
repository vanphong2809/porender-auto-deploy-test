/* global document, fetch, setInterval, AbortSignal */
const element = (id) => document.getElementById(id);
let checking = false;
function time(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));
}
async function refresh() {
  if (checking) return;
  checking = true;
  try {
    const response = await fetch("/api/version", {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) throw new Error("Application unavailable");
    const info = await response.json();
    element("version").textContent = info.version;
    element("message").textContent = info.message;
    element("brand-name").textContent = info.brandName;
    document.title = info.version + " · " + info.brandName + " deploy test";
    if (info.brandLogoUrl) {
      element("brand-logo").src = info.brandLogoUrl;
      element("brand-logo").hidden = false;
      document.querySelector(".brand-mark").hidden = true;
    }
    element("deployment").textContent = info.deploymentId || "Local preview";
    element("deployment").title =
      info.deploymentId || "No host-agent deployment identity";
    element("built").textContent = time(info.builtAt);
    element("started").textContent = time(info.startedAt);
    element("mode").textContent = info.deploymentId
      ? "Served by host agent"
      : "Local preview · not a PaaS deployment";
    element("checked").textContent =
      "Checked " + new Date().toLocaleTimeString();
    element("connection").textContent = info.healthy
      ? "App reachable"
      : "Health check failing";
    element("connection").className =
      "status " + (info.healthy ? "ok" : "error");
  } catch {
    element("connection").textContent = "Connection lost · retrying";
    element("connection").className = "status error";
  } finally {
    checking = false;
  }
}
void refresh();
setInterval(refresh, 5000);
