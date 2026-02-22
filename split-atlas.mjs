#!/usr/bin/env node
// split-atlas.mjs — Split 6×6 sprite sheet atlases into individual frame PNGs
// Output matches HyFire2 convention: game-sprites/{effect-name}/0000.png
//
// Usage:
//   node split-atlas.mjs              # Split curated game-ready effects
//   node split-atlas.mjs --all        # Split ALL 151 sprites
//   node split-atlas.mjs --nums 103,120,138  # Split specific sprite numbers

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const puppeteer = require("/home/ab/.nvm/versions/node/v25.2.1/lib/node_modules/puppeteer");
import fs from 'fs';
import path from 'path';

const GRID = 6, FRAMES = 36;
const SPRITES_DIR = path.resolve('sprites');
const OUTPUT_DIR = path.resolve('game-sprites');

// Curated game-ready VFX effects
const GAME_EFFECTS = [
  { num: 103, name: 'shockwave-pulse' },
  { num: 119, name: 'phoenix-rebirth' },
  { num: 120, name: 'supernova' },
  { num: 125, name: 'chain-lightning' },
  { num: 126, name: 'solar-flare' },
  { num: 132, name: 'quantum-entangle' },
  { num: 135, name: 'smoke-ring' },
  { num: 137, name: 'dissolve' },
  { num: 138, name: 'energy-shield' },
  { num: 139, name: 'reality-shatter' },
  { num: 140, name: 'blood-moon' },
  { num: 143, name: 'dragon-breath' },
  { num: 148, name: 'neon-rain' },
  { num: 150, name: 'emp-blast' },
  { num: 151, name: 'summoning-circle' },
];

// Full catalog names (for --all mode)
const ALL_NAMES = {
  1:'electric-tendrils',2:'plasma-burst',3:'fire-wisps',4:'blue-flame',5:'golden-sparks',
  6:'toxic-cloud',7:'ice-crystals',8:'lava-bubbles',9:'energy-pulse',10:'smoke-trails',
  11:'magic-dust',12:'lightning-strike',13:'water-ripple',14:'ember-glow',15:'neon-flicker',
  16:'shadow-mist',17:'star-field',18:'heat-haze',19:'frost-wave',20:'acid-splash',
  21:'solar-wind',22:'void-energy',23:'crystal-shine',24:'blood-drops',25:'ghost-flame',
  26:'rainbow-arc',27:'metal-sparks',28:'leaf-scatter',29:'sand-storm',30:'bubble-pop',
  31:'thunder-crack',32:'snow-fall',33:'fire-ring',34:'gravity-well-pixy',35:'light-beam',
  36:'dark-pulse',37:'wind-slash',38:'earth-crack',39:'water-splash',40:'steam-vent',
  41:'spark-shower',42:'mist-cloud',43:'flame-jet',44:'ice-shard',45:'poison-cloud',
  46:'holy-light',47:'shadow-bolt',48:'arcane-blast',49:'nature-bloom',50:'inferno-wave',
  51:'frost-nova',52:'chain-heal',53:'soul-fire',54:'thunder-storm',55:'tidal-wave',
  56:'earthquake',57:'tornado-pixy',58:'meteor-shower',59:'blizzard',60:'volcanic-eruption',
  61:'celestial-beam',62:'void-rift',63:'plasma-cannon',64:'photon-burst',65:'dark-matter-pixy',
  66:'quantum-flux',67:'nebula-cloud',68:'stellar-wind',69:'cosmic-ray',70:'antimatter-burst',
  71:'graviton-wave',72:'tachyon-pulse',73:'neutrino-stream',74:'dark-energy',75:'warp-field',
  76:'ion-storm',77:'magnetar-pulse',78:'pulsar-beam',79:'quasar-jet',80:'gamma-burst',
  81:'solar-corona',82:'chromatic-aberration',83:'plasma-vortex',84:'energy-cascade',85:'particle-beam',
  86:'fusion-reaction',87:'fission-burst',88:'neutron-star',89:'black-hole-pixy',90:'white-dwarf',
  91:'red-giant',92:'blue-supergiant',93:'brown-dwarf',94:'protostar',95:'planetary-nebula',
  96:'supernova-remnant',97:'accretion-disk',98:'event-horizon',99:'hawking-radiation',100:'prismatic-aura',
  101:'volumetric-nebula',102:'black-hole',103:'shockwave-pulse',104:'plasma-containment',
  105:'julia-fractal',106:'warp-tunnel',107:'warp-inferno',108:'warp-void',109:'warp-electric',
  110:'warp-rainbow',111:'tornado-vortex',112:'bioluminescent',113:'singularity',
  114:'aurora-borealis',115:'cosmic-jellyfish',116:'god-rays',117:'reality-glitch',
  118:'crystal-geode',119:'phoenix-rebirth',120:'supernova',121:'dimensional-portal',
  122:'deep-ocean',123:'galaxy-spiral',124:'mandelbrot-zoom',125:'chain-lightning',
  126:'solar-flare',127:'whirlpool',128:'dna-helix',129:'lava-flow',130:'time-vortex',
  131:'fluid-ink',132:'quantum-entangle',133:'gravity-well',134:'sound-visualizer',
  135:'smoke-ring',136:'magic-runes',137:'dissolve',138:'energy-shield',
  139:'reality-shatter',140:'blood-moon',141:'particle-collider',142:'neural-network',
  143:'dragon-breath',144:'cosmic-eye',145:'hypercube',146:'soul-extraction',
  147:'neon-rain-custom',148:'galaxy-collision',149:'emp-blast-custom',150:'void-tendril',
  151:'summoning-circle',
};

function getEffectList() {
  const args = process.argv.slice(2);
  if (args.includes('--all')) {
    // Find all sprite PNGs
    const files = fs.readdirSync(SPRITES_DIR).filter(f => /^sprite-\d{3}\.png$/.test(f)).sort();
    return files.map(f => {
      const num = parseInt(f.match(/(\d{3})/)[1]);
      return { num, name: ALL_NAMES[num] || `effect-${num}` };
    });
  }
  const numsIdx = args.indexOf('--nums');
  if (numsIdx !== -1 && args[numsIdx + 1]) {
    return args[numsIdx + 1].split(',').map(n => {
      const num = parseInt(n.trim());
      return { num, name: ALL_NAMES[num] || `effect-${num}` };
    });
  }
  return GAME_EFFECTS;
}

async function main() {
  const effects = getEffectList();
  console.log(`Splitting ${effects.length} sprite atlases → individual frames (auto-detect size)\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/home/ab/.cache/puppeteer/chrome/linux-140.0.7339.207/chrome-linux64/chrome',
  });
  const page = await browser.newPage();
  // Canvas size set dynamically per atlas
  await page.setContent(`<!DOCTYPE html><html><body><canvas id="c"></canvas></body></html>`);

  // Build lookup: number → filename
  const spriteFiles = fs.readdirSync(SPRITES_DIR).filter(f => /^\d{3}-.*\.png$/.test(f));
  const numToFile = {};
  for (const f of spriteFiles) numToFile[parseInt(f.slice(0, 3))] = f;

  let done = 0, skipped = 0;
  for (const effect of effects) {
    const spriteFile = numToFile[effect.num];
    if (!spriteFile) {
      console.log(`  ✗ #${effect.num} not found, skipping`);
      skipped++;
      continue;
    }
    const spritePath = path.join(SPRITES_DIR, spriteFile);

    const outDir = path.join(OUTPUT_DIR, effect.name);
    fs.mkdirSync(outDir, { recursive: true });

    const atlasBase64 = fs.readFileSync(spritePath, 'base64');

    const frames = await page.evaluate(async (base64, grid, numFrames) => {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = `data:image/png;base64,${base64}`;
      });
      const sres = Math.round(img.width / grid); // auto-detect frame size
      const canvas = document.getElementById('c');
      canvas.width = sres; canvas.height = sres;
      const ctx = canvas.getContext('2d');
      const results = [];
      for (let f = 0; f < numFrames; f++) {
        const col = f % grid, row = Math.floor(f / grid);
        ctx.clearRect(0, 0, sres, sres);
        ctx.drawImage(img, col * sres, row * sres, sres, sres, 0, 0, sres, sres);
        results.push(canvas.toDataURL('image/png'));
      }
      return { frames: results, sres };
    }, atlasBase64, GRID, FRAMES);

    for (let f = 0; f < frames.frames.length; f++) {
      const data = frames.frames[f].replace(/^data:image\/png;base64,/, '');
      fs.writeFileSync(path.join(outDir, `${String(f).padStart(4, '0')}.png`), Buffer.from(data, 'base64'));
    }

    done++;
    console.log(`  ✓ ${effect.name}: ${frames.frames.length} frames (${frames.sres}px) → ${outDir}/`);
  }

  await browser.close();
  console.log(`\nDone! ${done} effects split, ${skipped} skipped`);
  console.log(`Output: ${OUTPUT_DIR}/`);
}

main().catch(e => { console.error(e); process.exit(1); });
