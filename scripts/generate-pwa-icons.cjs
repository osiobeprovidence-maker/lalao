const fs = require('fs');
const zlib = require('zlib');

// CRC32 table
const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ -1) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = data.length;
  const chunk = Buffer.alloc(8 + len + 4);
  chunk.writeUInt32BE(len, 0);
  typeBuf.copy(chunk, 4);
  data.copy(chunk, 8);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function makePng(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    scanlines[rowOffset] = 0;
    rgbaBuffer.copy(scanlines, rowOffset + 1, y * width * 4, (y + 1) * width * 4);
  }
  
  const compressed = zlib.deflateSync(scanlines, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function decodePng(filePath) {
  const b = fs.readFileSync(filePath);
  let p = 8;
  const idats = [];
  let w = 0, h = 0;
  while(p < b.length) {
    const len = b.readUInt32BE(p);
    const type = b.toString('ascii', p+4, p+8);
    if (type === 'IHDR') {
      w = b.readUInt32BE(p+8);
      h = b.readUInt32BE(p+12);
    } else if (type === 'IDAT') {
      idats.push(b.subarray(p+8, p+8+len));
    }
    p += 8 + len + 4;
  }
  const raw = zlib.inflateSync(Buffer.concat(idats));
  const rowBytes = 1 + w * 4;
  const rgba = Buffer.alloc(w * h * 4);
  let prevRow = new Uint8Array(w * 4);
  
  for (let y = 0; y < h; y++) {
    const filter = raw[y * rowBytes];
    const row = raw.subarray(y * rowBytes + 1, (y + 1) * rowBytes);
    const recon = new Uint8Array(w * 4);
    for (let x = 0; x < w * 4; x++) {
      const a = x >= 4 ? recon[x - 4] : 0;
      const b = prevRow[x];
      const c = x >= 4 ? prevRow[x - 4] : 0;
      let val = row[x];
      if (filter === 1) val = (val + a) & 0xff;
      else if (filter === 2) val = (val + b) & 0xff;
      else if (filter === 3) val = (val + Math.floor((a + b) / 2)) & 0xff;
      else if (filter === 4) {
        const pr = a + b - c;
        const pa = Math.abs(pr - a);
        const pb = Math.abs(pr - b);
        const pc = Math.abs(pr - c);
        const pred = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
        val = (val + pred) & 0xff;
      }
      recon[x] = val;
    }
    prevRow.set(recon);
    rgba.set(recon, y * w * 4);
  }
  return { width: w, height: h, rgba };
}

function resize(src, targetW, targetH) {
  const out = Buffer.alloc(targetW * targetH * 4);
  const xRatio = src.width / targetW;
  const yRatio = src.height / targetH;
  
  for (let y = 0; y < targetH; y++) {
    for (let x = 0; x < targetW; x++) {
      const gx = (x + 0.5) * xRatio - 0.5;
      const gy = (y + 0.5) * yRatio - 0.5;
      const gxi = Math.floor(gx);
      const gyi = Math.floor(gy);
      const fx = gx - gxi;
      const fy = gy - gyi;
      
      let r = 0, g = 0, b = 0, a = 0;
      for (let dy = 0; dy <= 1; dy++) {
        for (let dx = 0; dx <= 1; dx++) {
          const px = Math.min(Math.max(gxi + dx, 0), src.width - 1);
          const py = Math.min(Math.max(gyi + dy, 0), src.height - 1);
          const pIdx = (py * src.width + px) * 4;
          const weight = (dx === 0 ? (1 - fx) : fx) * (dy === 0 ? (1 - fy) : fy);
          
          r += src.rgba[pIdx] * weight;
          g += src.rgba[pIdx + 1] * weight;
          b += src.rgba[pIdx + 2] * weight;
          a += src.rgba[pIdx + 3] * weight;
        }
      }
      
      const outIdx = (y * targetW + x) * 4;
      out[outIdx] = Math.round(r);
      out[outIdx + 1] = Math.round(g);
      out[outIdx + 2] = Math.round(b);
      out[outIdx + 3] = Math.round(a);
    }
  }
  return out;
}

function solidifyBackground(src, bgR, bgG, bgB) {
  const out = Buffer.alloc(src.width * src.height * 4);
  for (let i = 0; i < src.width * src.height; i++) {
    const idx = i * 4;
    const a = src.rgba[idx + 3] / 255;
    out[idx] = Math.round(src.rgba[idx] * a + bgR * (1 - a));
    out[idx + 1] = Math.round(src.rgba[idx + 1] * a + bgG * (1 - a));
    out[idx + 2] = Math.round(src.rgba[idx + 2] * a + bgB * (1 - a));
    out[idx + 3] = 255;
  }
  return { width: src.width, height: src.height, rgba: out };
}

function makeMaskable(solidSrc, targetW, targetH, bgR, bgG, bgB) {
  const out = Buffer.alloc(targetW * targetH * 4);
  for (let i = 0; i < targetW * targetH; i++) {
    out[i * 4] = bgR;
    out[i * 4 + 1] = bgG;
    out[i * 4 + 2] = bgB;
    out[i * 4 + 3] = 255;
  }
  
  const innerSize = Math.round(targetW * 0.78);
  const innerRgba = resize(solidSrc, innerSize, innerSize);
  
  const startX = Math.round((targetW - innerSize) / 2);
  const startY = Math.round((targetH - innerSize) / 2);
  
  for (let y = 0; y < innerSize; y++) {
    for (let x = 0; x < innerSize; x++) {
      const srcIdx = (y * innerSize + x) * 4;
      const destIdx = ((startY + y) * targetW + (startX + x)) * 4;
      out[destIdx] = innerRgba[srcIdx];
      out[destIdx + 1] = innerRgba[srcIdx + 1];
      out[destIdx + 2] = innerRgba[srcIdx + 2];
      out[destIdx + 3] = 255;
    }
  }
  return out;
}

function createIco(pngBuffersWithSize) {
  // ICO header: 6 bytes
  const count = pngBuffersWithSize.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(count, 4);

  let offset = 6 + count * 16;
  const dirEntries = [];
  const imageBuffers = [];

  for (const { size, buffer } of pngBuffersWithSize) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 = 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height (0 = 256)
    entry.writeUInt8(0, 2); // color palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buffer.length, 8); // size of image in bytes
    entry.writeUInt32LE(offset, 12); // offset

    dirEntries.push(entry);
    imageBuffers.push(buffer);
    offset += buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...imageBuffers]);
}

console.log('Loading app-icon.png...');
const source = decodePng('public/app-icon.png');
console.log('Source loaded:', source.width, 'x', source.height);

const solidSource = solidifyBackground(source, 217, 229, 255);

// 1. icon-512.png (any)
const icon512Rgba = resize(source, 512, 512);
const icon512Png = makePng(512, 512, icon512Rgba);
fs.writeFileSync('public/icon-512.png', icon512Png);

// 2. icon-192.png (any)
const icon192Rgba = resize(source, 192, 192);
const icon192Png = makePng(192, 192, icon192Rgba);
fs.writeFileSync('public/icon-192.png', icon192Png);

// 3. icon-maskable-512.png (maskable)
const maskable512Rgba = makeMaskable(solidSource, 512, 512, 217, 229, 255);
fs.writeFileSync('public/icon-maskable-512.png', makePng(512, 512, maskable512Rgba));

// 4. icon-maskable-192.png (maskable)
const maskable192Rgba = makeMaskable(solidSource, 192, 192, 217, 229, 255);
fs.writeFileSync('public/icon-maskable-192.png', makePng(192, 192, maskable192Rgba));

// 5. favicon.png (64x64)
const faviconRgba = resize(source, 64, 64);
const faviconPng = makePng(64, 64, faviconRgba);
fs.writeFileSync('public/favicon.png', faviconPng);

// 6. favicon-32x32.png
const favicon32Rgba = resize(source, 32, 32);
const favicon32Png = makePng(32, 32, favicon32Rgba);
fs.writeFileSync('public/favicon-32x32.png', favicon32Png);

// 7. favicon-16x16.png
const favicon16Rgba = resize(source, 16, 16);
const favicon16Png = makePng(16, 16, favicon16Rgba);
fs.writeFileSync('public/favicon-16x16.png', favicon16Png);

// 8. apple-touch-icon.png (180x180)
const appleTouchRgba = resize(source, 180, 180);
fs.writeFileSync('public/apple-touch-icon.png', makePng(180, 180, appleTouchRgba));

// 9. Generate multi-resolution favicon.ico containing 16, 32, 48, 64, 128, 256
const icoPngs = [
  { size: 16, buffer: favicon16Png },
  { size: 32, buffer: favicon32Png },
  { size: 48, buffer: makePng(48, 48, resize(source, 48, 48)) },
  { size: 64, buffer: faviconPng },
  { size: 128, buffer: makePng(128, 128, resize(source, 128, 128)) },
  { size: 256, buffer: makePng(256, 256, resize(source, 256, 256)) },
];
const icoBuf = createIco(icoPngs);
fs.writeFileSync('public/favicon.ico', icoBuf);
console.log('Written public/favicon.ico (' + icoBuf.length + ' bytes)');

console.log('All icons successfully generated including favicon.ico!');
