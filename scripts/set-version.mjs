import { readFile, writeFile } from "node:fs/promises";
import process from "node:process";
import console from "node:console";
import { URL } from "node:url";

const version = process.argv[2];
if (!version || !/^[A-Za-z0-9._-]{1,32}$/.test(version))
  throw new Error("Usage: npm run set-version -- V2 [message]");
const file = new URL("../version.json", import.meta.url);
const previous = JSON.parse(await readFile(file, "utf8"));
const message =
  process.argv.slice(3).join(" ") ||
  "Version " + version + " deployed from GitHub";
if (message.length > 160)
  throw new Error("Message must be at most 160 characters.");
await writeFile(
  file,
  JSON.stringify({ ...previous, version, message, healthy: true }, null, 2) +
    "\n",
);
console.log(
  "Prepared " +
    version +
    ". Commit version.json and push to the connected branch.",
);
