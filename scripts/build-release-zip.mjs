import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const RELEASE_DIR = path.join(ROOT, "release");

if (!fs.existsSync(RELEASE_DIR)) {
  fs.mkdirSync(RELEASE_DIR, { recursive: true });
}

// 1. Build dist
console.log("Building extension...");
execSync("npm run build", { cwd: ROOT, stdio: "inherit" });

// 2. Read manifest version
const manifest = JSON.parse(fs.readFileSync(path.join(DIST, "manifest.json"), "utf8"));
const version = manifest.version || "1.0.0";
const zipName = `extension-drawer-${version}.zip`;
const zipPath = path.join(RELEASE_DIR, zipName);

// 3. Remove existing zip if any
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

// 4. Create zip with manifest.json at the root of the archive
console.log(`Packing ${zipPath} from ${DIST}...`);
execSync(`cd "${DIST}" && zip -r "${zipPath}" .`, { stdio: "inherit" });

// 5. Inspect zip contents
console.log("\n--- Release ZIP Inspection ---");
const listing = execSync(`unzip -l "${zipPath}"`, { encoding: "utf8" });
console.log(listing);

const stats = fs.statSync(zipPath);
console.log(`Release ZIP successfully created: ${zipPath} (${(stats.size / 1024).toFixed(2)} KB)`);
