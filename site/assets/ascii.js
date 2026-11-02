/* PDE: small real-time 3D scenes rendered as dense ASCII on <canvas>.
   Each frame is rendered at character resolution (2x2 samples per character) with a z-buffer:
   impostor spheres for curves and grids, flat triangles for sheets, Lambert + Blinn
   lighting and depth fog. Every character cell is then filled with its shaded colour and a glyph from a
   70-step density ramp is drawn on top, like a video-to-ASCII filter.
   Scenes (exact solutions computed, not drawn by hand):
   - hero:     vibrating square membrane, wave equation, two degenerate modes from separation of variables.
   - heat:     heat equation on a rod from its Fourier sine series: a block of heat smoothing out.
   - laplace:  a harmonic function over a disk, with a ring showing the mean value property.
   All three live in one backdrop canvas that moves with the page in whole character rows and cross-fades between them.
   Runs at up to 30 fps, pauses in a hidden tab, and under reduced motion draws still frames that only follow the scroll. */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const RAMP = " .'`^,:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
  const NR = RAMP.length;
  const SS = 2; // samples per character, per axis
  const OV = 4;  // spare character rows above and below the viewport
  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const stats = (window.__asciiStats = window.__asciiStats || {});
  const isDark = () => document.documentElement.dataset.theme === 'dark';

  // ---------- glyph atlas: alpha masks of every ramp character at the device cell size ----------
  const atlases = new Map();
  function atlas(cw, ch) {
    const key = `${cw}x${ch}`;
    if (atlases.has(key)) return atlases.get(key);
    const c = document.createElement('canvas'); c.width = cw * NR; c.height = ch;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `600 ${Math.round(ch * 0.9)}px ui-monospace, Menlo, Consolas, "DejaVu Sans Mono", "Liberation Mono", monospace`;
    for (let i = 0; i < NR; i++) g.fillText(RAMP[i], i * cw + cw / 2, ch * 0.54);
    const data = g.getImageData(0, 0, c.width, ch).data;
    const masks = new Uint8Array(NR * cw * ch);
    for (let i = 0; i < NR; i++) for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) masks[(i * ch + y) * cw + x] = data[(y * c.width + i * cw + x) * 4 + 3];
    const out = { masks, cw, ch }; atlases.set(key, out); return out;
  }

  // ---------- palettes: colour ramps per material, sampled into 256-entry LUTs ----------
  function lut(stops) {
    const t = new Uint8Array(256 * 3);
    for (let i = 0; i < 256; i++) {
      const s = i / 255; let k = 0;
      while (k < stops.length - 2 && s > stops[k + 1][0]) k++;
      const [s0, ...a] = stops[k]; const [s1, ...b] = stops[k + 1];
      const f = clamp((s - s0) / (s1 - s0 || 1));
      for (let j = 0; j < 3; j++) t[i * 3 + j] = Math.round(a[j] + (b[j] - a[j]) * f);
    }
    return t;
  }
  const PALETTES = {
    light: {
      bg: [250, 249, 245], dark: false, hi: [255, 250, 244], glow: [255, 214, 176],
      mats: {
        1: [[0, 92, 36, 20], [0.45, 169, 77, 49], [0.8, 224, 152, 116], [1, 246, 214, 190]], // accent: positive displacement, rims, highlights
        2: [[0, 40, 34, 30], [0.5, 98, 84, 74], [0.85, 168, 152, 138], [1, 224, 214, 202]],  // ink: the initial profile
        3: [[0, 120, 50, 30], [0.5, 190, 104, 74], [0.85, 232, 176, 146], [1, 250, 226, 208]], // grid lines and curves
        4: [[0, 150, 140, 130], [1, 214, 204, 192]],                                            // edges and the rod axis
        5: [[0, 226, 186, 164], [1, 246, 228, 214]],                                            // heat sheet
        6: [[0, 200, 190, 180], [1, 236, 230, 222]]                                             // spare sheet
      }
    },
    dark: {
      bg: [38, 35, 32], dark: true, hi: [255, 246, 236], glow: [255, 200, 160],
      mats: {
        1: [[0, 70, 32, 20], [0.45, 190, 96, 64], [0.8, 236, 162, 128], [1, 255, 226, 204]],
        2: [[0, 46, 42, 38], [0.5, 122, 110, 100], [0.85, 190, 178, 166], [1, 232, 222, 212]],
        3: [[0, 80, 40, 26], [0.5, 200, 112, 80], [0.85, 238, 178, 148], [1, 255, 230, 212]],
        4: [[0, 70, 64, 58], [1, 140, 130, 120]],
        5: [[0, 88, 52, 40], [1, 140, 88, 68]],
        6: [[0, 66, 60, 56], [1, 112, 104, 98]]
      }
    },
    cover: { // on the terracotta book cover; transparent background
      bg: [150, 64, 40], dark: true, hi: [255, 252, 246], glow: [255, 236, 200],
      mats: {
        1: [[0, 150, 96, 78], [0.5, 232, 214, 196], [1, 255, 250, 242]],   // magnet N half (light)
        2: [[0, 46, 20, 12], [0.5, 86, 40, 26], [1, 150, 92, 70]],        // magnet S half (dark)
        3: [[0, 104, 44, 26], [0.5, 214, 150, 116], [0.85, 246, 214, 188], [1, 255, 240, 226]] // copper coil
      }
    }
  };
  const lutCache = new Map();
  function paletteLUTs(name) {
    if (lutCache.has(name)) return lutCache.get(name);
    const p = PALETTES[name]; const luts = {};
    for (const id in p.mats) luts[id] = lut(p.mats[id]);
    const out = { ...p, luts }; lutCache.set(name, out); return out;
  }

  // ---------- renderer ----------
  const LV = (() => { const v = [-0.45, 0.68, -0.58]; const n = Math.hypot(...v); return v.map(x => x / n); })();
  const HV = (() => { const v = [LV[0], LV[1], LV[2] - 1]; const n = Math.hypot(...v); return v.map(x => x / n); })();

  class Renderer {
    constructor(canvas, opts) {
      this.canvas = canvas; this.opts = opts;
      this.ctx = canvas.getContext('2d', { alpha: true });
      this.P = { x: 0, y: 0, z: 0, sx: 0, sy: 0, k: 0 };
      this.gain = 1; this.cam = { yaw: 0, pitch: 0, dist: 5, tx: 0, ty: 0, tz: 0, F: 500, ox: 0, oy: 0 };
      this.yOff = 0; // canvas y (CSS px) of the viewport's top edge in the frame being drawn
    }
    // vw x vh is the viewport. The canvas is drawn at exact cell size (never stretched) and has OV spare rows
    // above and below it, so it can be moved by whole cells against the page without showing an edge.
    resize(vw, vh) {
      const small = vw < 700;
      const cw = small ? this.opts.cellMobile[0] : this.opts.cell[0];
      const ch = small ? this.opts.cellMobile[1] : this.opts.cell[1];
      this.cw = cw; this.ch = ch; this.viewRows = Math.max(4, Math.ceil(vh / ch));
      this.cols = Math.max(8, Math.ceil(vw / cw)); this.rows = this.viewRows + 2 * OV;
      let s = Math.min(window.devicePixelRatio || 1, 2);
      while (s > 1 && this.cols * cw * s * this.viewRows * ch * s > (small ? 0.9e6 : 1.6e6)) s -= 0.25;
      this.dw = Math.max(4, Math.round(cw * s)); this.dh = Math.max(6, Math.round(ch * s));
      this.canvas.width = this.cols * this.dw; this.canvas.height = this.rows * this.dh;
      this.canvas.style.width = `${this.cols * cw}px`; this.canvas.style.height = `${this.rows * ch}px`;
      this.cssW = vw; this.cssH = vh; this.sw = cw / SS; this.sh = ch / SS;
      this.W = this.cols * SS; this.H = this.rows * SS;
      const n = this.W * this.H;
      this.z = new Float32Array(n); this.shade = new Float32Array(n); this.spec = new Float32Array(n);
      this.emis = new Float32Array(n); this.depth = new Float32Array(n); this.mat = new Uint8Array(n);
      const m = this.cols * this.rows;
      this.cA = new Float32Array(m); this.cR = new Float32Array(m); this.cG = new Float32Array(m); this.cB = new Float32Array(m);
      this.halo = new Float32Array(m); this.tmp = new Float32Array(m); this.cellMask = new Float32Array(m).fill(1);
      this.img = this.ctx.createImageData(this.canvas.width, this.canvas.height);
      this.px = new Uint8ClampedArray(this.img.data.buffer);
      this.atlas = atlas(this.dw, this.dh);
      this.small = small;
    }
    camera(c) {
      Object.assign(this.cam, c);
      this.cam.oy += this.shiftY || 0;
      this.cy = Math.cos(this.cam.yaw); this.sy = Math.sin(this.cam.yaw);
      this.cp = Math.cos(this.cam.pitch); this.sp = Math.sin(this.cam.pitch);
    }
    clear() { this.z.fill(Infinity); this.mat.fill(0); }
    rot(x, y, z, o) { // world direction -> camera space
      const x1 = this.cy * x + this.sy * z; const z1 = -this.sy * x + this.cy * z;
      o[0] = x1; o[1] = this.cp * y - this.sp * z1; o[2] = this.sp * y + this.cp * z1; return o;
    }
    project(x, y, z, P = this.P) {
      const c = this.cam; x -= c.tx; y -= c.ty; z -= c.tz;
      const x1 = this.cy * x + this.sy * z; const z1 = -this.sy * x + this.cy * z;
      const y2 = this.cp * y - this.sp * z1; const z2 = this.sp * y + this.cp * z1 + c.dist;
      P.x = x1; P.y = y2; P.z = z2; P.k = c.F / z2;
      P.sx = (this.cssW / 2 + c.ox + x1 * P.k) / this.sw; P.sy = (this.cssH / 2 + c.oy + this.yOff - y2 * P.k) / this.sh;
      return P;
    }
    light(nx, ny, nz, i, mat, em, depth, zbuf) {
      const d = nx * LV[0] + ny * LV[1] + nz * LV[2];
      const lam = clamp((d + 0.3) / 1.3);
      const h = clamp(nx * HV[0] + ny * HV[1] + nz * HV[2]);
      const rim = Math.pow(clamp(1 + nz), 3) * 0.18; // nz is -1 facing the viewer
      this.z[i] = zbuf; this.depth[i] = depth; this.mat[i] = mat; this.emis[i] = em;
      this.shade[i] = (0.1 + 0.82 * lam + rim) * this.gain; const h2 = h * h; const h8 = h2 * h2 * h2 * h2;
      this.spec[i] = h8 * h8 * h8 * 0.85;
    }
    // Impostor sphere: exact sphere normals inside its projected ellipse.
    sphere(x, y, z, r, mat, em = 0, sign = 0) {
      const P = this.project(x, y, z); if (P.z < 0.1) return;
      const rc = r * P.k; const rx = Math.max(0.55, rc / this.sw); const ry = Math.max(0.55, rc / this.sh);
      const x0 = Math.max(0, Math.floor(P.sx - rx)); const x1 = Math.min(this.W - 1, Math.ceil(P.sx + rx));
      const y0 = Math.max(0, Math.floor(P.sy - ry)); const y1 = Math.min(this.H - 1, Math.ceil(P.sy + ry));
      const W = this.W; const zArr = this.z;
      for (let yy = y0; yy <= y1; yy++) {
        const v = (yy + 0.5 - P.sy) / ry; const v2 = v * v; if (v2 > 1) continue;
        for (let xx = x0; xx <= x1; xx++) {
          const u = (xx + 0.5 - P.sx) / rx; const d2 = u * u + v2; if (d2 > 1) continue;
          const nz = Math.sqrt(1 - d2); const dz = P.z - r * nz; const i = yy * W + xx;
          if (dz >= zArr[i]) continue;
          let e = em;
          if (sign && ((Math.abs(v) < 0.13 && Math.abs(u) < 0.5) || (sign > 0 && Math.abs(u) < 0.13 && Math.abs(v) < 0.5))) e = -1; // engraved + / -
          this.light(u, -v, -nz, i, mat, e, P.z, dz);
        }
      }
    }
    // Flat triangle with a camera-space normal (two-sided).
    tri(a, b, c, n, mat, em = 0, bias = 0, dither = false) {
      let [nx, ny, nz] = n; if (nz > 0) { nx = -nx; ny = -ny; nz = -nz; }
      const x0 = Math.max(0, Math.floor(Math.min(a.sx, b.sx, c.sx))); const x1 = Math.min(this.W - 1, Math.ceil(Math.max(a.sx, b.sx, c.sx)));
      const y0 = Math.max(0, Math.floor(Math.min(a.sy, b.sy, c.sy))); const y1 = Math.min(this.H - 1, Math.ceil(Math.max(a.sy, b.sy, c.sy)));
      const area = (b.sx - a.sx) * (c.sy - a.sy) - (b.sy - a.sy) * (c.sx - a.sx); if (Math.abs(area) < 1e-6) return;
      for (let yy = y0; yy <= y1; yy++) {
        const py = yy + 0.5;
        for (let xx = x0; xx <= x1; xx++) {
          if (dither && ((xx + yy) & 1)) continue; // 50% screen-door transparency
          const px = xx + 0.5;
          const w0 = ((b.sx - px) * (c.sy - py) - (b.sy - py) * (c.sx - px)) / area;
          const w1 = ((c.sx - px) * (a.sy - py) - (c.sy - py) * (a.sx - px)) / area;
          const w2 = 1 - w0 - w1; if (w0 < 0 || w1 < 0 || w2 < 0) continue;
          const dz = w0 * a.z + w1 * b.z + w2 * c.z + bias; const i = yy * this.W + xx;
          if (dz >= this.z[i]) continue;
          this.light(nx, ny, nz, i, mat, em, dz, dz);
        }
      }
    }
    quad(p0, p1, p2, p3, nWorld, mat, em, bias, dither) {
      const pr = p => { const P = this.project(p[0], p[1], p[2], {}); return P; };
      const a = pr(p0); const b = pr(p1); const c = pr(p2); const d = pr(p3);
      if (a.z < 0.1 || b.z < 0.1 || c.z < 0.1 || d.z < 0.1) return;
      const n = this.rot(nWorld[0], nWorld[1], nWorld[2], [0, 0, 0]);
      this.tri(a, b, c, n, mat, em, bias, dither); this.tri(a, c, d, n, mat, em, bias, dither);
    }
    begin() { this.cA.fill(0); this.cR.fill(0); this.cG.fill(0); this.cB.fill(0); }
    // Resolve the samples of the scene just drawn into character cells, weighted by w (scenes cross-fade).
    accumulate(palName, fog = [0, 1, 0], w = 1, guard = null) {
      const pal = paletteLUTs(palName); const { luts, hi, glow, bg } = pal;
      const { cols, rows, W } = this; const [f0, f1, fmax] = fog;
      const inv = 1 / (SS * SS);
      for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) {
        let r = 0; let g = 0; let b = 0; let n = 0;
        for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
          const i = (cy * SS + sy) * W + cx * SS + sx; const m = this.mat[i]; if (!m) continue;
          const L = luts[m] || luts[1]; let e = this.emis[i];
          let s = this.shade[i]; if (e < 0) { s *= 0.35; e = 0; }
          const li = Math.min(255, Math.max(0, (s * 255) | 0)) * 3;
          let cr = L[li]; let cg = L[li + 1]; let cb = L[li + 2];
          const sp = this.spec[i]; cr += (hi[0] - cr) * sp; cg += (hi[1] - cg) * sp; cb += (hi[2] - cb) * sp;
          if (e > 0) { const k = clamp(e); cr += (glow[0] - cr) * k; cg += (glow[1] - cg) * k; cb += (glow[2] - cb) * k; }
          const f = clamp((this.depth[i] - f0) / (f1 - f0)) * fmax;
          cr += (bg[0] - cr) * f; cg += (bg[1] - cg) * f; cb += (bg[2] - cb) * f;
          r += cr; g += cg; b += cb; n++;
        }
        if (!n) continue;
        // guard = [from, to, strength]: fade the art toward the right, where the RTL text column sits.
        const gx = guard && !this.small && !this.noGuard ? 1 - guard[2] * clamp((cx / cols - guard[0]) / (guard[1] - guard[0])) : 1;
        const k = cy * cols + cx; const a = n * inv * w * gx * this.cellMask[k];
        if (a <= 0) continue;
        this.cA[k] += a; this.cR[k] += (a * r) / n; this.cG[k] += (a * g) / n; this.cB[k] += (a * b) / n;
      }
    }
    // Write characters and pixels from the accumulated cells.
    paint(palName) {
      const pal = paletteLUTs(palName); const { bg } = pal; const { cols, rows } = this;
      for (let k = 0; k < cols * rows; k++) { const a = this.cA[k]; if (a > 0) { this.cR[k] /= a; this.cG[k] /= a; this.cB[k] /= a; if (a > 1) this.cA[k] = 1; } }
      // Soft halo around objects: two separable box blurs of coverage, used for faint background glyphs.
      const { cA, halo, tmp } = this; const R = 2;
      for (let y = 0; y < rows; y++) { let acc = 0; for (let x = -R; x < cols + R; x++) { if (x + R < cols) acc += cA[y * cols + x + R] || 0; if (x - R - 1 >= 0) acc -= cA[y * cols + x - R - 1]; if (x >= 0 && x < cols) tmp[y * cols + x] = acc / (2 * R + 1); } }
      for (let x = 0; x < cols; x++) { let acc = 0; for (let y = -R; y < rows + R; y++) { if (y + R < rows) acc += tmp[(y + R) * cols + x]; if (y - R - 1 >= 0) acc -= tmp[(y - R - 1) * cols + x]; if (y >= 0 && y < rows) halo[y * cols + x] = acc / (2 * R + 1); } }

      const { dw, dh } = this; const masks = this.atlas.masks; const px = this.px; const stride = this.canvas.width * 4;
      const bgL = (bg[0] * 0.3 + bg[1] * 0.59 + bg[2] * 0.11) / 255; const darkMode = pal.dark;
      for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) {
        const k = cy * cols + cx; const A = this.cA[k];
        let R0 = 0; let G0 = 0; let B0 = 0; let A0 = 0; let gr = 0; let gg = 0; let gb = 0; let ga = 0; let gi = 0;
        if (A > 0.001) {
          R0 = this.cR[k]; G0 = this.cG[k]; B0 = this.cB[k]; A0 = A;
          const lum = (R0 * 0.3 + G0 * 0.59 + B0 * 0.11) / 255;
          const dens = darkMode ? clamp((lum - bgL * 0.6) / (1 - bgL * 0.6)) : clamp((bgL - lum) / bgL * 1.25 + 0.08);
          gi = Math.round(Math.pow(dens, 0.8) * (NR - 1) * Math.min(1, A * 1.4));
          if (darkMode) { gr = R0 + (255 - R0) * 0.55; gg = G0 + (255 - G0) * 0.55; gb = B0 + (255 - B0) * 0.55; }
          else { gr = R0 * 0.5; gg = G0 * 0.5; gb = B0 * 0.5; }
          ga = Math.min(1, A * 1.3) * 0.95;
        } else {
          const hv = this.halo[k];
          if (hv > 0.015) {
            gi = hv > 0.12 ? 3 : hv > 0.05 ? 2 : 1; // only the faintest ramp marks: . ' `
            if (darkMode) { gr = 230; gg = 190; gb = 165; } else { gr = 169; gg = 90; gb = 60; }
            ga = Math.min(0.45, hv * 2.2);
          }
        }
        const base = (cy * dh) * stride + cx * dw * 4; const mo = gi * dw * dh;
        for (let y = 0; y < dh; y++) {
          let o = base + y * stride; const mrow = mo + y * dw;
          for (let x = 0; x < dw; x++, o += 4) {
            const m = gi ? (masks[mrow + x] / 255) * ga : 0;
            const oa = m + A0 * (1 - m);
            if (oa <= 0.002) { px[o + 3] = 0; continue; }
            const ca = A0 * (1 - m);
            px[o] = (gr * m + R0 * ca) / oa; px[o + 1] = (gg * m + G0 * ca) / oa; px[o + 2] = (gb * m + B0 * ca) / oa; px[o + 3] = oa * 255;
          }
        }
      }
      this.ctx.putImageData(this.img, 0, 0);
    }
  }

  // ---------- scene: vibrating square membrane (2D wave equation) ----------
  // u_tt = c^2 (u_xx + u_yy) on [0,1]^2 with u = 0 on the edge. Separation of variables gives the modes
  // sin(m pi x) sin(n pi y) cos(omega_mn t), omega_mn = c pi sqrt(m^2 + n^2). Modes (1,2) and (2,1) share a
  // frequency, so the sum below is again an exact solution, and its nodal line turns around the drum.
  function membraneScene() {
    const S = 1.7; const N = 15; const T = 7; const A = 0.8; const w = (2 * Math.PI) / T;
    const u = (x, y, t) => A * (Math.sin(Math.PI * x) * Math.sin(2 * Math.PI * y) * Math.cos(w * t)
      + Math.sin(2 * Math.PI * x) * Math.sin(Math.PI * y) * Math.sin(w * t));
    const RT = 0.03; const M = 120;
    return {
      fog: [4.2, 8.5, 0.55], stillT: 0.9, guard: [0.5, 0.7, 0.65],
      draw(R, t) {
        const H = R.slot && R.slot.hero;
        const cam = { yaw: 0.5 + t * 0.12, pitch: 0.34 + 0.05 * Math.sin(t * 0.09), dist: 6.2 };
        if (H) R.camera({ ...cam, F: H.F, ox: H.cx - R.cssW / 2, oy: H.cy - R.cssH / 2 }); else
        R.camera({ ...cam, F: R.small ? R.cssW * 1.15 : Math.min(R.cssH * 1.05, R.cssW * 0.66), ox: R.small ? 0.2 * R.cssW : -0.045 * R.cssW, oy: R.small ? 0.04 * R.cssH : -0.02 * R.cssH });
        R.clear();
        // Grid lines of the drumhead, x = const and y = const; displacement is world y.
        for (let a = 0; a < N; a++) {
          const s = a / (N - 1);
          for (let j = 0; j <= M; j++) {
            const r = j / M;
            for (let dir = 0; dir < 2; dir++) {
              const x = dir ? s : r; const y = dir ? r : s; const v = u(x, y, t);
              const edge = a === 0 || a === N - 1;
              const em = edge ? 0 : Math.pow(Math.min(1, Math.abs(v) / A), 3) * 0.55;
              R.sphere((x - 0.5) * 2 * S, v, (y - 0.5) * 2 * S, edge ? RT * 1.6 : RT, edge ? 4 : v >= 0 ? 1 : 3, em);
            }
          }
        }
      }
    };
  }

  // ---------- scene: heat equation on a rod ----------
  // u_t = k u_xx on 0 < x < L, u(0,t) = u(L,t) = 0, u(x,0) = 1 on the middle half of the rod, 0 elsewhere.
  // Fourier sine series: u = sum b_n exp(-k (n pi / L)^2 t) sin(n pi x / L), b_n = (2 / n pi)(cos(n pi/4) - cos(3 n pi/4)).
  // The initial block stays drawn in ink; the lit sheet is the profile now, which smooths and sinks toward 0,
  // then the rod is heated again (t runs as phase^2 so the fast early smoothing gets more frames).
  function heatScene() {
    const NT = 61; const L = 1; const k = 1; const tEnd = 0.12; const A = 2.3; const T = 7;
    const b = Array.from({ length: NT }, (_, i) => { const n = i + 1; return (2 / (n * Math.PI)) * (Math.cos(n * Math.PI / 4) - Math.cos(3 * n * Math.PI / 4)); });
    const u = (x, s) => { let v = 0; for (let i = 0; i < NT; i++) { const n = i + 1; const q = n * Math.PI / L; v += b[i] * Math.exp(-k * q * q * s) * Math.sin(q * x); } return v; };
    const NX = 200;
    const curve = s => { const c = new Float32Array(NX + 1); for (let i = 0; i <= NX; i++) c[i] = u((i / NX) * L, s); return c; };
    const init = Float32Array.from({ length: NX + 1 }, (_, i) => (i / NX > 0.25 && i / NX < 0.75 ? 1 : 0));
    return {
      fog: [9, 22, 0.6], stillT: 1.6, guard: [0.45, 0.8, 0.55],
      draw(R, t) {
        const narrow = R.cssW < 700;
        const S = R.slot && R.slot.heat;
        if (S) R.camera({ yaw: -0.5, pitch: 0.32, dist: 15, F: S.F, ox: S.cx - R.cssW / 2, oy: S.cy - R.cssH / 2 }); else
        R.camera({ yaw: -0.5, pitch: 0.3, dist: 13.5, F: Math.min(R.cssW * (narrow ? 1.6 : 0.78), R.cssH * 2.2), ox: 0, oy: 0 });
        R.clear();
        const X = (S && S.X) || 6;
        const wx = i => -X + (2 * X * i) / NX; const y0 = -A * 0.45;
        const f = ((t / T) % 1 + 1) % 1; const c = curve(tEnd * f * f);
        for (let i = 0; i <= NX; i++) {
          R.sphere(wx(i), y0, 0, 0.06, 4);                    // the rod
          R.sphere(wx(i), y0 + A * init[i], 0, 0.035, 2);     // u(x, 0)
          R.sphere(wx(i), y0 + A * c[i], 0, 0.07, 1, 0.1);    // u(x, t)
        }
        // The profile now as a lit sheet down to the rod, with dark stripes every few cells.
        for (let i = 0; i < NX; i++) {
          const stripe = i % 10 === 0 ? -1 : 0; const ya = A * c[i]; const yb = A * c[i + 1];
          for (let j = 0; j < 3; j++) {
            const u0 = j / 3; const u1 = (j + 1) / 3; R.gain = 0.72 + 0.22 * j + 0.12 * Math.abs(c[i]);
            R.quad([wx(i), y0 + ya * u0, 0], [wx(i + 1), y0 + yb * u0, 0], [wx(i + 1), y0 + yb * u1, 0], [wx(i), y0 + ya * u1, 0], [0, 0, 1], 5, stripe, 0.02);
          }
          R.gain = 1;
        }
      }
    };
  }

  // ---------- scene: a harmonic function on a disk and the mean value property ----------
  // u = 0.22 r^2 cos 2theta + 0.1 r^3 cos 3theta = 0.22 (x^2 - y^2) + 0.1 (x^3 - 3 x y^2) solves u_xx + u_yy = 0.
  // A ring of radius rho around the point p0 glows with u on its edge; the bead above p0 sits at u(p0),
  // which is exactly the average of u over the ring, whatever rho is.
  function laplaceScene() {
    const Rd = 1.25; const T = 8;
    const u = (x, y) => 0.22 * (x * x - y * y) + 0.1 * (x * x * x - 3 * x * y * y);
    const p0 = [0.3, -0.2];
    const NR = 7; const NA = 16; const M = 140;
    return {
      fog: [5.5, 9, 0.35], stillT: 2.5, guard: [0.5, 0.75, 0.6],
      draw(R, t) {
        const S = R.slot && R.slot.laplace;
        const cam = { yaw: 0.55 + t * 0.1, pitch: 0.5, dist: 6.6 };
        if (S) R.camera({ ...cam, F: S.F, ox: S.cx - R.cssW / 2, oy: S.cy - R.cssH / 2 }); else
        R.camera({ ...cam, F: Math.min(R.cssW, R.cssH) * (R.small ? 1.4 : 0.85), ox: R.small ? 0 : -0.04 * R.cssW, oy: R.cssH * 0.3 });
        R.clear();
        const P = (x, y, mat, r = 0.022, em = 0) => R.sphere(x, u(x, y), y, r, mat, em);
        for (let i = 1; i <= NR; i++) {
          const r = (Rd * i) / NR; const n = Math.round(M * r / Rd) + 24;
          for (let j = 0; j < n; j++) { const a = (2 * Math.PI * j) / n; P(r * Math.cos(a), r * Math.sin(a), i === NR ? 1 : 3, i === NR ? 0.036 : 0.022); }
        }
        for (let j = 0; j < NA; j++) {
          const a = (2 * Math.PI * j) / NA;
          for (let i = 1; i < 60; i++) { const r = (Rd * i) / 60; P(r * Math.cos(a), r * Math.sin(a), 3); }
        }
        const rho = 0.25 + 0.55 * (0.5 - 0.5 * Math.cos((2 * Math.PI * t) / T)); // p0 + ring stays inside the disk
        for (let j = 0; j < 120; j++) { const a = (2 * Math.PI * j) / 120; P(p0[0] + rho * Math.cos(a), p0[1] + rho * Math.sin(a), 1, 0.05, 0.7); }
        R.sphere(p0[0], u(p0[0], p0[1]), p0[1], 0.09, 1, 0.9);
      }
    };
  }

  // ---------- keeping the art off the text ----------
  const VARIANT = 'a';
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const TEXT_SEL = ['.hero-copy', '.course .section-intro', '.trick-grid > [data-reveal]', '.site-footer'];
  function textRects() {
    const out = [];
    for (const sel of TEXT_SEL) for (const el of document.querySelectorAll(sel)) {
      const r = el.getBoundingClientRect(); if (r.bottom < -200 || r.top > innerHeight + 200 || !r.width) continue;
      out.push(r);
    }
    return out;
  }
  // Paper fade from the nav's bottom edge (hb - 10 -> hb + 90, smoothstep) on the fixed .ascii-fade layer; off when hb < 0.
  let headY = null;
  function headFade(hb) {
    if (hb === headY) return; headY = hb;
    const f = document.querySelector('.ascii-fade'); if (f) f.style.setProperty('--head', `${hb}px`);
  }
  // Multiply every cell by a soft factor: 1 = full art, 0 = no art.
  function buildMask(R) {
    const M = R.cellMask; const { cols, rows } = R; M.fill(1); R.slot = null; R.noGuard = false;
    if (R.small) headFade(-1000);
    // Cell (cx, cy) is centred at viewport x = (cx + .5) cw, y = (cy + .5) ch - yOff.
    const { cw, ch } = R; const yo = R.yOff;
    const rects = textRects();
    if (VARIANT === 'a' && !R.small) {
      // Desktop: the art lives left of the RTL text column and is gone well before the first letter.
      let L = Infinity; for (const r of rects) if (r.bottom > 0 && r.top < innerHeight && r.width < innerWidth * 0.8) L = Math.min(L, r.left);
      if (!isFinite(L)) L = innerWidth * 0.5;
      R.noGuard = true;
      const rc = sel => { const el = document.querySelector(sel); return el ? el.getBoundingClientRect() : null; };
      const card = rc('.hero .video'); const intro = rc('.course .section-intro'); const grow = rc('.trick-grid .grow');
      const lw = L - 60; // usable width left of the text
      R.slot = {
        // membrane: the drumhead spreads behind the hero video, its edges showing around it
        hero: card ? { cx: card.left + card.width / 2, cy: card.top + card.height / 2 + 10, F: card.width * 2.2 } : null,
        // heat: the rod runs into the depth across the empty left half, level with the heading
        heat: intro ? { cx: lw * 0.5, cy: intro.top + intro.height * 0.45, F: Math.min(lw * 1.8, innerHeight * 1.5), X: 4.6 } : null,
        // disk: hovers in the open space above the equation card
        laplace: grow ? { cx: grow.left + grow.width / 2, cy: grow.top - 92, F: Math.min(grow.width * 1.15, 560) } : null
      };
      const a = L - 300; const b = L - 40;
      const col = new Float32Array(cols); for (let cx = 0; cx < cols; cx++) col[cx] = 1 - sstep(a, b, (cx + 0.5) * cw);
      // and fades out above the footer instead of running into it.
      const foot = document.querySelector('.site-footer'); const ft = foot ? foot.getBoundingClientRect().top : Infinity;
      // It also clears the nav, but the nav stays put while the art moves, so that fade is painted by .ascii-fade.
      const head = document.querySelector('.site-header'); headFade(head ? Math.max(0, head.getBoundingClientRect().bottom) : 0);
      for (let cy = 0; cy < rows; cy++) {
        const y = (cy + 0.5) * ch - yo; const fr = 1 - sstep(ft - 170, ft - 20, y);
        for (let cx = 0; cx < cols; cx++) M[cy * cols + cx] = col[cx] * fr;
      }
      return;
    }
    // Feathered holes around each text block (variant B everywhere, variant A on narrow screens).
    const strength = VARIANT === 'a' ? 0.92 : 0.9; const pad = R.small ? 10 : 22; const feather = R.small ? 70 : 110;
    for (const r of rects) {
      const x0 = r.left - pad; const x1 = r.right + pad; const y0 = r.top - pad; const y1 = r.bottom + pad;
      const cx0 = Math.max(0, Math.floor((x0 - feather) / cw)); const cx1 = Math.min(cols - 1, Math.ceil((x1 + feather) / cw));
      const cy0 = Math.max(0, Math.floor((y0 - feather + yo) / ch)); const cy1 = Math.min(rows - 1, Math.ceil((y1 + feather + yo) / ch));
      for (let cy = cy0; cy <= cy1; cy++) {
        const y = (cy + 0.5) * ch - yo; const dy = Math.max(y0 - y, 0, y - y1);
        for (let cx = cx0; cx <= cx1; cx++) {
          const x = (cx + 0.5) * cw; const dx = Math.max(x0 - x, 0, x - x1);
          const d = Math.hypot(dx, dy); const m = 1 - strength * (1 - sstep(0, feather, d));
          const k = cy * cols + cx; if (m < M[k]) M[k] = m;
        }
      }
    }
  }

  // ---------- one continuous backdrop that moves with the page ----------
  // Membrane (hero) -> heat flow (course) -> harmonic disk (methods), cross-fading as the page scrolls.
  // Steady scrolling: every scroll-driven offset is snapped to whole character rows, and the canvas itself is
  // moved by the remainder, so the character grid travels rigidly and no glyph is re-sampled because of scroll.
  // - Desktop: the scenes are pinned to page elements, so the canvas lives in the page (absolute, inside body)
  //   at a whole-row page offset. Between redraws the browser scrolls it natively, in lockstep with the text.
  // - Mobile: the scenes drift at a slower parallax rate, so the canvas is fixed and is translated every
  //   display frame by the sub-row part of that drift.
  // All scroll reads, redraws and moves happen in one requestAnimationFrame tick; nothing runs in a scroll handler
  // except, under reduced motion, a request for that tick.
  function backdrop(canvas) {
    const wrap = canvas.parentElement;
    const fade = document.querySelector('.ascii-fade');
    const view = () => (fade && fade.clientWidth ? [fade.clientWidth, fade.clientHeight] : [document.documentElement.clientWidth, innerHeight]);
    const R = new Renderer(canvas, { cell: [7, 10], cellMobile: [6, 9] });
    const scenes = [membraneScene(), heatScene(), laplaceScene()];
    const st = (stats.backdrop = { frames: 0, renderMs: 0, start: performance.now() });
    const anchorSel = ['.hero', '.course .section-intro', '.trick-section'];
    let anchors = []; let wrapTop = 0;
    const measure = () => {
      anchors = anchorSel.map(sel => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return r.top + scrollY + r.height / 2; });
      if (anchors.some(a => a === null)) anchors = [0, innerHeight, innerHeight * 2];
      wrapTop = R.small ? 0 : wrap.getBoundingClientRect().top + scrollY;
    };
    const resize = () => { R.resize(...view()); wrap.classList.toggle('is-fixed', R.small); measure(); };
    const smooth = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
    // Layers for scroll position s. P is the common parallax drift: layer j sits at oy = j * slide - P.
    const layers = s => {
      const c = s + innerHeight / 2; const slide = innerHeight * 0.45; const n = anchors.length;
      if (c <= anchors[0]) return { P: 0, list: [{ i: 0, w: 1 }] };
      for (let i = 0; i < n - 1; i++) {
        if (c <= anchors[i + 1]) {
          const f = (c - anchors[i]) / (anchors[i + 1] - anchors[i]); const w = smooth(0.3, 0.7, f);
          return { P: (i + f) * slide, list: [{ i, w: 1 - w }, { i: i + 1, w }].filter(l => l.w > 0.01) };
        }
      }
      return { P: (n - 1) * slide + Math.min(innerHeight * 0.35, (c - anchors[n - 1]) * 0.45), list: [{ i: n - 1, w: 1 }] };
    };
    const pal = () => (isDark() ? 'dark' : 'light');
    const t0 = performance.now();
    const clock = () => (typeof window.__asciiT === 'number' ? window.__asciiT : (performance.now() - t0) / 1000); // __asciiT: test hook, freezes the animation
    const slide = () => innerHeight * 0.45;
    let Gs = 0; let ty = NaN; let drawn = false;
    const dpr = () => window.devicePixelRatio || 1;
    // Grid offset G: the content offset the grid follows. Desktop: the scroll position. Mobile: the parallax drift.
    const place = G => {
      const v = R.small ? Gs - G - OV * R.ch : Gs - OV * R.ch - wrapTop;
      const y = Math.round(v * dpr()) / dpr();
      if (y !== ty) { ty = y; canvas.style.transform = `translate3d(0, ${y}px, 0)`; }
    };
    const draw = (t, s, L) => {
      const a = performance.now(); const p = pal();
      const G = R.small ? L.P : s;
      Gs = Math.floor(G / R.ch) * R.ch; R.yOff = OV * R.ch + (G - Gs);
      R.begin(); buildMask(R);
      for (const l of L.list) {
        const sc = scenes[l.i]; R.shiftY = R.slot ? 0 : l.i * slide() - L.P;
        sc.draw(R, reduce ? sc.stillT : t); R.accumulate(p, sc.fog, l.w, sc.guard);
      }
      R.shiftY = 0; R.paint(p); place(G); drawn = true;
      st.renderMs += performance.now() - a; st.frames++;
    };
    // One tick per display frame: redraw at 30 fps (or when the grid would run out of spare rows), otherwise
    // just keep the canvas where it belongs.
    let last = -1e9;
    const tick = (now, force) => {
      const s = scrollY; const L = layers(s); const G = R.small ? L.P : s; const d = G - Gs;
      const lim = (OV - 1) * R.ch;
      const due = force || !drawn || d < -lim || d > lim || (reduce ? Math.floor(G / R.ch) * R.ch !== Gs : now - last >= 1000 / 30 - 2);
      if (due) { last = now; draw(clock(), s, L); } else if (R.small) place(G);
    };
    let raf = 0; let queued = false;
    const loop = now => { raf = 0; if (document.hidden) return; raf = requestAnimationFrame(loop); tick(now, false); };
    const kick = () => { if (!reduce && !raf && !document.hidden) raf = requestAnimationFrame(loop); };
    const request = force => { if (!reduce) { if (force) tick(performance.now(), true); return; } if (queued) return; queued = true; requestAnimationFrame(now => { queued = false; tick(now, force); }); };
    resize(); tick(performance.now(), true);
    if (fade && window.ResizeObserver) new ResizeObserver(() => { resize(); tick(performance.now(), true); }).observe(fade);
    else addEventListener('resize', () => { resize(); tick(performance.now(), true); });
    new ResizeObserver(() => { measure(); request(true); }).observe(document.body);
    new MutationObserver(() => tick(performance.now(), true)).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    if (reduce) addEventListener('scroll', () => request(false), { passive: true });
    document.addEventListener('visibilitychange', kick);
    kick();
  }

  const canvas = document.querySelector('canvas[data-ascii3d="backdrop"]');
  if (canvas) { try { backdrop(canvas); } catch (error) { canvas.hidden = true; } }
})();
