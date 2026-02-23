import { createRequire } from "module";
const require = createRequire(import.meta.url);
const puppeteer = require("/home/ab/.nvm/versions/node/v25.2.1/lib/node_modules/puppeteer");
import fs from "fs";
import path from "path";

const URL = "http://localhost:4444/gen-smite.html";
const OUT = path.resolve("game-sprites/lightning-smite");

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  headless: false,
  executablePath: "/home/ab/.cache/puppeteer/chrome/linux-140.0.7339.207/chrome-linux64/chrome",
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-gpu-sandbox",
    "--enable-webgl",
    "--ignore-gpu-blocklist"
  ]
});
const page = await browser.newPage();
page.on("console", m => process.stdout.write(`[page] ${m.text()}\n`));
page.on("pageerror", e => process.stderr.write(`[err] ${e}\n`));

console.log("Loading gen-smite.html...");
await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 120000 });

console.log("Waiting for smite frame generation...");
await page.waitForFunction("window.__done === true", { timeout: 300000, polling: 1000 });

const frames = await page.evaluate(() => window.__frames);
console.log(`Got ${frames.length} frames. Saving to ${OUT}...`);

for (let i = 0; i < frames.length; i++) {
  const b64 = frames[i].replace(/^data:image\/png;base64,/, "");
  const name = String(i).padStart(4, "0") + ".png";
  fs.writeFileSync(path.join(OUT, name), Buffer.from(b64, "base64"));
  process.stdout.write(`  saved ${name}\n`);
}

console.log(`Done! ${frames.length} tall frames (128x512) saved to ${OUT}`);
await browser.close();
