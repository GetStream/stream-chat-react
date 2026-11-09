import { VoiceVisualizationDriver } from '../VoiceVisualization/driver';
import type { createGlowWebGLRenderer as Create } from '../VoiceVisualization/renderers/glowWebGLRenderer';

type FakeGl = Record<string, ReturnType<typeof vi.fn>> & {
  loseContext: ReturnType<typeof vi.fn>;
};

/** A WebGL context that compiles everything, recording each call. */
const createFakeGl = (): FakeGl => {
  const loseContext = vi.fn();
  const target: Record<string | symbol, unknown> = {
    getAttribLocation: vi.fn(() => 0),
    getExtension: vi.fn(() => ({ loseContext })),
    getProgramParameter: vi.fn(() => true),
    getShaderParameter: vi.fn(() => true),
    isContextLost: vi.fn(() => false),
    loseContext,
  };
  return new Proxy(target, {
    get(store, name) {
      if (name in store) return store[name];
      // Constants such as COLOR_BUFFER_BIT.
      if (typeof name === 'string' && /^[A-Z_0-9]+$/.test(name)) return 1;
      const fn = vi.fn(() => ({}));
      store[name] = fn;
      return fn;
    },
  }) as unknown as FakeGl;
};

const driver = () =>
  new VoiceVisualizationDriver({
    audioLevel: null,
    colors: [{ hue: 0.6, saturation: 1, value: 1 }],
    expressivity: 1,
    reduceMotion: false,
    state: 'idle',
  });

describe('the WebGL glow', () => {
  let createGlowWebGLRenderer: typeof Create;
  let gls: FakeGl[];
  let webgl: boolean;

  /** A glow's own canvas, with the 2D context the shared drawing is copied onto. */
  const glowCanvas = () => {
    const canvas = document.createElement('canvas');
    const target = { clearRect: vi.fn(), drawImage: vi.fn() };
    (canvas as unknown as { target: typeof target }).target = target;
    return { canvas, target };
  };

  const frame = (d = driver()) => ({
    dark: 0,
    driver: d,
    height: 100,
    seconds: 0,
    width: 200,
  });

  beforeEach(async () => {
    // The shared context lives in the module, so each test starts from a fresh copy.
    vi.resetModules();
    gls = [];
    webgl = true;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (
      this: HTMLCanvasElement,
      type: string,
    ) {
      if (type === '2d') return (this as unknown as { target?: unknown }).target ?? null;
      if (type !== 'webgl' || !webgl) return null;
      const gl = createFakeGl();
      gls.push(gl);
      return gl;
    } as never);
    ({ createGlowWebGLRenderer } =
      await import('../VoiceVisualization/renderers/glowWebGLRenderer'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('compiles the shader once for every glow on the page', () => {
    const a = glowCanvas();
    const b = glowCanvas();
    const first = createGlowWebGLRenderer(a.canvas, vi.fn());
    const second = createGlowWebGLRenderer(b.canvas, vi.fn());

    first?.draw(frame());
    second?.draw(frame());

    expect(gls).toHaveLength(1);
    expect(gls[0].createProgram).toHaveBeenCalledTimes(1);
    // Each glow copies the shared drawing onto its own canvas, from the corner drawn into.
    const [source, , sy] = a.target.drawImage.mock.calls[0];
    expect(source).toBe(b.target.drawImage.mock.calls[0][0]);
    expect(sy).toBe((source as HTMLCanvasElement).height - 100);
  });

  it('falls every glow back when the context is lost, and starts afresh after', () => {
    const onLost = [vi.fn(), vi.fn()];
    const a = glowCanvas();
    const first = createGlowWebGLRenderer(a.canvas, onLost[0]);
    createGlowWebGLRenderer(glowCanvas().canvas, onLost[1]);
    first?.draw(frame());
    const shared = a.target.drawImage.mock.calls[0][0] as HTMLCanvasElement;

    shared.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));

    expect(onLost[0]).toHaveBeenCalledTimes(1);
    expect(onLost[1]).toHaveBeenCalledTimes(1);
    a.target.drawImage.mockClear();
    first?.draw(frame());
    expect(a.target.drawImage).not.toHaveBeenCalled();

    createGlowWebGLRenderer(glowCanvas().canvas, vi.fn());
    expect(gls).toHaveLength(2);
  });

  it('releases the context once the last glow is gone', () => {
    const first = createGlowWebGLRenderer(glowCanvas().canvas, vi.fn());
    const second = createGlowWebGLRenderer(glowCanvas().canvas, vi.fn());

    first?.dispose?.();
    expect(gls[0].loseContext).not.toHaveBeenCalled();
    second?.dispose?.();
    expect(gls[0].loseContext).toHaveBeenCalledTimes(1);

    createGlowWebGLRenderer(glowCanvas().canvas, vi.fn());
    expect(gls).toHaveLength(2);
  });

  it('returns null where WebGL or a 2D canvas is unavailable', () => {
    expect(createGlowWebGLRenderer(document.createElement('canvas'), vi.fn())).toBeNull();

    webgl = false;
    expect(createGlowWebGLRenderer(glowCanvas().canvas, vi.fn())).toBeNull();
  });
});
