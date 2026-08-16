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
  {
    slug: 'kenney-tiny-town',
    name: 'Tiny Town',
    pageUrl: 'https://kenney.nl/assets/tiny-town',
    description: '16x16 pixel art top-down town sprites: modular buildings, roads, vehicles, trees, roofs, and urban props by Kenney (kenney.nl). CC0 1.0 Universal.',
    category: 'Tilesets & Environments',
    subcategory: 'Terrain & Platforms',
    allowedCategories: ['Tilesets & Environments', 'Items & Icons'],
    preferSubdir: 'Tiles',
  },
  {
    slug: 'kenney-tiny-battle',
    name: 'Tiny Battle',
    pageUrl: 'https://kenney.nl/assets/tiny-battle',
    description: '16x16 pixel art military strategy sprites: terrain, soldiers, tanks, bases, obstacles, and flags by Kenney (kenney.nl). CC0 1.0 Universal.',
    category: 'Tilesets & Environments',
    subcategory: 'Terrain & Platforms',
    allowedCategories: ['Tilesets & Environments', 'Characters', 'Items & Icons'],
    preferSubdir: 'Tiles',
  },
  {
    slug: 'kenney-tiny-farm',
    name: 'Tiny Farm',
    pageUrl: 'https://kenney.nl/assets/tiny-farm',
    description: '16x16 pixel art farm sprites: crops, soil plots, barns, animals, fences, tools, and farm foliage by Kenney (kenney.nl). CC0 1.0 Universal.',
    category: 'Tilesets & Environments',
    subcategory: 'Nature & Foliage',
    allowedCategories: ['Tilesets & Environments', 'Creatures', 'Items & Icons'],
    preferSubdir: 'Tiles',
  },
  {
    slug: 'kenney-monochrome-rpg',
    name: 'Monochrome RPG',
    pageUrl: 'https://kenney.nl/assets/monochrome-rpg',
    description: '1-bit 16x16 pixel art RPG sprites: dungeon walls, heroes, monsters, items, chests, and world map tiles by Kenney (kenney.nl). CC0 1.0 Universal.',
    category: 'Tilesets & Environments',
    subcategory: 'Dungeon & Ruins',
    allowedCategories: ['Tilesets & Environments', 'Characters', 'Creatures', 'Items & Icons'],
    preferSubdir: 'Tiles',
  },
  {
    slug: 'kenney-hexagon-pack',
    name: 'Hexagon Pack',
    pageUrl: 'https://kenney.nl/assets/hexagon-pack',
    description: 'Hexagonal strategy terrain tiles: plains, water, mountains, forests, roads, and rivers by Kenney (kenney.nl). CC0 1.0 Universal.',
    category: 'Tilesets & Environments',
    subcategory: 'Terrain & Platforms',
    allowedCategories: ['Tilesets & Environments'],
    preferSubdir: 'PNG',
  },
  {
    slug: 'kenney-1-bit-platformer-pack',
    name: '1-Bit Platformer Pack',
    pageUrl: 'https://kenney.nl/assets/1-bit-platformer-pack',
    description: '1-bit retro 16x16 platformer sprites: characters, enemies, terrain tiles, hazards, and items by Kenney (kenney.nl). CC0 1.0 Universal.',
    category: 'Tilesets & Environments',
    subcategory: 'Terrain & Platforms',
    allowedCategories: ['Tilesets & Environments', 'Characters', 'Creatures', 'Items & Icons'],
    preferSubdir: 'Tiles/Default',
  },
  {
    slug: 'kenney-animal-pack-remastered',
    name: 'Animal Pack Remastered',
    pageUrl: 'https://kenney.nl/assets/animal-pack-remastered',
    description: 'High quality vector 2D animals: pets, farm livestock, safari wildlife, birds, and aquatic creatures by Kenney (kenney.nl). CC0 1.0 Universal.',
    category: 'Creatures',
    subcategory: 'Animals & Wildlife',
    allowedCategories: ['Creatures'],
    preferSubdir: 'PNG/Round',
  },
  {
    slug: 'kenney-toon-characters',
    name: 'Toon Characters',
    pageUrl: 'https://kenney.nl/assets/toon-characters',
    description: 'Modular cartoon characters: bodies, heads, hairstyles, expressions, and accessories by Kenney (kenney.nl). CC0 1.0 Universal.',
    category: 'Characters',
    subcategory: 'Humanoids',
    allowedCategories: ['Characters'],
    preferSubdir: 'PNG',
  },
  {
    slug: 'kenney-monster-builder-pack',
    name: 'Monster Builder Pack',
    pageUrl: 'https://kenney.nl/assets/monster-builder-pack',
    description: 'Modular monster parts: bodies, eyes, mouths, tentacles, horns, and appendages for custom creature generation by Kenney (kenney.nl). CC0 1.0 Universal.',
    category: 'Creatures',
    subcategory: 'Monsters & Beasts',
    allowedCategories: ['Creatures'],
    preferSubdir: 'PNG',
  },
  {
    slug: 'kenney-top-down-shooter',
    name: 'Top-Down Shooter',
    pageUrl: 'https://kenney.nl/assets/top-down-shooter',
    description: 'Top-down action sprites: soldiers, survivors, infected zombies, firearms, bullet impacts, and tactical tiles by Kenney (kenney.nl). CC0 1.0 Universal.',
    category: 'Characters',
    subcategory: 'Humanoids',
    allowedCategories: ['Characters', 'Creatures', 'Items & Icons', 'Tilesets & Environments'],
    preferSubdir: 'PNG',
  },
  {
    slug: 'kenney-top-down-tanks-remastered',
    name: 'Top-Down Tanks Remastered',
    pageUrl: 'https://kenney.nl/assets/top-down-tanks-remastered',
    description: 'Modular top-down tanks: tank hulls, turrets, treads, cannon barrels, shells, explosions, and barricades by Kenney (kenney.nl). CC0 1.0 Universal.',
    category: 'Items & Icons',
    subcategory: 'Weapons',
    allowedCategories: ['Items & Icons', 'Effects', 'Tilesets & Environments'],
    preferSubdir: 'PNG',
  },
  {
    slug: 'kenney-pixel-shmup',
    name: 'Pixel Shmup',
    pageUrl: 'https://kenney.nl/assets/pixel-shmup',
    description: 'Pixel art space shoot-em-up sprites: player starships, alien fighters, laser blasts, shields, powerups, and asteroids by Kenney (kenney.nl). CC0 1.0 Universal.',
    category: 'Items & Icons',
    subcategory: 'Weapons',
    allowedCategories: ['Items & Icons', 'Effects'],
    preferSubdir: 'Ships',
  },
  {
    slug: 'kenney-planets',
    name: 'Planets',
    pageUrl: 'https://kenney.nl/assets/planets',
    description: '2D space planets, gas giants, cratered moons, suns, rings, and orbital bodies by Kenney (kenney.nl). CC0 1.0 Universal.',
    category: 'Backgrounds',
    subcategory: 'Landscapes & Vistas',
    allowedCategories: ['Backgrounds'],
    preferSubdir: 'PNG/Default',
  },
  {
    slug: 'kenney-emotes-pack',
    name: 'Emotes Pack',
    pageUrl: 'https://kenney.nl/assets/emotes-pack',
    description: 'Over 100 emotion icons, speech bubbles, question and exclamation prompts, status badges, and interaction markers by Kenney (kenney.nl). CC0 1.0 Universal.',
    category: 'UI',
    subcategory: 'HUD & Icons',
    allowedCategories: ['UI'],
    preferSubdir: 'PNG/Vector/Style 1',
  },
  {
    slug: 'kenney-light-masks',
    name: 'Light Masks',
    pageUrl: 'https://kenney.nl/assets/light-masks',
    description: '2D dynamic lighting gradient textures: flashlights, spotlights, ambient radial glows, and directional cones by Kenney (kenney.nl). CC0 1.0 Universal.',
    category: 'Effects',
    subcategory: 'Noise & Overlays',
    allowedCategories: ['Effects'],
    preferSubdir: 'PNG',
  },
  {
    slug: 'kenney-minimap-pack',
    name: 'Minimap Pack',
    pageUrl: 'https://kenney.nl/assets/minimap-pack',
    description: 'Minimap and radar navigation icons: compass points, quest waypoints, player markers, skull flags, and area pins by Kenney (kenney.nl). CC0 1.0 Universal.',
    category: 'UI',
    subcategory: 'HUD & Icons',
    allowedCategories: ['UI'],
    preferSubdir: 'PNG/Default',
  },
  {
    slug: 'kenney-fantasy-ui-borders',
    name: 'Fantasy UI Borders',
    pageUrl: 'https://kenney.nl/assets/fantasy-ui-borders',
    description: 'Ornate fantasy UI borders: decorative stone and gold window frames, dialogue boxes, headers, corners, and dividers by Kenney (kenney.nl). CC0 1.0 Universal.',
    category: 'UI',
    subcategory: 'Buttons & Controls',
    allowedCategories: ['UI'],
    preferSubdir: 'PNG/Default',
  },
  {
    slug: 'kenney-background-elements-remastered',
    name: 'Background Elements Remastered',
    pageUrl: 'https://kenney.nl/assets/background-elements-remastered',
    description: 'Modular 2D parallax background layers: mountain ranges, hills, clouds, suns, moons, trees, and horizon vistas by Kenney (kenney.nl). CC0 1.0 Universal.',
    category: 'Backgrounds',
    subcategory: 'Landscapes & Vistas',
    allowedCategories: ['Backgrounds'],
    preferSubdir: 'PNG',
  },
  {
    slug: 'kenney-desert-shooter-pack',
    name: 'Desert Shooter Pack',
    pageUrl: 'https://kenney.nl/assets/desert-shooter-pack',
    description: 'Top-down desert shooter sprites: soldiers, vehicles, terrain tiles, sand dunes, barrels, and military weapons by Kenney (kenney.nl). CC0 1.0 Universal.',
    category: 'Characters',
    subcategory: 'Humanoids',
    allowedCategories: ['Characters', 'Items & Icons', 'Tilesets & Environments'],
    preferSubdir: 'PNG',
  },
  {
    slug: 'kenney-simple-space',
    name: 'Simple Space',
    pageUrl: 'https://kenney.nl/assets/simple-space',
    description: 'Top-down space assets: spaceships, lasers, space stations, meteors, shields, and thrusters by Kenney (kenney.nl). CC0 1.0 Universal.',
    category: 'Items & Icons',
    subcategory: 'Weapons',
    allowedCategories: ['Items & Icons', 'Effects'],
    preferSubdir: 'PNG',
  },
  {
    slug: 'kenney-space-shooter-extension',
    name: 'Space Shooter Extension',
    pageUrl: 'https://kenney.nl/assets/space-shooter-extension',
    description: 'Space shooter sprites extension: alien motherships, fighter ships, laser bolts, and tech modules by Kenney (kenney.nl). CC0 1.0 Universal.',
    category: 'Items & Icons',
    subcategory: 'Weapons',
    allowedCategories: ['Items & Icons', 'Effects'],
    preferSubdir: 'PNG',
  },
  {
    slug: 'kenney-sci-fi-rts',
    name: 'Sci-Fi RTS',
    pageUrl: 'https://kenney.nl/assets/sci-fi-rts',
    description: 'Sci-Fi real-time strategy sprites: modular mechs, tanks, alien terrain, refinery bases, and turrets by Kenney (kenney.nl). CC0 1.0 Universal.',
    category: 'Tilesets & Environments',
    subcategory: 'Terrain & Platforms',
    allowedCategories: ['Tilesets & Environments', 'Items & Icons', 'Characters'],
    preferSubdir: 'PNG',
  },
  {
    slug: 'kenney-medieval-rts',
    name: 'Medieval RTS',
    pageUrl: 'https://kenney.nl/assets/medieval-rts',
    description: 'Medieval strategy sprites: knights, archers, castles, siege weapons, terrain tiles, and banners by Kenney (kenney.nl). CC0 1.0 Universal.',
    category: 'Tilesets & Environments',
    subcategory: 'Terrain & Platforms',
    allowedCategories: ['Tilesets & Environments', 'Characters', 'Items & Icons'],
    preferSubdir: 'PNG',
  },
  {
    slug: 'kenney-tower-defense-top-down',
    name: 'Tower Defense (Top-Down)',
    pageUrl: 'https://kenney.nl/assets/tower-defense-top-down',
    description: 'Top-down tower defense sprites: defense turrets, enemy creeps, projectiles, paths, and terrain tiles by Kenney (kenney.nl). CC0 1.0 Universal.',
    category: 'Tilesets & Environments',
    subcategory: 'Terrain & Platforms',
    allowedCategories: ['Tilesets & Environments', 'Items & Icons', 'Creatures'],
    preferSubdir: 'PNG',
  },
  {
    slug: 'kenney-pico-8-platformer',
    name: 'Pico-8 Platformer',
    pageUrl: 'https://kenney.nl/assets/pico-8-platformer',
    description: 'Retro 8x8 / 16x16 Pico-8 style platformer sprites: characters, terrain, gems, ladders, and spikes by Kenney (kenney.nl). CC0 1.0 Universal.',
    category: 'Tilesets & Environments',
    subcategory: 'Terrain & Platforms',
    allowedCategories: ['Tilesets & Environments', 'Characters', 'Items & Icons'],
    preferSubdir: 'Tiles/Default',
  },
  {
    slug: 'kenney-pico-8-city',
    name: 'Pico-8 City',
    pageUrl: 'https://kenney.nl/assets/pico-8-city',
    description: 'Retro Pico-8 style top-down city sprites: modular buildings, cars, pedestrians, traffic lights, and roads by Kenney (kenney.nl). CC0 1.0 Universal.',
    category: 'Tilesets & Environments',
    subcategory: 'Terrain & Platforms',
    allowedCategories: ['Tilesets & Environments', 'Items & Icons'],
    preferSubdir: 'Tiles/Default',
  },
  {
    slug: 'kenney-pixel-vehicle-pack',
    name: 'Pixel Vehicle Pack',
    pageUrl: 'https://kenney.nl/assets/pixel-vehicle-pack',
    description: 'Pixel art vehicles: sports cars, sedans, trucks, ambulances, police cars, boats, and motorcycles by Kenney (kenney.nl). CC0 1.0 Universal.',
    category: 'Items & Icons',
    subcategory: 'Tools & Resources',
    allowedCategories: ['Items & Icons'],
    preferSubdir: 'PNG',
  },
  {
    slug: 'kenney-sports-pack',
    name: 'Sports Pack',
    pageUrl: 'https://kenney.nl/assets/sports-pack',
    description: 'Sports sprites: soccer balls, basketballs, baseball bats, goal posts, helmets, rackets, and trophies by Kenney (kenney.nl). CC0 1.0 Universal.',
    category: 'Items & Icons',
    subcategory: 'Tools & Resources',
    allowedCategories: ['Items & Icons', 'UI'],
    preferSubdir: 'PNG',
  },
  {
    slug: 'kenney-pirate-pack',
    name: 'Pirate Pack',
    pageUrl: 'https://kenney.nl/assets/pirate-pack',
    description: 'Top-down pirate sprites: pirate ships, cannons, islands, treasure chests, flags, and ocean tiles by Kenney (kenney.nl). CC0 1.0 Universal.',
    category: 'Tilesets & Environments',
    subcategory: 'Terrain & Platforms',
    allowedCategories: ['Tilesets & Environments', 'Items & Icons'],
    preferSubdir: 'PNG',
  },
  {
    slug: 'kenney-sokoban',
    name: 'Sokoban',
    pageUrl: 'https://kenney.nl/assets/sokoban',
    description: 'Sokoban puzzle sprites: warehouse worker, crates, targets, stone walls, floors, and doors by Kenney (kenney.nl). CC0 1.0 Universal.',
    category: 'Tilesets & Environments',
    subcategory: 'Terrain & Platforms',
    allowedCategories: ['Tilesets & Environments', 'Characters', 'Items & Icons'],
    preferSubdir: 'PNG',
  },
  {
    slug: 'kenney-ui-pack-sci-fi',
    name: 'UI Pack (Sci-Fi)',
    pageUrl: 'https://kenney.nl/assets/ui-pack-sci-fi',
    description: 'Sci-Fi user interface elements: futuristic panels, holographic bars, digital buttons, frames, and tech HUD widgets by Kenney (kenney.nl). CC0 1.0 Universal.',
    category: 'UI',
    subcategory: 'Buttons & Controls',
    allowedCategories: ['UI'],
    preferSubdir: 'PNG',
  },
  {
    slug: 'kenney-ui-pack-pixel-adventure',
    name: 'UI Pack (Pixel Adventure)',
    pageUrl: 'https://kenney.nl/assets/ui-pack-pixel-adventure',
    description: 'Pixel art adventure UI components: dialog boxes, inventory slots, hearts, buttons, health bars, and icons by Kenney (kenney.nl). CC0 1.0 Universal.',
    category: 'UI',
    subcategory: 'Buttons & Controls',
    allowedCategories: ['UI'],
    preferSubdir: 'PNG',
  },
  {
    slug: 'kenney-board-game-icons',
    name: 'Board Game Icons',
    pageUrl: 'https://kenney.nl/assets/board-game-icons',
    description: 'Board game icons: dice, cards, tokens, meeples, hourglasses, pawns, shields, and victory badges by Kenney (kenney.nl). CC0 1.0 Universal.',
    category: 'Items & Icons',
    subcategory: 'Tools & Resources',
    allowedCategories: ['Items & Icons', 'UI'],
    preferSubdir: 'PNG/Default',
  },
  {
    slug: 'kenney-cursor-pack',
    name: 'Cursor Pack',
    pageUrl: 'https://kenney.nl/assets/cursor-pack',
    description: 'Mouse cursors: pointers, arrows, hand cursors, loading spinners, crosshairs, and grab hands by Kenney (kenney.nl). CC0 1.0 Universal.',
    category: 'UI',
    subcategory: 'Cursors & Crosshairs',
    allowedCategories: ['UI'],
    preferSubdir: 'PNG/Default',
  },
  {
    slug: 'kenney-cursor-pixel-pack',
    name: 'Cursor Pixel Pack',
    pageUrl: 'https://kenney.nl/assets/cursor-pixel-pack',
    description: 'Pixel art mouse cursors: pointers, sword cursors, magic wands, arrows, reticles, and selection cursors by Kenney (kenney.nl). CC0 1.0 Universal.',
    category: 'UI',
    subcategory: 'Cursors & Crosshairs',
    allowedCategories: ['UI'],
    preferSubdir: 'PNG/Default',
  },
  {
    slug: 'kenney-sketch-desert',
    name: 'Sketch Desert',
    pageUrl: 'https://kenney.nl/assets/sketch-desert',
    description: 'Hand-drawn sketchy desert sprites: cacti, sand dunes, bones, rocks, ruins, and desert shrubs by Kenney (kenney.nl). CC0 1.0 Universal.',
    category: 'Tilesets & Environments',
    subcategory: 'Terrain & Platforms',
    allowedCategories: ['Tilesets & Environments'],
    preferSubdir: 'PNG',
  },
  {
    slug: 'kenney-sketch-town',
    name: 'Sketch Town',
    pageUrl: 'https://kenney.nl/assets/sketch-town',
    description: 'Hand-drawn sketchy town sprites: wooden houses, stone walls, carts, chimneys, roofs, and market stalls by Kenney (kenney.nl). CC0 1.0 Universal.',
    category: 'Tilesets & Environments',
    subcategory: 'Terrain & Platforms',
    allowedCategories: ['Tilesets & Environments'],
    preferSubdir: 'PNG',
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

function findBestSpriteDir(extractDir, preferSubdir) {
  if (preferSubdir && existsSync(path.join(extractDir, preferSubdir))) {
    return path.join(extractDir, preferSubdir);
  }
  const candidates = [
    'PNG (Transparent)',
    'PNG/Transparent',
    'PNG/Default',
    'PNG/Retina',
    'PNG/White/2x',
    'PNG/Dark',
    'PNG',
    'Tiles',
    'Sprites',
    'Items',
    'Characters',
    'Ships',
    'Retina',
  ];
  for (const c of candidates) {
    if (existsSync(path.join(extractDir, c))) {
      return path.join(extractDir, c);
    }
  }
  return extractDir;
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
  const srcSpritesDir = findBestSpriteDir(extractDir, def.preferSubdir);

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
