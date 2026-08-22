import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const fontPath = path.join(ROOT, "src/assets/fonts/material-symbols-rounded.woff2");
const fontData = fs.readFileSync(fontPath).toString("base64");

async function generate() {
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const sizes = [16, 32, 48, 128];

  for (const size of sizes) {
    const page = await browser.newPage();
    await page.setViewport({ width: size, height: size, deviceScaleFactor: 2 });

    const strokeWidth = size >= 48 ? 3 : (size >= 32 ? 2 : 1.2);
    const fontSize = Math.round(size * 0.88);

    const html = `<!DOCTYPE html>
<html>
<head>
<style>
  @font-face {
    font-family: "Material Symbols Rounded";
    src: url("data:font/woff2;base64,${fontData}") format("woff2");
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: ${size}px;
    height: ${size}px;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .icon {
    font-family: "Material Symbols Rounded";
    font-size: ${fontSize}px;
    line-height: 1;
    color: #1f1f1f;
    -webkit-text-stroke: ${strokeWidth}px #ffffff;
    paint-order: stroke fill;
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-font-smoothing: antialiased;
    font-feature-settings: "liga";
  }
</style>
</head>
<body>
  <span class="icon">crossword</span>
</body>
</html>`;

    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);

    const outPath = path.join(ROOT, `src/icons/icon${size}.png`);
    await page.screenshot({ path: outPath, omitBackground: true });
    console.log(`Generated ${outPath} (${size}x${size})`);
    await page.close();
  }

  await browser.close();
}

generate().catch(console.error);
