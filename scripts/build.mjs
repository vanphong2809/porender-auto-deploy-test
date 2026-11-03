import { readFile, mkdir, writeFile } from "node:fs/promises";
import console from "node:console";
import { URL } from "node:url";

const root = new URL("../", import.meta.url);
const source = JSON.parse(
  await readFile(new URL("version.json", root), "utf8"),
);
if (
  typeof source.version !== "string" ||
  !/^[A-Za-z0-9._-]{1,32}$/.test(source.version) ||
  typeof source.message !== "string" ||
  source.message.length > 160 ||
  typeof source.healthy !== "boolean"
)
  throw new Error(
    "version.json requires a valid version, message (up to 160 characters) and boolean healthy.",
  );

await mkdir(new URL("dist/", root), { recursive: true });
await writeFile(
  new URL("dist/release.json", root),
  JSON.stringify(
    {
      version: source.version,
      message: source.message,
      healthy: source.healthy,
      builtAt: new Date().toISOString(),
    },
    null,
    2,
  ) + "\n",
);
console.log("Built deployment test " + source.version);
