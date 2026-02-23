import { createRequire } from "module";
const require = createRequire(import.meta.url);
const puppeteer = require("/home/ab/.nvm/versions/node/v25.2.1/lib/node_modules/puppeteer");
import fs from "fs";
import path from "path";

// Parse CLI args: --res=384 --only=201,202 --out=sprites-hires
const args = Object.fromEntries(
  process.argv.slice(2).filter(a => a.startsWith("--")).map(a => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v || "true"];
  })
);
const res = parseInt(args.res) || 192;
const only = args.only || "";
const OUT = path.resolve(args.out || "sprites");

const qp = new URLSearchParams();
if (res !== 192) qp.set("res", res);
if (only) qp.set("only", only);
const qs = qp.toString() ? `?${qp}` : "";
const URL = `http://localhost:4444/gen-composite.html${qs}`;

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

console.log(`Loading ${URL}`);
await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 120000 });

console.log(`Waiting for composite sprites (${res}px)...`);
await page.waitForFunction("window.__done === true", { timeout: 600000, polling: 2000 });

const sprites = await page.evaluate(() => window.__sprites);
console.log(`Got ${sprites.length} composite sprites. Saving...`);

for (const s of sprites) {
  const b64 = s.data.replace(/^data:image\/png;base64,/, "");
  fs.writeFileSync(path.join(OUT, s.name + ".png"), Buffer.from(b64, "base64"));
  process.stdout.write(`  saved ${s.name}.png\n`);
}

console.log(`Done! ${sprites.length} composite PNGs (${res}px frames) saved to ${OUT}`);
await browser.close();
