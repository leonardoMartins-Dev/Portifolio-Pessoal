/**
 * Baixa os recursos 3D da intro do Poly Haven (CC0):
 * - modelos, comprimidos (meshopt + texturas WebP) com o glTF Transform,
 *   rodado via npx — não é dependência do projeto → public/models/*.glb;
 * - fotos 360° (HDRI) de interior para a iluminação, reduzidas para
 *   512×256 aqui mesmo (RGBE puro, sem bibliotecas) → public/hdri/*.hdr.
 *
 * Uso: npm run models
 */
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const MODELS = [
  { id: 'wooden_table_02', textureSize: 1024 },
  { id: 'desk_lamp_arm_01', textureSize: 1024 },
  { id: 'potted_plant_02', textureSize: 1024 },
];
const OUT_DIR = 'public/models';
// Noite (tema escuro): sala com luz quente. Dia (tema claro): luz de janela.
const HDRIS = ['wooden_lounge', 'lebombo'];
const HDRI_DIR = 'public/hdri';
const HDRI_WIDTH = 512;

async function download(url, path) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ao baixar ${url}`);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, Buffer.from(await response.arrayBuffer()));
}

async function fetchModel({ id, textureSize }, workDir) {
  const files = await (await fetch(`https://api.polyhaven.com/files/${id}`)).json();
  const gltf = files.gltf['1k'].gltf;
  const source = join(workDir, id, `${id}.gltf`);
  await download(gltf.url, source);
  for (const [relative, file] of Object.entries(gltf.include ?? {})) {
    await download(file.url, join(workDir, id, relative));
  }
  const output = join(OUT_DIR, `${id}.glb`);
  execFileSync(
    'npx',
    [
      '--yes',
      '@gltf-transform/cli@4',
      'optimize',
      source,
      output,
      '--texture-compress',
      'webp',
      '--texture-size',
      String(textureSize),
      '--simplify-error',
      '0.0005',
    ],
    { stdio: 'inherit' },
  );
  const { size } = await stat(output);
  console.log(`${id}: ${(size / 1024).toFixed(0)} KB`);
}

/** Lê um .hdr (Radiance RGBE, com ou sem RLE) como floats RGB. */
function decodeHdr(buffer) {
  let offset = 0;
  const line = () => {
    const end = buffer.indexOf(0x0a, offset);
    const text = buffer.toString('latin1', offset, end);
    offset = end + 1;
    return text;
  };
  while (line() !== '');
  const [, height, , width] = line()
    .split(' ')
    .map((v) => (Number.isNaN(Number(v)) ? v : +v));
  const rgbe = new Uint8Array(width * height * 4);
  const scan = new Uint8Array(width * 4);
  for (let y = 0; y < height; y++) {
    if (buffer[offset] === 2 && buffer[offset + 1] === 2) {
      offset += 4;
      for (let c = 0; c < 4; c++) {
        let x = 0;
        while (x < width) {
          let count = buffer[offset++];
          if (count > 128) {
            count -= 128;
            const value = buffer[offset++];
            while (count--) scan[x++ * 4 + c] = value;
          } else {
            while (count--) scan[x++ * 4 + c] = buffer[offset++];
          }
        }
      }
    } else {
      scan.set(buffer.subarray(offset, offset + width * 4));
      offset += width * 4;
    }
    rgbe.set(scan, y * width * 4);
  }
  const rgb = new Float32Array(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    const e = rgbe[i * 4 + 3];
    const f = e ? 2 ** (e - 136) : 0;
    for (let c = 0; c < 3; c++) rgb[i * 3 + c] = rgbe[i * 4 + c] * f;
  }
  return { width, height, rgb };
}

/** Reduz por média de blocos e grava em RGBE sem compressão. */
function encodeHdr({ width, height, rgb }, targetWidth) {
  const factor = width / targetWidth;
  const w = targetWidth;
  const h = height / factor;
  const header = Buffer.from(`#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${h} +X ${w}\n`, 'latin1');
  const out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sum = [0, 0, 0];
      for (let dy = 0; dy < factor; dy++) {
        for (let dx = 0; dx < factor; dx++) {
          const i = ((y * factor + dy) * width + x * factor + dx) * 3;
          for (let c = 0; c < 3; c++) sum[c] += rgb[i + c];
        }
      }
      const [r, g, b] = sum.map((v) => v / (factor * factor));
      const max = Math.max(r, g, b);
      const o = (y * w + x) * 4;
      if (max < 1e-32) continue;
      const exponent = Math.ceil(Math.log2(max));
      const scale = 256 / 2 ** exponent;
      out[o] = Math.min(255, r * scale);
      out[o + 1] = Math.min(255, g * scale);
      out[o + 2] = Math.min(255, b * scale);
      out[o + 3] = exponent + 128;
    }
  }
  return Buffer.concat([header, Buffer.from(out)]);
}

async function fetchHdri(id) {
  const files = await (await fetch(`https://api.polyhaven.com/files/${id}`)).json();
  const response = await fetch(files.hdri['1k'].hdr.url);
  const source = decodeHdr(Buffer.from(await response.arrayBuffer()));
  const output = join(HDRI_DIR, `${id}.hdr`);
  await writeFile(output, encodeHdr(source, HDRI_WIDTH));
  const { size } = await stat(output);
  console.log(`${id}: ${(size / 1024).toFixed(0)} KB`);
}

const workDir = await mkdtemp(join(tmpdir(), 'portifolio-models-'));
try {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(HDRI_DIR, { recursive: true });
  for (const model of MODELS) await fetchModel(model, workDir);
  for (const id of HDRIS) await fetchHdri(id);
} finally {
  await rm(workDir, { recursive: true, force: true });
}
