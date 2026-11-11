import React, { type ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { VoiceGlow, VoiceWave } from '..';
import { TranslationProvider } from '../../../context';
import en from '../../../i18n/en.json';

// jsdom has no WebGL: a fake renderer stands in, recording the bounce it draws each frame, and
// tests can make it fail to start or lose its context.
const webgl = vi.hoisted(() => ({
  create: vi.fn(),
  drawnScales: [] as number[],
  lose: () => undefined as void,
}));
vi.mock('../VoiceVisualization/renderers/glowWebGLRenderer', () => ({
  createGlowWebGLRenderer: (canvas: HTMLCanvasElement, onLost: () => void) =>
    webgl.create(canvas, onLost),
}));

type Recorded = { args: unknown[]; name: string };

/** A 2D context that records every call and every property it is given. */
const createFakeContext = (calls: Recorded[]) =>
  new Proxy({} as Record<string | symbol, unknown>, {
    get(target, name) {
      if (name in target) return target[name];
      const fn = (...args: unknown[]) => {
        calls.push({ args, name: String(name) });
        if (name === 'createLinearGradient' || name === 'createRadialGradient') {
          return {
            addColorStop: (offset: number, color: string) =>
              calls.push({ args: [offset, color], name: 'addColorStop' }),
          };
        }
        return undefined;
      };
      target[name] = fn;
      return fn;
    },
    set(target, name, value) {
      calls.push({ args: [value], name: `set ${String(name)}` });
      target[name] = value;
      return true;
    },
  });

/** English, with interpolation, as Streami18n would give. */
const enT = ((key: string, options?: Record<string, string>) =>
  ((en as Record<string, string>)[key] || key).replace(
    /\{\{\s*(\w+)\s*\}\}/g,
    (_, name) => options?.[name] ?? '',
  )) as never;

const WithEnglish = ({ children }: { children: ReactNode }) => (
  <TranslationProvider
    value={{ t: enT, tDateTimeParser: (() => null) as never, userLanguage: 'en' }}
  >
    {children}
  </TranslationProvider>
);

describe('VoiceWave and VoiceGlow', () => {
  let frames: FrameRequestCallback[];
  let now: number;
  let calls: Recorded[];

  const step = (count = 1) => {
    for (let i = 0; i < count; i++) {
      const pending = frames;
      frames = [];
      now += 1000 / 60;
      act(() => pending.forEach((callback) => callback(now)));
    }
  };

  beforeEach(() => {
    frames = [];
    now = 1000;
    calls = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    // jsdom lays nothing out; the renderers draw nothing in a box with no size.
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(200);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(200);
    webgl.drawnScales = [];
    webgl.create.mockReset();
    webgl.create.mockImplementation((_canvas: HTMLCanvasElement, onLost: () => void) => {
      webgl.lose = onLost;
      return {
        dispose: vi.fn(),
        draw: ({ driver }: { driver: { scale: number } }) =>
          webgl.drawnScales.push(driver.scale),
      };
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (
      this: HTMLCanvasElement,
      type: string,
    ) {
      return type === '2d' ? (createFakeContext(calls) as never) : null;
    } as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('names the visualization and its state, and follows a state change', () => {
    const { rerender } = render(
      <WithEnglish>
        <VoiceWave state='idle' />
      </WithEnglish>,
    );
    expect(screen.getByRole('img', { name: 'Voice agent: Ready' })).toBeInTheDocument();

    rerender(
      <WithEnglish>
        <VoiceWave state='speaking' />
      </WithEnglish>,
    );
    expect(screen.getByRole('img', { name: 'Voice agent: Speaking' })).toHaveAttribute(
      'data-state',
      'speaking',
    );
  });

  it('renders a hidden canvas inside its root classes and passes div props through', () => {
    const { container } = render(
      <>
        <VoiceWave className='custom' data-testid='wave' state='listening' />
        <VoiceGlow state='thinking' style={{ width: 100 }} />
      </>,
    );
    const wave = screen.getByTestId('wave');
    expect(wave).toHaveClass(
      'str-chat__ai-voice-visualization',
      'str-chat__ai-voice-wave',
      'custom',
    );
    expect(wave.querySelector('canvas')).toHaveAttribute('aria-hidden', 'true');
    const glow = container.querySelector('.str-chat__ai-voice-glow') as HTMLElement;
    expect(glow.style.width).toBe('100px');
  });

  it('reads the audio level once a frame', () => {
    const audioLevel = vi.fn(() => 0.5);
    render(<VoiceWave audioLevel={audioLevel} state='speaking' />);
    step();
    audioLevel.mockClear();

    step(3);

    expect(audioLevel).toHaveBeenCalledTimes(3);
  });

  it('keeps animating with an audio level that is not a number', () => {
    render(<VoiceWave audioLevel={() => Number.NaN} state='speaking' />);
    step(3);
    expect(calls.filter((call) => call.name === 'clearRect').length).toBe(3);
  });

  it('draws the theme color when no colors are given, and the colors when they are', () => {
    const { rerender } = render(
      <VoiceWave
        state='idle'
        style={{ color: 'rgb(255, 0, 0)', height: 50, width: 100 }}
      />,
    );
    step();
    const stops = () =>
      calls.filter((call) => call.name === 'addColorStop').map((call) => call.args[1]);
    expect(stops().some((color) => String(color).startsWith('rgba(255, 0, 0,'))).toBe(
      true,
    );

    calls.length = 0;
    rerender(
      <VoiceWave
        colors={['#00ff00']}
        state='idle'
        style={{ color: 'rgb(255, 0, 0)', height: 50, width: 100 }}
      />,
    );
    // The palette eases toward the new color.
    step(120);
    calls.length = 0;
    step();
    expect(stops().some((color) => String(color).startsWith('rgba(0, 255, 0,'))).toBe(
      true,
    );
  });

  it('bounces on a tap inside the globe and still lets a parent handle the click', () => {
    const onClick = vi.fn();
    const onPointerUp = vi.fn();
    render(
      <div onClick={onClick}>
        <VoiceGlow onPointerUp={onPointerUp} state='idle' />
      </div>,
    );
    const glow = screen.getByRole('img');
    vi.spyOn(glow, 'getBoundingClientRect').mockReturnValue({
      bottom: 200,
      height: 200,
      left: 0,
      right: 200,
      top: 0,
      width: 200,
      x: 0,
      y: 0,
    } as DOMRect);
    step();

    fireEvent.pointerUp(glow, { clientX: 100, clientY: 100 });
    fireEvent.click(glow);
    webgl.drawnScales = [];
    step(3);

    expect(onPointerUp).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(Math.min(...webgl.drawnScales)).toBeLessThan(1);
  });

  it('ignores a tap outside the globe', () => {
    render(<VoiceGlow state='idle' />);
    const glow = screen.getByRole('img');
    vi.spyOn(glow, 'getBoundingClientRect').mockReturnValue({
      height: 200,
      left: 0,
      top: 0,
      width: 200,
    } as DOMRect);
    step();

    fireEvent.pointerUp(glow, { clientX: 2, clientY: 2 });
    webgl.drawnScales = [];
    step(3);

    expect(webgl.drawnScales.every((scale) => scale === 1)).toBe(true);
  });

  it('draws the glow with WebGL by default', () => {
    render(<VoiceGlow state='speaking' />);
    step();

    expect(webgl.create).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('img')).toHaveAttribute('data-rendering', 'webgl');
    expect(webgl.drawnScales.length).toBeGreaterThan(0);
  });

  it('falls back to CSS when WebGL is unavailable', () => {
    webgl.create.mockReturnValue(null);
    const { container } = render(<VoiceGlow state='speaking' />);

    expect(screen.getByRole('img')).toHaveAttribute('data-rendering', 'css');
    expect(container.querySelector('canvas')).toBeNull();
  });

  it('falls back to CSS when the WebGL context is lost', () => {
    render(<VoiceGlow state='speaking' />);
    step();
    expect(screen.getByRole('img')).toHaveAttribute('data-rendering', 'webgl');

    act(() => webgl.lose());

    expect(screen.getByRole('img')).toHaveAttribute('data-rendering', 'css');
  });

  it('never starts WebGL when told to draw with CSS', () => {
    render(<VoiceGlow rendering='css' state='speaking' />);

    expect(webgl.create).not.toHaveBeenCalled();
  });

  it('renders its labelled root even where no canvas context exists', () => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null);
    webgl.create.mockReturnValue(null);

    render(<VoiceGlow state='connecting' />);
    render(<VoiceWave state='connecting' />);

    expect(screen.getAllByRole('img')).toHaveLength(2);
    expect(frames).toHaveLength(0);
  });

  it('draws the soft glow at 1x and the sharp wave at up to 3x', () => {
    vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(4);
    render(
      <>
        <VoiceGlow state='idle' />
        <VoiceWave state='idle' />
      </>,
    );
    const [glow, wave] = screen
      .getAllByRole('img')
      .map((root) => root.querySelector('canvas') as HTMLCanvasElement);

    expect([glow.width, glow.height]).toEqual([200, 200]);
    expect([wave.width, wave.height]).toEqual([600, 600]);
  });

  it.each([
    // 0.6% of the shorter side: 600 device pixels at 3x.
    [3, 3.6],
    // Never under 1.5 device pixels: 0.6% of 200 is 1.2.
    [1, 1.5],
  ])('strokes the wave as thick as on Android and iOS at %sx', (ratio, lineWidth) => {
    vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(ratio);
    render(<VoiceWave state='idle' />);
    step();

    const widths = calls
      .filter((call) => call.name === 'set lineWidth')
      .map((call) => call.args[0]);
    expect(widths.at(-1)).toBeCloseTo(lineWidth, 5);
  });

  it('follows a change of pixel ratio alone, as on a move to another monitor', () => {
    const ratio = vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(1);
    const queries = new Map<string, () => void>();
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) =>
        ({
          addEventListener: (_: string, listener: () => void) =>
            queries.set(query, listener),
          matches: false,
          media: query,
          removeEventListener: () => queries.delete(query),
        }) as unknown as MediaQueryList,
    );
    render(<VoiceWave state='idle' />);
    const canvas = screen.getByRole('img').querySelector('canvas') as HTMLCanvasElement;
    expect(canvas.width).toBe(200);

    ratio.mockReturnValue(2);
    act(() => queries.get('(resolution: 1dppx)')?.());

    expect(canvas.width).toBe(400);
    // It now watches for the next change, from the new ratio.
    expect(queries.has('(resolution: 2dppx)')).toBe(true);
    expect(queries.has('(resolution: 1dppx)')).toBe(false);
  });

  it('fades the canvas in once its first frame is drawn', () => {
    render(<VoiceGlow state='idle' />);
    const canvas = screen.getByRole('img').querySelector('canvas') as HTMLCanvasElement;
    expect(canvas).not.toHaveAttribute('data-ready');

    step();

    expect(canvas).toHaveAttribute('data-ready', 'true');
  });

  it('never marks a canvas ready that cannot be drawn on', () => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null);
    render(<VoiceWave state='idle' />);
    step();

    expect(screen.getByRole('img').querySelector('canvas')).not.toHaveAttribute(
      'data-ready',
    );
  });

  it('takes the pointer only on the shape and hands it to the root', () => {
    const onClick = vi.fn();
    const { container } = render(
      <>
        <VoiceWave onClick={onClick} state='idle' />
        <VoiceGlow state='idle' />
      </>,
    );
    const hits = container.querySelectorAll('.str-chat__ai-voice-visualization__hit');
    expect(hits).toHaveLength(2);
    hits.forEach((hit) => expect(hit).toHaveAttribute('aria-hidden', 'true'));

    const glow = screen.getAllByRole('img')[1];
    vi.spyOn(glow, 'getBoundingClientRect').mockReturnValue({
      height: 200,
      left: 0,
      top: 0,
      width: 200,
    } as DOMRect);
    step();
    fireEvent.pointerUp(hits[1], { clientX: 100, clientY: 100 });
    webgl.drawnScales = [];
    step(3);
    expect(Math.min(...webgl.drawnScales)).toBeLessThan(1);

    fireEvent.click(hits[0]);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('stops the loop on unmount', () => {
    const { unmount } = render(<VoiceWave state='idle' />);
    step();

    unmount();

    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });
});
