import React, { type ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { VoiceGlow, VoiceWave } from '..';
import { TranslationProvider } from '../../../context';
import en from '../../../i18n/en.json';

type Recorded = { args: unknown[]; name: string };

/** A 2D context that records every call and accepts any property. */
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
  let contextTypes: string[];

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
    contextTypes = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    // jsdom lays nothing out; the renderers draw nothing in a box with no size.
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(200);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(200);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (
      this: HTMLCanvasElement,
      type: string,
    ) {
      contextTypes.push(type);
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
        <VoiceGlow onPointerUp={onPointerUp} rendering='canvas' state='idle' />
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
    calls.length = 0;
    step(3);

    expect(onPointerUp).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(1);
    const scales = calls
      .filter((call) => call.name === 'scale')
      .map((call) => call.args[0] as number);
    expect(Math.min(...scales)).toBeLessThan(1);
  });

  it('ignores a tap outside the globe', () => {
    render(<VoiceGlow rendering='canvas' state='idle' />);
    const glow = screen.getByRole('img');
    vi.spyOn(glow, 'getBoundingClientRect').mockReturnValue({
      height: 200,
      left: 0,
      top: 0,
      width: 200,
    } as DOMRect);
    step();

    fireEvent.pointerUp(glow, { clientX: 2, clientY: 2 });
    calls.length = 0;
    step(3);

    const scales = calls
      .filter((call) => call.name === 'scale')
      .map((call) => call.args[0]);
    expect(scales.every((scale) => scale === 1)).toBe(true);
  });

  it('falls back to Canvas when WebGL is unavailable', () => {
    render(<VoiceGlow state='speaking' />);

    expect(contextTypes).toEqual(['webgl', '2d']);
    expect(screen.getByRole('img')).toHaveAttribute('data-rendering', 'canvas');
    step();
    expect(calls.some((call) => call.name === 'createRadialGradient')).toBe(true);
  });

  it('never asks for WebGL when told to draw on Canvas', () => {
    render(<VoiceGlow rendering='canvas' state='speaking' />);

    expect(contextTypes).toEqual(['2d']);
  });

  it('renders its labelled root even where no canvas context exists', () => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null);

    render(<VoiceGlow state='connecting' />);
    render(<VoiceWave state='connecting' />);

    expect(screen.getAllByRole('img')).toHaveLength(2);
    expect(frames).toHaveLength(0);
  });

  it('draws the soft glow at 1x and the sharp wave at up to 2x', () => {
    vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(3);
    render(
      <>
        <VoiceGlow rendering='canvas' state='idle' />
        <VoiceWave state='idle' />
      </>,
    );
    const [glow, wave] = screen
      .getAllByRole('img')
      .map((root) => root.querySelector('canvas') as HTMLCanvasElement);

    expect([glow.width, glow.height]).toEqual([200, 200]);
    expect([wave.width, wave.height]).toEqual([400, 400]);
  });

  it('paints the Canvas glow only inside the globe', () => {
    render(<VoiceGlow rendering='canvas' state='speaking' />);
    step();

    expect(calls.some((call) => call.name === 'clip')).toBe(true);
    const mask = calls.find(
      (call) => call.name === 'fillRect' && (call.args[2] as number) < 200,
    );
    expect(mask).toBeDefined();
  });

  it('stops the loop on unmount', () => {
    const { unmount } = render(<VoiceWave state='idle' />);
    step();

    unmount();

    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });
});
