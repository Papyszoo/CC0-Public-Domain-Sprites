#!/usr/bin/env node
// Generates store-manifest.json per pack (inside packs/<slug>/store-manifest.json):
// the ModelibrStore "external pack" manifest for each pack under packs/.
//
// Usage:
//   node scripts/generate-store-manifest.mjs --pack <slug>   # Generate manifest for one pack
//   node scripts/generate-store-manifest.mjs [--all]        # Generate manifests for all packs
//   node scripts/generate-store-manifest.mjs --root         # Also write combined root store-manifest.json
//
// One pack = one directory under packs/, holding a pack.json (authored
// metadata), an optional cover.png, sprites/ (images), and store-manifest.json.

import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OWNER_REPO = 'Papyszoo/CC0-Public-Domain-Sprites';

const IMAGE_EXTENSIONS = new Set(['.png', '.webp', '.svg', '.gif', '.jpg', '.jpeg', '.bmp', '.tga']);

const args = process.argv.slice(2);
const packArgIndex = args.indexOf('--pack');
const targetPackSlug = packArgIndex !== -1 ? args[packArgIndex + 1] : null;
const writeRoot = args.includes('--root');

// ---------------------------------------------------------------------------
// Standard Sprite categories & subcategories (ModelibrStore docs/taxonomy.json v1).
// ---------------------------------------------------------------------------
const SPRITE_TAXONOMY = {
  Characters: ['Humanoids', 'Heroes', 'NPCs', 'Animations', 'Portraits & Avatars'],
  Creatures: ['Monsters', 'Animals', 'Bosses', 'Insects', 'Mythological'],
  'Tilesets & Environments': ['Terrain & Platforms', 'Dungeon & Ruins', 'Foliage & Props', 'Architecture', 'Autotiles'],
  'Items & Icons': ['Weapons', 'Armor & Clothing', 'Consumables', 'Loot & Coins', 'Tools & Resources'],
  UI: ['Buttons & Controls', 'Panels & Windows', 'Bars & Gauges', 'Cursors & Crosshairs', 'Input Prompts', 'Fonts & Numbers', 'HUD & Icons'],
  Effects: ['Noise & Overlays', 'Explosions & Smoke', 'Fire & Flames', 'Magic & Spells', 'Hits & Slashes', 'Water & Splashes', 'Particles'],
  Backgrounds: ['Parallax', 'Skyboxes', 'Landscapes & Vistas', 'Patterns & Backdrops'],
};

const SPRITE_CATEGORIES = new Set(Object.keys(SPRITE_TAXONOMY));

const KEYWORD_RULES = [
  // UI Subcategories
  [['button', 'btn', 'checkbox', 'toggle', 'slider', 'switch', 'radio'], 'UI', 'Buttons & Controls'],
  [['panel', 'frame', 'window', 'dialog', 'box_ui', 'container_ui', 'popup', 'menu'], 'UI', 'Panels & Windows'],
  [['healthbar', 'hp', 'mana', 'stamina', 'bar', 'gauge', 'progress', 'meter'], 'UI', 'Bars & Gauges'],
  [['cursor', 'pointer', 'crosshair', 'reticle', 'target_icon'], 'UI', 'Cursors & Crosshairs'],
  [['keyboard', 'gamepad', 'controller', 'button_prompt', 'key_prompt', 'input_icon'], 'UI', 'Input Prompts'],
  [['font', 'number', 'digit', 'letter', 'label', 'text_icon'], 'UI', 'Fonts & Numbers'],
  [['hud', 'minimap', 'compass', 'radar', 'inventory_ui', 'status_icon'], 'UI', 'HUD & Icons'],

  // Effects Subcategories
  [['noise', 'perlin', 'simplex', 'voronoi', 'grain', 'overlay', 'texture_fx'], 'Effects', 'Noise & Overlays'],
  [['explosion', 'blast', 'bomb', 'detonation', 'smoke', 'dust', 'puff'], 'Effects', 'Explosions & Smoke'],
  [['fire', 'flame', 'burn', 'torch', 'ember', 'inferno', 'combustion'], 'Effects', 'Fire & Flames'],
  [['magic', 'spell', 'aura', 'portal', 'runes', 'enchant', 'beam', 'laser', 'shockwave', 'lightning'], 'Effects', 'Magic & Spells'],
  [['hit', 'slash', 'impact', 'strike', 'claw_mark', 'cut', 'stab'], 'Effects', 'Hits & Slashes'],
  [['water', 'splash', 'bubble', 'wave', 'droplet', 'ripple', 'foam', 'liquid'], 'Effects', 'Water & Splashes'],
  [['particle', 'spark', 'star', 'glow', 'glitter', 'sparkle', 'debris'], 'Effects', 'Particles'],

  // Items & Icons Subcategories
  [['weapon', 'sword', 'blade', 'axe', 'shield', 'bow', 'arrow', 'gun', 'pistol', 'rifle', 'dagger', 'staff', 'wand', 'mace', 'spear'], 'Items & Icons', 'Weapons'],
  [['armor', 'helmet', 'shield', 'boot', 'boots', 'glove', 'gloves', 'clothing', 'hat', 'cap', 'robe', 'ring', 'amulet', 'cloak', 'necklace'], 'Items & Icons', 'Armor & Clothing'],
  [['potion', 'bottle', 'flask', 'elixir', 'food', 'apple', 'meat', 'bread', 'cheese', 'fruit', 'drink', 'consumable'], 'Items & Icons', 'Consumables'],
  [['coin', 'gold', 'money', 'gem', 'crystal', 'diamond', 'ruby', 'chest', 'key', 'loot', 'treasure', 'bag'], 'Items & Icons', 'Loot & Coins'],
  [['tool', 'pickaxe', 'hammer', 'axe_tool', 'crafting', 'anvil', 'resource', 'ore', 'wood_item', 'scroll', 'book', 'paper', 'map'], 'Items & Icons', 'Tools & Resources'],

  // Characters Subcategories
  [['hero', 'knight', 'warrior', 'wizard', 'mage', 'rogue', 'ninja', 'archer', 'paladin', 'hunter'], 'Characters', 'Heroes'],
  [['npc', 'villager', 'shopkeeper', 'merchant', 'king', 'queen', 'guard', 'civilian', 'innkeeper'], 'Characters', 'NPCs'],
  [['anim', 'walk', 'run', 'idle', 'jump', 'attack', 'dead', 'hurt', 'sprite_sheet', 'spritesheet', 'motion'], 'Characters', 'Animations'],
  [['portrait', 'avatar', 'face', 'head', 'icon_char', 'mugshot'], 'Characters', 'Portraits & Avatars'],
  [['character', 'player', 'human', 'man', 'woman', 'boy', 'girl', 'person', 'body', 'base_mesh'], 'Characters', 'Humanoids'],

  // Creatures Subcategories
  [['monster', 'slime', 'bat', 'skeleton', 'goblin', 'orc', 'ghost', 'zombie', 'demon', 'golem', 'undead', 'vampire', 'mummy'], 'Creatures', 'Monsters'],
  [['animal', 'dog', 'cat', 'bird', 'fish', 'snake', 'wolf', 'rat', 'bear', 'horse', 'rabbit', 'fox', 'cow', 'sheep', 'pig'], 'Creatures', 'Animals'],
  [['boss', 'dragon', 'leviathan', 'hydra', 'titan', 'behemoth'], 'Creatures', 'Bosses'],
  [['bug', 'spider', 'beetle', 'insect', 'ant', 'wasp', 'scorpion'], 'Creatures', 'Insects'],
  [['alien', 'myth', 'phoenix', 'griffin', 'pegasus', 'unicorn', 'fairy'], 'Creatures', 'Mythological'],

  // Tilesets & Environments Subcategories
  [['terrain', 'platform', 'grass', 'dirt', 'sand', 'mud', 'snow', 'ice', 'rock', 'stone', 'cliff', 'water_tile', 'lava_tile'], 'Tilesets & Environments', 'Terrain & Platforms'],
  [['dungeon', 'cave', 'ruins', 'tomb', 'crypt', 'dungeon_wall'], 'Tilesets & Environments', 'Dungeon & Ruins'],
  [['tree', 'bush', 'plant', 'foliage', 'flower', 'vine', 'mushroom', 'shrub', 'stump', 'flora'], 'Tilesets & Environments', 'Foliage & Props'],
  [['architecture', 'building', 'house', 'castle', 'wall', 'floor', 'door', 'window', 'road', 'street', 'bridge', 'fence', 'brick_tile'], 'Tilesets & Environments', 'Architecture'],
  [['autotile', 'rule_tile', '9patch'], 'Tilesets & Environments', 'Autotiles'],

  // Backgrounds Subcategories
  [['parallax', 'layer1', 'layer2', 'layer3', 'layer4'], 'Backgrounds', 'Parallax'],
  [['skybox', 'nightsky', 'stars', 'space_bg', 'galaxy', 'nebula', 'clouds_bg'], 'Backgrounds', 'Skyboxes'],
  [['landscape', 'mountain_bg', 'horizon', 'vista', 'city_bg', 'forest_bg'], 'Backgrounds', 'Landscapes & Vistas'],
  [['pattern', 'backdrop', 'seamless_bg', 'tileable_bg', 'wallpaper'], 'Backgrounds', 'Patterns & Backdrops'],
];

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.png': return 'image/png';
    case '.webp': return 'image/webp';
    case '.svg': return 'image/svg+xml';
    case '.gif': return 'image/gif';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.bmp': return 'image/bmp';
    default: return 'application/octet-stream';
  }
}

function categorize(relPath, options = {}) {
  const normalized = relPath.toLowerCase().replace(/\\/g, '/');

  // 1. Explicit regex rules from pack.json "generation.category_rules"
  // Format: [ [pattern, category, subcategory?] ]
  if (Array.isArray(options.category_rules)) {
    for (const rule of options.category_rules) {
      const [pattern, category, subcategory] = rule;
      if (new RegExp(pattern, 'i').test(normalized) && SPRITE_CATEGORIES.has(category)) {
        const validSub = subcategory && SPRITE_TAXONOMY[category]?.includes(subcategory) ? subcategory : undefined;
        return { category, subcategory: validSub };
      }
    }
  }

  // 2. Directory segment mapping
  const segments = normalized.split('/').filter(Boolean);
  for (const seg of segments) {
    if (seg === 'characters' || seg === 'character') return { category: 'Characters', subcategory: 'Humanoids' };
    if (seg === 'creatures' || seg === 'creature' || seg === 'monsters' || seg === 'enemies') return { category: 'Creatures', subcategory: 'Monsters' };
    if (seg === 'tilesets' || seg === 'tiles' || seg === 'environments' || seg === 'terrain') return { category: 'Tilesets & Environments', subcategory: 'Terrain & Platforms' };
    if (seg === 'items' || seg === 'icons') return { category: 'Items & Icons', subcategory: 'Weapons' };
    if (seg === 'weapons' || seg === 'equipment') return { category: 'Items & Icons', subcategory: 'Weapons' };
    if (seg === 'ui' || seg === 'gui' || seg === 'interface') return { category: 'UI', subcategory: 'Buttons & Controls' };
    if (seg === 'effects' || seg === 'fx' || seg === 'particles') return { category: 'Effects', subcategory: 'Particles' };
    if (seg === 'backgrounds' || seg === 'background' || seg === 'parallax') return { category: 'Backgrounds', subcategory: 'Landscapes & Vistas' };
  }

  // 3. Keyword matching
  const baseName = path.basename(relPath, path.extname(relPath)).toLowerCase();
  const wordTokens = baseName.split(/[\s_\-]+/).filter(Boolean);

  for (const [keywords, category, subcategory] of KEYWORD_RULES) {
    for (const kw of keywords) {
      if (wordTokens.includes(kw) || baseName.includes(kw)) {
        return { category, subcategory };
      }
    }
  }

  // 4. Default category from options or Items & Icons fallback
  if (options.category && SPRITE_CATEGORIES.has(options.category)) {
    const validSub = options.subcategory && SPRITE_TAXONOMY[options.category]?.includes(options.subcategory)
      ? options.subcategory
      : undefined;
    return { category: options.category, subcategory: validSub };
  }

  return { category: 'Items & Icons', subcategory: 'Tools & Resources' };
}

const sha256 = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

function humanize(name) {
  const stem = path.basename(name, path.extname(name));
  return stem
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((word) => (word === word.toUpperCase() && word.length <= 4 ? word : word[0].toUpperCase() + word.slice(1).toLowerCase()))
    .join(' ');
}

function getAllFiles(dir, fileList = []) {
  if (!existsSync(dir)) return fileList;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.name.startsWith('.')) continue;
    if (entry.isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (IMAGE_EXTENSIONS.has(ext)) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

const packsDir = path.join(REPO, 'packs');
let packSlugs = existsSync(packsDir)
  ? readdirSync(packsDir)
      .filter((n) => existsSync(path.join(packsDir, n, 'pack.json')))
      .sort()
  : [];

if (targetPackSlug) {
  if (!packSlugs.includes(targetPackSlug)) {
    console.error(`Pack '${targetPackSlug}' not found under packs/`);
    process.exit(1);
  }
  packSlugs = [targetPackSlug];
}

const REQUIRED_PACK_KEYS = ['name', 'creator', 'website', 'license', 'description'];
const allPacks = [];

for (const slug of packSlugs) {
  const packRoot = path.join(packsDir, slug);
  const meta = JSON.parse(readFileSync(path.join(packRoot, 'pack.json'), 'utf8'));

  const missing = REQUIRED_PACK_KEYS.filter((k) => !meta[k]);
  if (missing.length) {
    console.error(`packs/${slug}/pack.json is missing: ${missing.join(', ')}`);
    process.exit(1);
  }

  const spritesDir = path.join(packRoot, 'sprites');
  const searchDir = existsSync(spritesDir) ? spritesDir : packRoot;

  // Get pinned commit SHA for this pack
  let packSha;
  try {
    packSha = execSync(`git log -1 --format=%H -- packs/${slug}`, { cwd: REPO }).toString().trim();
  } catch {}
  if (!packSha) {
    try {
      packSha = execSync('git log -1 --format=%H', { cwd: REPO }).toString().trim();
    } catch {}
  }
  const rawBase = `https://raw.githubusercontent.com/${OWNER_REPO}/${packSha || 'main'}`;

  const files = [];
  const items = [];
  const previews = [];
  const seenDisplay = new Map();

  const asset = (relPath) => ({
    rel: relPath.replace(/\\/g, '/'),
    url: `${rawBase}/${relPath.replace(/\\/g, '/').split('/').map(encodeURIComponent).join('/')}`,
    abs: path.join(REPO, relPath),
  });

  const coverPath = path.join(packRoot, 'cover.png');
  if (existsSync(coverPath)) {
    const cover = asset(path.relative(REPO, coverPath));
    previews.push({
      fileName: 'cover.png',
      path: cover.rel,
      externalUrl: cover.url,
      sha256: sha256(cover.abs),
      size: statSync(cover.abs).size,
      contentType: 'image/png',
      type: 'Thumbnail',
    });
  }

  const spriteFiles = getAllFiles(searchDir);

  for (const filePath of spriteFiles) {
    const relFromRepo = path.relative(REPO, filePath).replace(/\\/g, '/');
    const relFromPack = path.relative(packRoot, filePath).replace(/\\/g, '/');
    const fileName = path.basename(filePath);

    if (fileName === 'cover.png' || fileName === 'store-preview.png') {
      continue;
    }

    const ast = asset(relFromRepo);
    let dn = humanize(fileName);

    if (seenDisplay.has(dn)) {
      const parentDir = path.dirname(relFromPack);
      const parentName = parentDir && parentDir !== '.' && parentDir !== 'sprites'
        ? humanize(path.basename(parentDir))
        : null;
      let candidate = parentName ? `${dn} (${parentName})` : dn;
      if (seenDisplay.has(candidate)) {
        const count = (seenDisplay.get(dn) || 1) + 1;
        seenDisplay.set(dn, count);
        candidate = `${candidate} (${count})`;
      }
      dn = candidate;
    }
    seenDisplay.set(dn, (seenDisplay.get(dn) || 0) + 1);

    const fileEntry = {
      fileName,
      path: ast.rel,
      externalUrl: ast.url,
      sha256: sha256(ast.abs),
      size: statSync(ast.abs).size,
      role: 'Image',
    };
    files.push(fileEntry);

    const { category, subcategory } = categorize(relFromPack, meta.generation || {});
    items.push({
      name: dn,
      itemType: 'Sprite',
      metadataJson: JSON.stringify({
        category,
        ...(subcategory ? { subcategory } : {}),
      }),
      isPreviewable: true,
      files: [{ path: ast.rel, role: 'Image' }],
    });

    previews.push({
      fileName,
      path: ast.rel,
      externalUrl: ast.url,
      sha256: fileEntry.sha256,
      size: fileEntry.size,
      contentType: getMimeType(filePath),
      type: 'Thumbnail',
      itemName: dn,
    });
  }

  const packManifest = {
    source: `https://github.com/${OWNER_REPO}`,
    license: meta.license || 'CC0',
    name: meta.name,
    creator: meta.creator,
    website: meta.website,
    description: meta.description,
    folder: `packs/${slug}`,
    pinnedSha: packSha || null,
    itemCount: items.length,
    items,
    files,
    previews,
  };

  // Write per-pack manifest: packs/<slug>/store-manifest.json
  const packManifestPath = path.join(packRoot, 'store-manifest.json');
  writeFileSync(packManifestPath, JSON.stringify(packManifest, null, 2) + '\n');

  allPacks.push(packManifest);

  const byCategory = new Map();
  for (const item of items) {
    const metaObj = JSON.parse(item.metadataJson);
    const cat = metaObj.subcategory ? `${metaObj.category} > ${metaObj.subcategory}` : metaObj.category;
    if (!byCategory.has(cat)) byCategory.set(cat, 0);
    byCategory.set(cat, byCategory.get(cat) + 1);
  }

  const bytes = files.reduce((a, f) => a + f.size, 0);
  const catSummary = Array.from(byCategory.entries())
    .map(([c, count]) => `${c}: ${count}`)
    .join(', ');

  console.log(
    `[${slug}] ${meta.name}: ${items.length} sprites, ${files.length} files, ` +
    `${(bytes / 1024 / 1024).toFixed(2)} MB (${catSummary || 'no categories'}) ` +
    `(pinned: ${packSha ? packSha.slice(0, 8) : 'HEAD'})`
  );
}

if (writeRoot) {
  writeFileSync(
    path.join(REPO, 'store-manifest.json'),
    JSON.stringify({ source: `https://github.com/${OWNER_REPO}`, license: 'CC0', packs: allPacks }, null, 2) + '\n'
  );
  console.log(`\nwrote root store-manifest.json (${allPacks.length} pack(s))`);
}

if (packSlugs.length === 0) {
  console.log('No packs found under packs/. Add a pack with pack.json to generate manifests.');
}
