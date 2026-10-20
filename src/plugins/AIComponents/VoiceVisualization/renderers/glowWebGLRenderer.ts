import type { VoiceFrame, VoiceRenderer } from './types';

const VERTEX = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

/**
 * The glow's fragment shader, GLSL ES 1.00. A line-for-line port of the AGSL glow in
 * stream-chat-android (itself ported from the iOS Metal glow), so the platforms look alike.
 * Pixels past the halo return at once, so only the glow itself costs.
 */
const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 resolution;
uniform vec4 col0;
uniform vec4 col1;
uniform vec4 col2;
uniform vec4 col3;
uniform vec4 col4;
uniform float time;
uniform float count;
uniform float bright;
uniform float sat;
uniform float load;
uniform float flow;
uniform float flowSpin;
uniform float orbSpin;
uniform float react;
uniform float dark;
uniform float mic;
uniform float voice;
uniform float scale;
uniform vec2 tap;
uniform float tapTime;
uniform vec2 hover;
uniform float hoverAmt;

float sq(float x) { return x * x; }
float ss(float e0, float e1, float x) {
  float t = clamp((x - e0) / (e1 - e0), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}
vec3 desat(vec3 c, float s) {
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  return mix(vec3(l), c, s);
}
vec3 saturate3(vec3 c, float s) {
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  return clamp(mix(vec3(l), c, s), 0.0, 1.0);
}
vec2 rot2(vec2 p, float a) {
  float s = sin(a); float c = cos(a);
  return vec2(c * p.x + s * p.y, -s * p.x + c * p.y);
}
vec3 vivid(vec4 hsv) {
  return hsv2rgb(vec3(hsv.x, clamp(hsv.y + dark * 0.06, 0.0, 1.0), hsv.z));
}
// Waves spreading out from the last tap, fading within a second and a half.
float tapRipple(vec2 p) {
  float age = tapTime;
  if (age > 1.5) return 0.0;
  float d = distance(p, tap);
  float front = age * 0.75;
  float env = exp(-sq((d - front) / 0.14));
  float decay = exp(-age * 2.6);
  return sin(d * 34.0 - age * 24.0) * env * decay;
}
// A gentle ripple following a hovering pointer.
float hoverRipple(vec2 p) {
  if (hoverAmt <= 0.001) return 0.0;
  float d = distance(p, hover);
  float env = exp(-sq(d / 0.22));
  return sin(d * 30.0 - time * 7.0) * env * hoverAmt * 0.6;
}
vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0 / 7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
float speechEnv(float t) {
  float gate = ss(-0.25, 0.35, snoise(vec3(t * 0.6, 21.0, 0.0)));
  float syl = 0.55 + 0.45 * snoise(vec3(t * 3.0, 5.0, 0.0));
  return clamp(gate * syl, 0.0, 1.0);
}

void main() {
  // Centred, normalized to the shorter side, y up: gl_FragCoord already has y up.
  float side = min(resolution.x, resolution.y);
  vec2 q = (gl_FragCoord.xy - 0.5 * resolution) / side / scale;
  float t = time;
  float r = length(q);

  float speak = ss(0.6, 1.0, react);
  float speech = react * mix(0.55 + 0.25 * sin(t * 1.6), speechEnv(t), speak);
  speech = mix(speech, mic, voice);
  float speechSmooth = mix(speech, react * (0.55 + 0.25 * sin(t * 1.6)), 0.5 * speak);
  float energy = 0.12 + 0.30 * react + 0.18 * flow + 0.28 * load + 0.06 * speechSmooth;
  float R = 0.24 * (1.0 + speechSmooth * 0.20 + load * 0.05 * sin(t * 2.0) + react * 0.04 * sin(t * 1.6));
  float p = r / R;
  if (p > 2.2) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float core = exp(-2.0 * p * p);
  float body = ss(1.06, 0.62, p);

  vec2 P = q / R;
  float pl = length(P);
  float nt = t * 0.15 + flowSpin * 0.05;
  float nAmp = 0.20 + 0.28 * energy;
  vec2 sp = P + nAmp * vec2(snoise(vec3(P * 0.7, nt)), snoise(vec3(P * 0.7 + 4.7, nt)));
  float ang = atan(P.y, P.x);
  float wave = (0.018 + 0.025 * energy) * sin(pl * 5.0 - t * 2.0) * ss(0.0, 0.4, pl);
  sp += wave * vec2(-sin(ang), cos(ang));
  sp = rot2(sp, flowSpin * 0.30);
  vec2 gtoP = q - (hoverAmt > 0.001 ? hover : tap);
  sp += (gtoP / (length(gtoP) + 1e-4)) * (tapRipple(q) + hoverRipple(q)) * 0.5;
  float bt = t;
  float a0 = orbSpin * 0.42 + 2.0 * snoise(vec3(bt * 0.12, 0.0, 0.0));
  float a1 = -orbSpin * 0.34 + 2.0 * snoise(vec3(bt * 0.10, 5.0, 0.0)) + 2.0;
  float a2 = orbSpin * 0.30 + 2.0 * snoise(vec3(bt * 0.11, 9.0, 0.0)) + 1.0;
  float a3 = -orbSpin * 0.26 + 2.0 * snoise(vec3(bt * 0.09, 14.0, 0.0)) + 3.5;
  vec2 c0 = 0.40 * vec2(cos(a0), sin(a0));
  vec2 c1 = 0.38 * vec2(cos(a1), sin(a1));
  vec2 c2c = 0.36 * vec2(cos(a2), sin(a2));
  vec2 c3c = 0.34 * vec2(cos(a3), sin(a3));
  float b0 = ss(1.15, 0.1, length(sp - c0));
  float b1 = ss(1.30, 0.1, length(sp - c1));
  float b2 = ss(1.20, 0.1, length(sp - c2c));
  float b3 = ss(1.25, 0.1, length(sp - c3c));

  vec3 k0 = saturate3(vivid(col0), 1.7);
  vec3 kL = saturate3(clamp(vivid(col0) * 1.18, 0.0, 1.0), 1.3);
  vec3 kD = saturate3(vivid(col0) * 0.85, 1.3);
  vec3 colB = mix(kL, saturate3(vivid(col1), 1.7), clamp(count - 1.0, 0.0, 1.0));
  vec3 colC = mix(kD, saturate3(vivid(col2), 1.7), clamp(count - 2.0, 0.0, 1.0));
  vec3 colD = saturate3(vivid(col3), 1.7);
  vec3 colE = saturate3(vivid(col4), 1.7);
  vec3 base = saturate3(mix(vivid(col0), vec3(1.0), 0.06), 1.3);
  vec3 col = base;
  col = mix(col, k0, b0);
  col = mix(col, colB, b1);
  col = mix(col, colC, b0 * 0.5);
  col = mix(col, colD, b2 * clamp(count - 3.0, 0.0, 1.0));
  col = mix(col, colE, b3 * clamp(count - 4.0, 0.0, 1.0));
  col = saturate3(col, 1.15);
  col = clamp(col * 1.12, 0.0, 1.0);
  col = desat(col, sat);

  float z = sqrt(max(1.0 - p * p, 0.0));
  vec3 nrm = normalize(vec3(q / R, z + 1e-4));
  vec3 Ld = normalize(vec3(-0.35, 0.45, 0.85));
  float diff = clamp(dot(nrm, Ld), 0.0, 1.0);
  col *= 0.80 + 0.20 * diff;
  float fres = pow(1.0 - clamp(nrm.z, 0.0, 1.0), 2.5);
  col += fres * 0.10 * mix(vec3(1.0), k0, 0.6);

  vec3 haloCol = mix(mix(vivid(col0), vec3(1.0), 0.75), mix(vivid(col0), vec3(1.0), 0.32), dark);
  float halo = exp(-sq(max(r - R * 0.8, 0.0) / 0.09));
  float haloA = halo * (mix(0.05, 0.10, dark) + 0.05 * react);
  float waves = clamp(b0 + 0.8 * b1, 0.0, 1.0);
  float bodyA = clamp(body * (0.15 + 0.60 * waves + 0.06 * core) * (0.92 + 0.08 * fres), 0.0, 1.0);
  float fade = mix(1.0, 0.45 + 0.35 * sin(t * 2.0), load);
  vec3 pm = col * bodyA + haloCol * haloA * (1.0 - bodyA);
  float al = bodyA + haloA * (1.0 - bodyA);
  float gain = bright * fade;
  // Premultiplied, as the context is.
  gl_FragColor = vec4(pm * gain, al * gain);
}
`;

const UNIFORMS = [
  'resolution',
  'col0',
  'col1',
  'col2',
  'col3',
  'col4',
  'time',
  'count',
  'bright',
  'sat',
  'load',
  'flow',
  'flowSpin',
  'orbSpin',
  'react',
  'dark',
  'mic',
  'voice',
  'scale',
  'tap',
  'tapTime',
  'hover',
  'hoverAmt',
] as const;

type Uniform = (typeof UNIFORMS)[number];

const compile = (gl: WebGLRenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
};

/**
 * The glow drawn by a WebGL shader, every pixel computed on the GPU: color masses warped by
 * noise, concentric waves, ripples from a tap or a hovering pointer, light and a halo. It reads
 * the same motion as the Canvas glow.
 *
 * Returns null when WebGL is unavailable or the shader does not compile, so the caller can fall
 * back to Canvas. `onLost` is called if the browser later drops the context.
 */
export const createGlowWebGLRenderer = (
  canvas: HTMLCanvasElement,
  onLost: () => void,
): VoiceRenderer | null => {
  let gl: WebGLRenderingContext | null = null;
  try {
    gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      stencil: false,
    });
  } catch {
    gl = null;
  }
  if (!gl) return null;

  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  // One triangle covering the whole viewport.
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const locations = {} as Record<Uniform, WebGLUniformLocation | null>;
  for (const name of UNIFORMS) locations[name] = gl.getUniformLocation(program, name);

  let lost = false;
  const handleLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    onLost();
  };
  canvas.addEventListener('webglcontextlost', handleLost);

  const draw = ({ dark, driver: d, height, width }: VoiceFrame) => {
    if (lost || !gl) return;
    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(locations.resolution, width, height);
    for (let i = 0; i < 5; i++) {
      const c = d.color(i);
      gl.uniform4f(locations[`col${i}` as Uniform], c.hue, c.saturation, c.value, 0);
    }
    gl.uniform1f(locations.time, d.time);
    gl.uniform1f(locations.count, d.count);
    gl.uniform1f(locations.bright, d.bright);
    gl.uniform1f(locations.sat, d.sat);
    gl.uniform1f(locations.load, d.load);
    gl.uniform1f(locations.flow, d.flow);
    gl.uniform1f(locations.flowSpin, d.flowSpin);
    gl.uniform1f(locations.orbSpin, d.orbSpin);
    gl.uniform1f(locations.react, d.react);
    gl.uniform1f(locations.dark, dark);
    gl.uniform1f(locations.mic, d.mic);
    gl.uniform1f(locations.voice, d.voice);
    gl.uniform1f(locations.scale, d.scale);
    gl.uniform2f(locations.tap, d.tapX, d.tapY);
    gl.uniform1f(locations.tapTime, d.tapAge);
    gl.uniform2f(locations.hover, d.hoverX, d.hoverY);
    gl.uniform1f(locations.hoverAmt, d.hoverAmount);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const dispose = () => {
    canvas.removeEventListener('webglcontextlost', handleLost);
    if (!gl || lost) return;
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
  };

  return { dispose, draw };
};
