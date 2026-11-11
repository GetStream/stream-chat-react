/**
 * 3-D simplex noise, a port of the shader's `snoise` (Ashima Arts / Stefan Gustavson), so the
 * renderers drawn on the CPU move with the same speech rhythm as the shader and as iOS.
 *
 * It runs in float32 like a GPU, with `mod` as a multiply by a float32 reciprocal, because the
 * hash is sensitive to rounding: in exact arithmetic some inputs hash to a neighbouring gradient.
 */

const f = Math.fround;

const INV_289 = f(1 / 289);
const ONE_THIRD = f(1 / 3);
const ONE_SIXTH = f(1 / 6);
const NS_X = f(2 / 7);
const NS_Y = f(f(0.5 * f(1 / 7)) - 1);
const NS_Z = f(1 / 7);

const mod289 = (x: number) => f(x - f(289 * Math.floor(f(x * INV_289))));
const permute = (x: number) => mod289(f(f(f(x * 34) + 1) * x));
const taylorInvSqrt = (r: number) => f(1.79284291400159 - f(0.85373472095314 * r));

/** A corner's gradient from its hash, as the shader's x_/y_/h/sh steps compute it. */
const gradient = (p: number, out: number[]) => {
  const j = f(p - f(49 * Math.floor(f(f(p * NS_Z) * NS_Z))));
  const xi = Math.floor(f(j * NS_Z));
  const yi = Math.floor(f(j - f(7 * xi)));
  const x = f(f(xi * NS_X) + NS_Y);
  const y = f(f(yi * NS_X) + NS_Y);
  const h = f(f(1 - Math.abs(x)) - Math.abs(y));
  const sh = h <= 0 ? -1 : 0;
  out[0] = f(x + f((Math.floor(x) * 2 + 1) * sh));
  out[1] = f(y + f((Math.floor(y) * 2 + 1) * sh));
  out[2] = h;
};

const corner = (g: number[], x: number, y: number, z: number) => {
  const norm = taylorInvSqrt(g[0] * g[0] + g[1] * g[1] + g[2] * g[2]);
  const m = Math.max(0.6 - (x * x + y * y + z * z), 0);
  return m * m * m * m * (g[0] * norm * x + g[1] * norm * y + g[2] * norm * z);
};

const g = [0, 0, 0];

/** Simplex noise at (x, y, z), from about -1 to 1. */
export const snoise = (inX: number, inY: number, inZ: number) => {
  const vx = f(inX);
  const vy = f(inY);
  const vz = f(inZ);
  const s = f(f(vx + vy + vz) * ONE_THIRD);
  const ix = Math.floor(f(vx + s));
  const iy = Math.floor(f(vy + s));
  const iz = Math.floor(f(vz + s));
  const t = f(f(ix + iy + iz) * ONE_SIXTH);
  const x0 = f(f(vx - ix) + t);
  const y0 = f(f(vy - iy) + t);
  const z0 = f(f(vz - iz) + t);

  const gx = x0 >= y0 ? 1 : 0;
  const gy = y0 >= z0 ? 1 : 0;
  const gz = z0 >= x0 ? 1 : 0;
  const i1x = Math.min(gx, 1 - gz);
  const i1y = Math.min(gy, 1 - gx);
  const i1z = Math.min(gz, 1 - gy);
  const i2x = Math.max(gx, 1 - gz);
  const i2y = Math.max(gy, 1 - gx);
  const i2z = Math.max(gz, 1 - gy);

  const mx = mod289(ix);
  const my = mod289(iy);
  const mz = mod289(iz);
  const hash = (dx: number, dy: number, dz: number) =>
    permute(f(f(permute(f(f(permute(f(mz + dz)) + my) + dy)) + mx) + dx));

  let sum = 0;
  gradient(hash(0, 0, 0), g);
  sum += corner(g, x0, y0, z0);
  gradient(hash(i1x, i1y, i1z), g);
  sum += corner(g, x0 - i1x + 1 / 6, y0 - i1y + 1 / 6, z0 - i1z + 1 / 6);
  gradient(hash(i2x, i2y, i2z), g);
  sum += corner(g, x0 - i2x + 1 / 3, y0 - i2y + 1 / 3, z0 - i2z + 1 / 3);
  gradient(hash(1, 1, 1), g);
  sum += corner(g, x0 - 0.5, y0 - 0.5, z0 - 0.5);
  return 42 * sum;
};
