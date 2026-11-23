import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assetsDir = join(root, 'assets');
mkdirSync(assetsDir, { recursive: true });

function crc32(buf) {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let i = 0; i < 8; i += 1) {
      c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, crc]);
}

function createPng(width, height, paint) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x += 1) {
      const [r, g, b, a = 255] = paint(x, y, width, height);
      const i = row + 1 + x * 4;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const GREEN = [24, 82, 50];
const GOLD = [204, 167, 48];
const THATCH = [79, 61, 0];
const THATCH_ENDS = [
  [58, 60],
  [102, 60],
  [36, 62],
  [124, 62],
  [80, 58],
];
const SAMPLES = 4;

function mix(from, to, amount) {
  return from.map((channel, index) => channel + (to[index] - channel) * amount);
}

function distanceToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

// The Joteku roof mark, in the same 160x80 design space as components/RoofMark.tsx.
// Returns the colour at a point, or null outside the mark.
function roofColour(u, v) {
  if ((u - 80) ** 2 + (v - 7) ** 2 <= 25) {
    return GOLD;
  }
  const t = (u - 6) / 148;
  if (t < 0 || t > 1) {
    return null;
  }
  const eaves = 64 - 20 * t * (1 - t);
  const slope = 8 + Math.abs(80 - u) * (56 / 74);
  if (v < slope || v > eaves) {
    return null;
  }
  if (eaves - v < 1.25) {
    return mix(GOLD, THATCH, 0.5);
  }
  if (THATCH_ENDS.some(([ex, ey]) => distanceToSegment(u, v, 80, 8, ex, ey) < 1)) {
    return mix(GOLD, THATCH, 0.4);
  }
  return GOLD;
}

// Paints the mark centred in the image, `markShare` of its width, over
// `background` (or transparent when null). Each pixel is sampled several times
// so the edges are smooth.
function markPainter(markShare, background) {
  return (x, y, width, height) => {
    const markWidth = width * markShare;
    const markHeight = markWidth / 2;
    const left = (width - markWidth) / 2;
    const top = (height - markHeight) / 2;
    let covered = 0;
    let sum = [0, 0, 0];
    for (let i = 0; i < SAMPLES; i += 1) {
      for (let j = 0; j < SAMPLES; j += 1) {
        const sx = x + (i + 0.5) / SAMPLES;
        const sy = y + (j + 0.5) / SAMPLES;
        const colour = roofColour(((sx - left) / markWidth) * 160, ((sy - top) / markHeight) * 80);
        if (colour) {
          covered += 1;
          sum = sum.map((channel, index) => channel + colour[index]);
        }
      }
    }
    const coverage = covered / (SAMPLES * SAMPLES);
    const markColour = covered > 0 ? sum.map((channel) => channel / covered) : GOLD;
    if (background) {
      return [...mix(background, markColour, coverage).map(Math.round), 255];
    }
    return [...markColour.map(Math.round), Math.round(coverage * 255)];
  };
}

writeFileSync(join(assetsDir, 'icon.png'), createPng(1024, 1024, markPainter(0.62, GREEN)));
// Android draws the adaptive icon over app.json's green, inside a safe circle.
writeFileSync(join(assetsDir, 'adaptive-icon.png'), createPng(1024, 1024, markPainter(0.5, null)));
// app.json shows this at imageWidth on the green launch background; the
// animated splash (components/AnimatedSplash.tsx) starts from the same spot.
writeFileSync(join(assetsDir, 'splash-icon.png'), createPng(512, 512, markPainter(1, null)));
writeFileSync(join(assetsDir, 'favicon.png'), createPng(48, 48, markPainter(0.8, GREEN)));
console.log('Wrote the Joteku roof mark assets to /assets');
