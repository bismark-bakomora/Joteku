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

function inCircle(x, y, cx, cy, radius) {
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= radius * radius;
}

function iconPaint(x, y, width, height) {
  const cx = width / 2;
  const cy = height / 2;
  if (inCircle(x, y, cx, cy, width * 0.18)) {
    return [255, 255, 255, 255];
  }
  return [24, 82, 50, 255];
}

function splashPaint(x, y, width, height) {
  if (inCircle(x, y, width / 2, height / 2, width * 0.16)) {
    return [250, 247, 242, 255];
  }
  return [24, 82, 50, 0];
}

function aboutPaint(x, y, width, height) {
  if (y < height * 0.62) {
    const mix = y / (height * 0.62);
    return [
      Math.round(24 + (200 - 24) * mix * 0.2),
      Math.round(82 + (160 - 82) * mix * 0.15),
      Math.round(50 + (90 - 50) * mix * 0.1),
      255,
    ];
  }
  return [250, 247, 242, 255];
}

writeFileSync(join(assetsDir, 'icon.png'), createPng(1024, 1024, iconPaint));
writeFileSync(join(assetsDir, 'adaptive-icon.png'), createPng(1024, 1024, iconPaint));
writeFileSync(join(assetsDir, 'splash-icon.png'), createPng(512, 512, splashPaint));
writeFileSync(join(assetsDir, 'favicon.png'), createPng(48, 48, iconPaint));
writeFileSync(join(assetsDir, 'about-placeholder.png'), createPng(1200, 720, aboutPaint));
console.log('Wrote placeholder assets to /assets');
