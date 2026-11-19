# PoRender starter

Copy these files to the root of a Git repository and commit them yourself. Select the repository and branch in PoRender.

- Docker: create Web Service, Runtime Docker, Dockerfile path Dockerfile.
- Native Node: create Web Service, Runtime Node, Build npm ci, Start npm start.
- Blueprint + Postgres: commit render.yaml with the source, create Blueprint, review the plan, select an online host, enter APP_MESSAGE and apply. DATABASE_URL is provided through the private database reference; do not paste its credentials into YAML.

Use PORT supplied by PoRender, bind 0.0.0.0 and health path /health. Root directory is blank when files are at repository root. For a monorepo set the real source directory; Dockerfile path is relative to that directory, Blueprint rootDir must match it. Ordinary Web Services do not require render.yaml. Auto deploy requires a supported Git connection and configured webhook, plus the Auto Deploy/Auto Sync setting. A running deploy may coalesce later updates; version pins, suspend/archive and update hold can block automatic changes.

APP_MESSAGE and APP_VERSION are non-sensitive example values. Put real credentials in PoRender Environment or required Blueprint inputs, never commit .env or secret values. The sample returns APP_MESSAGE publicly; do not use it for secrets. /health returns 503 if a configured database cannot be reached.

This example has no application disk. Data outside a persistent disk is ephemeral. Shared disks are storage reservations; bounded disks enforce their own filesystem limit. Database disk size is a reservation. CPU/RAM limits are separate from storage. Dashboard and app URLs follow the installation's private VPN access settings.

When the first deployment fails, open its build logs for clone/install/build errors or runtime logs for startup/health errors. Check branch/root/Dockerfile or build/start, env, PORT/health path and the selected host. Canceled or failed deployment is not Live. Archive keeps artifact and disk; Restore uses the retained Live version, while pending changes need an explicit deploy.
