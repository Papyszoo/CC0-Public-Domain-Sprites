#!/usr/bin/env node
// Downloads and extracts CC0 sprite packs from Kenney.nl, standardizes folders,
// extracts author cover artwork, writes pack.json, and generates store-manifest.json.
//
// Usage:
//   node scripts/fetch-kenney-pack.mjs --all
//   node scripts/fetch-kenney-pack.mjs <pack-slug>

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync, copyFileSync } from 'node:fs';
import path from 'node:path';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PACKS_DIR = path.join(REPO, 'packs');
mkdirSync(PACKS_DIR, { recursive: true });

const KENNEY_PACKS = [
  {
    slug: 'kenney-crosshair-pack',
    name: 'Crosshair Pack',
    pageUrl: 'https://kenney.nl/assets/crosshair-pack',
    description: 'Over 100 crosshairs, reticles, and targeting aiming cursors by Kenney (kenney.nl). CC0 1.0 Universal public domain.',
    category: 'UI',
    subcategory: 'Cursors & Crosshairs',
    allowedCategories: ['UI'],
    preferSubdir: 'PNG/Dark',
  },
  {
    slug: 'kenney-particle-pack',
    name: 'Particle Pack',
    pageUrl: 'https://kenney.nl/assets/particle-pack',
    description: 'Over 80 particle sprites, smoke, fire, magic stars, flares, sparks, and burst VFX by Kenney (kenney.nl). CC0 1.0 Universal public domain.',
    category: 'Effects',
    subcategory: 'Particles',
    allowedCategories: ['Effects'],
    preferSubdir: 'PNG (Transparent)',
  },
  {
    slug: 'kenney-game-icons',
    name: 'Game Icons',
    pageUrl: 'https://kenney.nl/assets/game-icons',
    description: '500+ game and UI icons: controls, audio, media, inventory, tools, buttons, and status indicators by Kenney (kenney.nl). CC0 1.0 Universal public domain.',
    category: 'Items & Icons',
    allowedCategories: ['Items & Icons', 'UI'],
    preferSubdir: 'PNG/White/2x',
  },
  {
    slug: 'kenney-ui-pack',
    name: 'UI Pack',
    pageUrl: 'https://kenney.nl/assets/ui-pack',
    description: 'Classic UI elements: buttons, panels, sliders, checkboxes, progress bars, and dialogue windows by Kenney (kenney.nl). CC0 1.0 Universal public domain.',
    category: 'UI',
    allowedCategories: ['UI'],
    preferSubdir: 'PNG',
  },
  {
    slug: 'kenney-input-prompts',
    name: 'Input Prompts',
    pageUrl: 'https://kenney.nl/assets/input-prompts',
    description: 'Controller, keyboard, and mouse button prompts across platforms (Xbox, PlayStation, Nintendo Switch, Keyboard/Mouse) by Kenney (kenney.nl). CC0 1.0 Universal public domain.',
    category: 'UI',
    subcategory: 'Input Prompts',
    allowedCategories: ['UI'],
    preferSubdir: 'Keyboard & Mouse/Default',
  },
  {
    slug: 'kenney-tiny-dungeon',
    name: 'Tiny Dungeon',
    pageUrl: 'https://kenney.nl/assets/tiny-dungeon',
    description: '130+ 16x16 pixel-art dungeon sprites: stone walls, floors, doors, chests, potions, skeletons, heroes, and props by Kenney (kenney.nl). CC0 1.0 Universal public domain.',
    category: 'Tilesets & Environments',
    subcategory: 'Dungeon & Ruins',
    allowedCategories: ['Tilesets & Environments', 'Characters', 'Creatures', 'Items & Icons'],
    preferSubdir: 'Tiles',
  },
  {
    slug: 'kenney-pixel-platformer',
    name: 'Pixel Platformer',
    pageUrl: 'https://kenney.nl/assets/pixel-platformer',
    description: 'Cute pixel-art platformer sprites: characters, enemies, terrain tiles, foliage, keys, coins, and collectibles by Kenney (kenney.nl). CC0 1.0 Universal public domain.',
    category: 'Tilesets & Environments',
    allowedCategories: ['Tilesets & Environments', 'Characters', 'Creatures', 'Backgrounds', 'Items & Icons'],
    preferSubdir: 'Tiles',
  },
];

async function fetchPageInfo(pageUrl) {
  const html = execSync(`curl -sL "${pageUrl}"`, { maxBuffer: 10 * 1024 * 1024 }).toString();

  // Extract zip URL
  const zipMatch = html.match(/href='(https:\/\/kenney\.nl\/media\/pages\/assets\/[^']*\.zip)'/);
  const zipUrl = zipMatch ? zipMatch[1] : null;

  // Extract cover image
  let coverUrl = null;
  const sampleMatch = html.match(/(https:\/\/kenney\.nl\/media\/pages\/assets\/[^'"]*sample\.png)/);
  const previewMatch = html.match(/(https:\/\/kenney\.nl\/media\/pages\/assets\/[^'"]*preview[^'"]*\.png)/);
  const ogMatch = html.match(/og:image'\s*content='([^']*)'/);

  if (sampleMatch) coverUrl = sampleMatch[1];
  else if (previewMatch) coverUrl = previewMatch[1];
  else if (ogMatch) coverUrl = ogMatch[1];

  return { zipUrl, coverUrl };
}

async function processPack(def) {
  const packRoot = path.join(PACKS_DIR, def.slug);
  console.log(`\n=== Processing [${def.slug}] ${def.name} ===`);

  const { zipUrl, coverUrl } = await fetchPageInfo(def.pageUrl);
  if (!zipUrl) {
    console.error(`Could not find zip URL for ${def.slug} on ${def.pageUrl}`);
    return false;
  }

  console.log(`Found download: ${zipUrl}`);
  const tmpDir = path.join('/tmp', `kenney-intake-${def.slug}-${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });

  const zipPath = path.join(tmpDir, 'pack.zip');
  execSync(`curl -sL "${zipUrl}" -o "${zipPath}"`);

  const extractDir = path.join(tmpDir, 'extracted');
  mkdirSync(extractDir, { recursive: true });
  try {
    execSync(`ditto -xk "${zipPath}" "${extractDir}"`);
  } catch {
    execSync(`unzip -q -o "${zipPath}" -d "${extractDir}"`);
  }

  // Target pack directory
  mkdirSync(packRoot, { recursive: true });
  const spritesDir = path.join(packRoot, 'sprites');
  if (existsSync(spritesDir)) rmSync(spritesDir, { recursive: true, force: true });
  mkdirSync(spritesDir, { recursive: true });

  // Locate sprites source directory in zip
  let srcSpritesDir = null;
  if (def.preferSubdir && existsSync(path.join(extractDir, def.preferSubdir))) {
    srcSpritesDir = path.join(extractDir, def.preferSubdir);
  } else if (existsSync(path.join(extractDir, 'PNG'))) {
    srcSpritesDir = path.join(extractDir, 'PNG');
  } else if (existsSync(path.join(extractDir, 'Sprites'))) {
    srcSpritesDir = path.join(extractDir, 'Sprites');
  } else {
    srcSpritesDir = extractDir;
  }

  // Copy all PNG/SVG files
  function copyImages(fromDir, toDir) {
    const entries = readdirSync(fromDir, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(fromDir, entry.name);
      if (entry.name.startsWith('.')) continue;
      if (entry.name.toLowerCase() === 'preview.png' || entry.name.toLowerCase() === 'sample.png') continue;

      if (entry.isDirectory()) {
        const subTo = path.join(toDir, entry.name);
        mkdirSync(subTo, { recursive: true });
        copyImages(srcPath, subTo);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (ext === '.png' || ext === '.webp' || ext === '.svg') {
          copyFileSync(srcPath, path.join(toDir, entry.name));
        }
      }
    }
  }

  copyImages(srcSpritesDir, spritesDir);

  // Copy or download cover image
  const coverTarget = path.join(packRoot, 'cover.png');
  const internalPreview = path.join(extractDir, 'Preview.png');
  const internalSample = path.join(extractDir, 'Sample.png');

  if (existsSync(internalPreview)) {
    copyFileSync(internalPreview, coverTarget);
  } else if (existsSync(internalSample)) {
    copyFileSync(internalSample, coverTarget);
  } else if (coverUrl) {
    execSync(`curl -sL "${coverUrl}" -o "${coverTarget}"`);
  }

  // Write License.txt
  const licenseFile = path.join(extractDir, 'License.txt');
  if (existsSync(licenseFile)) {
    copyFileSync(licenseFile, path.join(packRoot, 'License.txt'));
  }

  // Write pack.json
  const packMeta = {
    name: def.name,
    creator: 'Kenney',
    website: 'https://kenney.nl',
    license: 'CC0',
    description: def.description,
    generation: {
      category: def.category,
      ...(def.subcategory ? { subcategory: def.subcategory } : {}),
      ...(def.allowedCategories ? { allowed_categories: def.allowedCategories } : {}),
    },
    cover: {
      origin: 'original',
      page: def.pageUrl,
      image: coverUrl || `${def.pageUrl}/preview.png`,
    },
  };

  writeFileSync(path.join(packRoot, 'pack.json'), JSON.stringify(packMeta, null, 2) + '\n');

  // Clean temp
  rmSync(tmpDir, { recursive: true, force: true });

  console.log(`✓ [${def.slug}] successfully intaked into packs/${def.slug}`);
  return true;
}

const args = process.argv.slice(2);
if (args.includes('--all')) {
  for (const def of KENNEY_PACKS) {
    await processPack(def);
  }
} else if (args[0]) {
  const match = KENNEY_PACKS.find((p) => p.slug === args[0] || p.slug.includes(args[0]));
  if (match) {
    await processPack(match);
  } else {
    console.error(`Pack slug '${args[0]}' not recognized in preset list.`);
  }
} else {
  console.log('Usage: node scripts/fetch-kenney-pack.mjs [--all | <pack-slug>]');
}
