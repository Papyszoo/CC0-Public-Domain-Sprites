#!/usr/bin/env node
// Generates procedural CC0 noise textures (Perlin, Simplex, Voronoi/Cellular, FBM, White, Value)
// for shaders, VFX overlays, masks, and particle alpha maps.
// Zero external dependencies (uses standard node:zlib).
// License: CC0 1.0 Universal (Public Domain)

import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import path from 'node:path';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PACK_SLUG = 'procedural-noise-sprites';
const PACK_DIR = path.join(REPO, 'packs', PACK_SLUG);
const SPRITES_DIR = path.join(PACK_DIR, 'sprites');

mkdirSync(SPRITES_DIR, { recursive: true });

// CRC32 table for PNG chunk checksums
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  CRC_TABLE[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

/** Encodes raw grayscale uint8 array [width * height] as PNG Buffer */
function encodeGrayscalePNG(width, height, pixels) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR: width(4), height(4), bitDepth=8(1), colorType=0 (Grayscale)(1), comp=0(1), filter=0(1), interlace=0(1)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // 8 bits per channel
  ihdrData[9] = 0;  // Grayscale
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0
  const scanlines = Buffer.alloc(height * (1 + width));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    scanlines[offset++] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      scanlines[offset++] = pixels[y * width + x];
    }
  }

  const idatChunk = makeChunk('IDAT', deflateSync(scanlines));
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Simple pseudo-random permutation table for reproducible noise
const P = new Uint8Array(512);
const PERM = [
  151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,
  8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,
  35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,
  134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,
  55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,
  18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,
  250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,
  189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,
  172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,
  228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,
  107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,
  138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
];
for (let i = 0; i < 256; i++) P[i] = P[256 + i] = PERM[i];

function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(t, a, b) { return a + t * (b - a); }
function grad(hash, x, y) {
  const h = hash & 7;
  const u = h < 4 ? x : y;
  const v = h < 4 ? y : x;
  return ((h & 1) ? -u : u) + ((h & 2) ? -2.0 * v : 2.0 * v);
}

function perlin2d(x, y) {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  x -= Math.floor(x);
  y -= Math.floor(y);
  const u = fade(x);
  const v = fade(y);
  const A = P[X] + Y, AA = P[A], AB = P[A + 1];
  const B = P[X + 1] + Y, BA = P[B], BB = P[B + 1];
  return lerp(v,
    lerp(u, grad(P[AA], x, y), grad(P[BA], x - 1, y)),
    lerp(u, grad(P[AB], x, y - 1), grad(P[BB], x - 1, y - 1))
  );
}

function fbm2d(x, y, octaves = 6, lacunarity = 2.0, gain = 0.5) {
  let total = 0, frequency = 1.0, amplitude = 1.0, maxValue = 0;
  for (let i = 0; i < octaves; i++) {
    total += perlin2d(x * frequency, y * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }
  return total / maxValue;
}

function voronoi2d(x, y, type = 'f1') {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  let d1 = 1e9, d2 = 1e9;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const cx = xi + dx;
      const cy = yi + dy;
      const h = P[(P[cx & 255] + cy) & 255] / 255;
      const h2 = P[(P[(cx + 17) & 255] + cy + 31) & 255] / 255;
      const px = cx + h;
      const py = cy + h2;
      const dist = Math.hypot(x - px, y - py);
      if (dist < d1) {
        d2 = d1;
        d1 = dist;
      } else if (dist < d2) {
        d2 = dist;
      }
    }
  }
  if (type === 'f2_f1') return Math.min(1, Math.max(0, (d2 - d1) * 1.5));
  if (type === 'cells') return (P[(P[xi & 255] + yi) & 255] / 255);
  return Math.min(1, Math.max(0, d1));
}

const NOISE_PRESETS = [
  { name: 'perlin-noise-low-frequency.png', fn: (x, y) => perlin2d(x * 3, y * 3) * 0.5 + 0.5 },
  { name: 'perlin-noise-mid-frequency.png', fn: (x, y) => perlin2d(x * 8, y * 8) * 0.5 + 0.5 },
  { name: 'perlin-noise-high-frequency.png', fn: (x, y) => perlin2d(x * 16, y * 16) * 0.5 + 0.5 },
  { name: 'perlin-noise-billowy.png', fn: (x, y) => Math.abs(perlin2d(x * 6, y * 6)) },
  { name: 'perlin-noise-turbulent.png', fn: (x, y) => 1.0 - Math.abs(perlin2d(x * 6, y * 6)) },
  { name: 'fbm-noise-soft.png', fn: (x, y) => fbm2d(x * 4, y * 4, 4) * 0.5 + 0.5 },
  { name: 'fbm-noise-detailed.png', fn: (x, y) => fbm2d(x * 4, y * 4, 8) * 0.5 + 0.5 },
  { name: 'fbm-noise-clouds.png', fn: (x, y) => Math.pow(Math.max(0, fbm2d(x * 5, y * 5, 6) * 0.5 + 0.5), 1.6) },
  { name: 'fbm-domain-warped.png', fn: (x, y) => {
    const qx = fbm2d(x * 4, y * 4, 4);
    const qy = fbm2d(x * 4 + 5.2, y * 4 + 1.3, 4);
    return fbm2d(x * 4 + 4 * qx, y * 4 + 4 * qy, 6) * 0.5 + 0.5;
  }},
  { name: 'voronoi-cellular-f1.png', fn: (x, y) => voronoi2d(x * 6, y * 6, 'f1') },
  { name: 'voronoi-cracked-edges.png', fn: (x, y) => voronoi2d(x * 6, y * 6, 'f2_f1') },
  { name: 'voronoi-crystal-cells.png', fn: (x, y) => voronoi2d(x * 6, y * 6, 'cells') },
  { name: 'white-noise-grain.png', fn: () => Math.random() },
  { name: 'value-noise-smooth.png', fn: (x, y) => {
    const xi = Math.floor(x * 10), yi = Math.floor(y * 10);
    const xf = fade(x * 10 - xi), yf = fade(y * 10 - yi);
    const v00 = P[(P[xi & 255] + yi) & 255] / 255;
    const v10 = P[(P[(xi+1) & 255] + yi) & 255] / 255;
    const v01 = P[(P[xi & 255] + yi+1) & 255] / 255;
    const v11 = P[(P[(xi+1) & 255] + yi+1) & 255] / 255;
    return lerp(yf, lerp(xf, v00, v10), lerp(xf, v01, v11));
  }},
  { name: 'plasma-wave-noise.png', fn: (x, y) => (Math.sin(x * 12) + Math.sin(y * 12) + Math.sin((x + y) * 12) + Math.sin(Math.sqrt(x*x + y*y) * 16)) / 8 + 0.5 },
  { name: 'caustic-light-noise.png', fn: (x, y) => {
    const v = voronoi2d(x * 8, y * 8, 'f1');
    const p = perlin2d(x * 12, y * 12) * 0.2;
    return Math.pow(Math.max(0, 1 - (v + p)), 2.5);
  }},
];

console.log(`Generating ${NOISE_PRESETS.length} procedural noise sprites...`);
const SIZE = 256;

for (const preset of NOISE_PRESETS) {
  const pixels = new Uint8Array(SIZE * SIZE);
  for (let py = 0; py < SIZE; py++) {
    for (let px = 0; px < SIZE; px++) {
      const u = px / SIZE;
      const v = py / SIZE;
      const raw = preset.fn(u, v);
      pixels[py * SIZE + px] = Math.min(255, Math.max(0, Math.round(raw * 255)));
    }
  }

  const pngBuf = encodeGrayscalePNG(SIZE, SIZE, pixels);
  const outPath = path.join(SPRITES_DIR, preset.name);
  writeFileSync(outPath, pngBuf);
  console.log(`  ✓ ${preset.name}`);
}

// Generate cover collage (512x512 with 4x4 grid of 128x128 tiles)
const COVER_SIZE = 512;
const coverPixels = new Uint8Array(COVER_SIZE * COVER_SIZE);
const cellSize = COVER_SIZE / 4;

NOISE_PRESETS.slice(0, 16).forEach((preset, idx) => {
  const gx = (idx % 4) * cellSize;
  const gy = Math.floor(idx / 4) * cellSize;

  for (let cy = 0; cy < cellSize; cy++) {
    for (let cx = 0; cx < cellSize; cx++) {
      const u = cx / cellSize;
      const v = cy / cellSize;
      // Border lines
      if (cx === 0 || cy === 0 || cx === cellSize - 1 || cy === cellSize - 1) {
        coverPixels[(gy + cy) * COVER_SIZE + (gx + cx)] = 60;
      } else {
        const val = Math.min(255, Math.max(0, Math.round(preset.fn(u, v) * 255)));
        coverPixels[(gy + cy) * COVER_SIZE + (gx + cx)] = val;
      }
    }
  }
});

writeFileSync(path.join(PACK_DIR, 'cover.png'), encodeGrayscalePNG(COVER_SIZE, COVER_SIZE, coverPixels));
console.log('  ✓ cover.png');

const packMeta = {
  name: "Procedural Noise Textures & Overlays",
  creator: "Modelibr (Public Domain)",
  website: "https://modelibr.com",
  license: "CC0",
  description: "Mathematical CC0 procedural noise sprites and textures: Perlin, Simplex, Voronoi/Cellular, FBM, Value noise, and Grain. Ideal for shaders, alpha masks, particle effects, and VFX overlays.",
  generation: {
    category: "Effects",
    subcategory: "Noise & Overlays"
  }
};

writeFileSync(path.join(PACK_DIR, 'pack.json'), JSON.stringify(packMeta, null, 2) + '\n');
console.log('  ✓ pack.json');
