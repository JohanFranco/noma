import * as THREE from 'three';

/** Texturas procedurales en canvas: sin descargas adicionales para la maqueta. */

function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function make(w: number, h: number, draw: (c: CanvasRenderingContext2D, r: () => number) => void, seed = 1, srgb = true) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, rng(seed));
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function speckle(c: CanvasRenderingContext2D, r: () => number, w: number, h: number, n: number, color: string, alpha: number, size = 2) {
  c.fillStyle = color;
  for (let i = 0; i < n; i++) {
    c.globalAlpha = r() * alpha;
    c.fillRect(r() * w, r() * h, r() * size + 0.5, r() * size + 0.5);
  }
  c.globalAlpha = 1;
}

/** Travertino en placas de 1.2 × 0.6 m con traslape a medio módulo (el canvas cubre 1.2 × 1.2 m). */
export const travertine = () =>
  make(512, 512, (c, r) => {
    c.fillStyle = '#d9d0c1';
    c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 80; i++) {
      c.globalAlpha = 0.05 + r() * 0.08;
      c.fillStyle = r() > 0.5 ? '#c8bba4' : '#e6dfd2';
      const y = r() * 512;
      c.fillRect(0, y, 512, 1 + r() * 5);
    }
    c.globalAlpha = 1;
    speckle(c, r, 512, 512, 2200, '#a89a83', 0.35, 2.5);
    c.strokeStyle = 'rgba(120,105,85,0.35)';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(0, 0.5); c.lineTo(512, 0.5);
    c.moveTo(0, 256); c.lineTo(512, 256);
    c.moveTo(0.5, 0); c.lineTo(0.5, 256);
    c.moveTo(256, 256); c.lineTo(256, 512);
    c.stroke();
  }, 3);

/** Nogal con veta vertical */
export const walnut = (seed = 7) =>
  make(256, 512, (c, r) => {
    c.fillStyle = '#5b4231';
    c.fillRect(0, 0, 256, 512);
    for (let x = 0; x < 256; x += 1) {
      c.globalAlpha = 0.08 + r() * 0.12;
      c.fillStyle = r() > 0.5 ? '#3f2c20' : '#7a5a42';
      c.fillRect(x, 0, 1 + (r() > 0.9 ? 2 : 0), 512);
    }
    c.globalAlpha = 0.2;
    for (let i = 0; i < 18; i++) {
      c.strokeStyle = '#2f2017';
      c.beginPath();
      const x0 = r() * 256;
      c.moveTo(x0, 0);
      for (let y = 0; y <= 512; y += 32) c.lineTo(x0 + Math.sin(y / 60 + i) * 6 * r(), y);
      c.stroke();
    }
    c.globalAlpha = 0.3;
    c.fillStyle = '#2a1c14';
    c.fillRect(0, 0, 2, 512);
    c.globalAlpha = 1;
  }, seed);

/** Roble claro */
export const oak = () =>
  make(256, 256, (c, r) => {
    c.fillStyle = '#b8996f';
    c.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y++) {
      c.globalAlpha = 0.05 + r() * 0.1;
      c.fillStyle = r() > 0.5 ? '#9a7c55' : '#d0b48c';
      c.fillRect(0, y, 256, 1);
    }
    c.globalAlpha = 1;
  }, 11);

/** Mármol blanco con vetas grises */
export const marble = () =>
  make(512, 512, (c, r) => {
    c.fillStyle = '#ece9e3';
    c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 14; i++) {
      c.strokeStyle = `rgba(${120 + r() * 40},${120 + r() * 40},${125 + r() * 40},${0.08 + r() * 0.22})`;
      c.lineWidth = 0.4 + r() * 1.3;
      c.beginPath();
      let x = r() * 512, y = 0;
      c.moveTo(x, y);
      while (y < 512) {
        x += (r() - 0.5) * 40;
        y += 10 + r() * 30;
        c.lineTo(x, y);
      }
      c.stroke();
    }
    speckle(c, r, 512, 512, 600, '#9b9a98', 0.2);
  }, 5);

/** Deck de ipe: duelas horizontales */
export const deck = () =>
  make(512, 512, (c, r) => {
    for (let i = 0; i < 8; i++) {
      const tone = 90 + r() * 25;
      c.fillStyle = `rgb(${tone + 20},${tone - 15},${tone - 40})`;
      c.fillRect(0, i * 64, 512, 62);
      for (let k = 0; k < 40; k++) {
        c.globalAlpha = 0.1;
        c.fillStyle = r() > 0.5 ? '#3d2717' : '#a37a55';
        c.fillRect(0, i * 64 + r() * 62, 512, 1);
      }
      c.globalAlpha = 1;
      c.fillStyle = '#20160f';
      c.fillRect(0, i * 64 + 62, 512, 2);
      c.fillRect(r() * 512, i * 64, 2, 62);
    }
  }, 13);

/** Lino / tela */
export const linen = (base = '#cfc7b8') =>
  make(128, 128, (c, r) => {
    c.fillStyle = base;
    c.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 128; i += 2) {
      c.globalAlpha = 0.06 + r() * 0.05;
      c.fillStyle = '#000';
      c.fillRect(0, i, 128, 1);
      c.fillRect(i, 0, 1, 128);
    }
    c.globalAlpha = 1;
  }, 17);

/** Fachadas: ventanas de día (color) y ventanas encendidas de noche (emisivo) */
export function facade(seed = 21) {
  const W = 256, H = 1024, cols = 16, rows = 64;
  const cw = W / cols, rh = H / rows;
  const lit: number[] = [];
  const r0 = rng(seed);
  for (let i = 0; i < cols * rows; i++) lit.push(r0());
  const color = make(W, H, (c) => {
    c.fillStyle = '#8a9399';
    c.fillRect(0, 0, W, H);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      c.fillStyle = lit[y * cols + x] > 0.5 ? '#46525c' : '#55626c';
      c.fillRect(x * cw + 2, y * rh + 3, cw - 4, rh - 6);
    }
  }, seed);
  const emissive = make(W, H, (c, r) => {
    c.fillStyle = '#000';
    c.fillRect(0, 0, W, H);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (lit[y * cols + x] < 0.74) continue;
      const warm = r() > 0.3;
      c.fillStyle = warm ? `rgb(255,${180 + r() * 50},${100 + r() * 60})` : 'rgb(185,210,255)';
      c.globalAlpha = 0.3 + r() * 0.6;
      c.fillRect(x * cw + 2, y * rh + 3, cw - 4, rh - 6);
    }
    c.globalAlpha = 1;
  }, seed + 1);
  return { color, emissive };
}

/** Obra abstracta para muros */
export const artwork = () =>
  make(512, 320, (c) => {
    c.fillStyle = '#d8d2c6';
    c.fillRect(0, 0, 512, 320);
    c.fillStyle = '#9b5a3c';
    c.beginPath(); c.arc(180, 170, 96, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#2d3a3f';
    c.fillRect(300, 40, 150, 240);
    c.strokeStyle = '#b0915f';
    c.lineWidth = 3;
    c.beginPath(); c.moveTo(40, 270); c.lineTo(470, 270); c.stroke();
  }, 1);
