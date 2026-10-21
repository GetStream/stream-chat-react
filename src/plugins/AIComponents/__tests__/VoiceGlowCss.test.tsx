import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { VoiceGlow } from '..';
import {
  CSS_GLOW_RATES,
  cssGlowPalette,
  cssGlowRateKind,
} from '../VoiceVisualization/cssGlow';
import { toHsvPalette } from '../VoiceVisualization/palette';

type FakeAnimation = {
  animationName: string;
  updatePlaybackRate: ReturnType<typeof vi.fn>;
};

const animation = (animationName: string): FakeAnimation => ({
  animationName,
  updatePlaybackRate: vi.fn(),
});

describe('VoiceGlow rendering="css"', () => {
  let frames: FrameRequestCallback[];
  let now: number;
  let animations: FakeAnimation[];

  const step = (count = 1) => {
    for (let i = 0; i < count; i++) {
      const pending = frames;
      frames = [];
      now += 1000 / 60;
      act(() => pending.forEach((callback) => callback(now)));
    }
  };

  const lastRate = (name: string) =>
    animations
      .find((a) => a.animationName === name)
      ?.updatePlaybackRate.mock.calls.at(-1)?.[0];

  beforeEach(() => {
    frames = [];
    now = 1000;
    animations = [
      'str-ai-glow-spin',
      'str-ai-glow-unspin',
      'str-ai-glow-flow',
      'str-ai-glow-unflow',
      'str-ai-glow-breath',
      'str-ai-glow-bounce',
    ].map(animation);
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    // jsdom has no Web Animations; stand in for the stylesheet's running animations.
    Object.defineProperty(HTMLElement.prototype, 'getAnimations', {
      configurable: true,
      value: () => animations,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (HTMLElement.prototype as { getAnimations?: unknown }).getAnimations;
  });

  it('draws with elements, not a canvas, under the same name and root classes', () => {
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext');
    const { container } = render(
      <VoiceGlow
        className='custom'
        data-testid='glow'
        rendering='css'
        state='speaking'
      />,
    );
    const glow = screen.getByTestId('glow');

    expect(glow).toHaveClass(
      'str-chat__ai-voice-visualization',
      'str-chat__ai-voice-glow',
      'str-chat__ai-voice-glow--css',
      'custom',
    );
    expect(glow).toHaveAttribute('role', 'img');
    expect(glow).toHaveAttribute('data-rendering', 'css');
    expect(glow).toHaveAttribute('data-state', 'speaking');
    expect(container.querySelector('canvas')).toBeNull();
    expect(getContext).not.toHaveBeenCalledWith('webgl', expect.anything());
    // A faint still body and one riding each of the two orbits, each over the color field.
    expect(container.querySelectorAll('.str-chat__ai-voice-glow__field')).toHaveLength(3);
    expect(container.querySelectorAll('.str-chat__ai-voice-glow__mass')).toHaveLength(15);
  });

  it('sets the palette from the colors prop', () => {
    // The stylesheet sets this to the backdrop token; jsdom loads no stylesheet.
    render(
      <VoiceGlow
        colors={['#005fff', '#7c3aed']}
        rendering='css'
        state='idle'
        style={{ textDecorationColor: 'rgb(255, 255, 255)' }}
      />,
    );
    const glow = screen.getByRole('img');
    const expected = cssGlowPalette(toHsvPalette(['#005fff', '#7c3aed']), 0);

    expect(glow.style.getPropertyValue('--str-ai-glow-k0')).toBe(
      expected['--str-ai-glow-k0'],
    );
    expect(glow.style.getPropertyValue('--str-ai-glow-col-b')).toBe(
      expected['--str-ai-glow-col-b'],
    );
    expect(glow.style.getPropertyValue('--str-ai-glow-w3')).toBe('0');
    expect(glow).toHaveAttribute('data-dark', 'false');
  });

  it('takes the theme color when no colors are given, and follows a dark backdrop', () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    try {
      render(
        <VoiceGlow
          rendering='css'
          state='idle'
          style={{ color: 'rgb(255, 0, 0)', textDecorationColor: 'rgb(255, 255, 255)' }}
        />,
      );
      const glow = screen.getByRole('img');
      expect(glow.style.getPropertyValue('--str-ai-glow-k0')).toBe(
        cssGlowPalette(toHsvPalette(['rgb(255, 0, 0)']), 0)['--str-ai-glow-k0'],
      );

      glow.style.textDecorationColor = 'rgb(20, 20, 20)';
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(glow).toHaveAttribute('data-dark', 'true');
    } finally {
      vi.useRealTimers();
    }
  });

  it('plays each state at its rates, a turn and its inverse alike', () => {
    const { rerender } = render(<VoiceGlow rendering='css' state='idle' />);
    expect(lastRate('str-ai-glow-spin')).toBeCloseTo(CSS_GLOW_RATES.idle.orbit);
    expect(lastRate('str-ai-glow-flow')).toBe(0);

    rerender(<VoiceGlow rendering='css' state='thinking' />);
    expect(lastRate('str-ai-glow-spin')).toBeCloseTo(CSS_GLOW_RATES.thinking.orbit);
    expect(lastRate('str-ai-glow-unspin')).toBe(lastRate('str-ai-glow-spin'));
    expect(lastRate('str-ai-glow-flow')).toBeCloseTo(1);
    expect(lastRate('str-ai-glow-unflow')).toBe(lastRate('str-ai-glow-flow'));
    expect(lastRate('str-ai-glow-breath')).toBeCloseTo(CSS_GLOW_RATES.thinking.tempo);
    // A tap's bounce plays as authored.
    expect(lastRate('str-ai-glow-bounce')).toBeUndefined();
  });

  it('scales speed with expressivity and amplitude through a custom property', () => {
    render(<VoiceGlow expressivity={2} rendering='css' state='speaking' />);

    expect(lastRate('str-ai-glow-spin')).toBeCloseTo(CSS_GLOW_RATES.speaking.orbit * 1.4);
    expect(screen.getByRole('img').style.getPropertyValue('--str-ai-glow-amp')).toBe(
      '1.850',
    );
  });

  it('writes a live audio level once a frame and marks it live', () => {
    const audioLevel = vi.fn(() => 0.8);
    render(<VoiceGlow audioLevel={audioLevel} rendering='css' state='speaking' />);
    const glow = screen.getByRole('img');

    step(30);

    expect(audioLevel).toHaveBeenCalledTimes(30);
    expect(glow).toHaveAttribute('data-live', 'true');
    expect(Number(glow.style.getPropertyValue('--str-ai-glow-level'))).toBeCloseTo(
      0.8,
      1,
    );
  });

  it('runs no frame loop without an audio level', () => {
    render(<VoiceGlow rendering='css' state='speaking' />);

    expect(frames).toHaveLength(0);
  });

  it('bounces on a tap inside the globe, rings, and lets a parent handle the click', () => {
    const onClick = vi.fn();
    const onPointerUp = vi.fn();
    const { container } = render(
      <div onClick={onClick}>
        <VoiceGlow onPointerUp={onPointerUp} rendering='css' state='idle' />
      </div>,
    );
    const glow = screen.getByRole('img');
    vi.spyOn(glow, 'getBoundingClientRect').mockReturnValue({
      height: 200,
      left: 0,
      top: 0,
      width: 200,
    } as DOMRect);

    fireEvent.pointerUp(glow, { clientX: 2, clientY: 2 });
    expect(
      container.querySelector('.str-chat__ai-voice-glow__bounce--active'),
    ).toBeNull();

    fireEvent.pointerUp(glow, { clientX: 100, clientY: 110 });
    fireEvent.click(glow);

    expect(
      container.querySelector('.str-chat__ai-voice-glow__bounce--active'),
    ).toBeInTheDocument();
    expect(container.querySelectorAll('.str-chat__ai-voice-glow__ripple')).toHaveLength(
      1,
    );
    expect(onPointerUp).toHaveBeenCalledTimes(2);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not bounce under reduced motion, and slows every animation', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) =>
        ({
          addEventListener: () => undefined,
          matches: query.includes('reduce'),
          media: query,
          removeEventListener: () => undefined,
        }) as unknown as MediaQueryList,
    );
    const { container } = render(<VoiceGlow rendering='css' state='speaking' />);
    const glow = screen.getByRole('img');
    vi.spyOn(glow, 'getBoundingClientRect').mockReturnValue({
      height: 200,
      left: 0,
      top: 0,
      width: 200,
    } as DOMRect);

    fireEvent.pointerUp(glow, { clientX: 100, clientY: 100 });

    expect(
      container.querySelector('.str-chat__ai-voice-glow__bounce--active'),
    ).toBeNull();
    expect(lastRate('str-ai-glow-spin')).toBeCloseTo(
      CSS_GLOW_RATES.speaking.orbit * 0.07,
    );
  });
});

describe('cssGlowPalette', () => {
  const blue = toHsvPalette(['#005fff']);

  it('saturates the masses as the shader does', () => {
    // saturate3(c, 1.7), then the field's saturate3(1.15) and x1.12, all clamped.
    expect(cssGlowPalette(blue, 0)['--str-ai-glow-k0']).toBe('rgb(0 117 255)');
  });

  it('fills slots the palette leaves empty from the first color', () => {
    const palette = cssGlowPalette(blue, 0);
    const twoColors = cssGlowPalette(toHsvPalette(['#005fff', '#7c3aed']), 0);

    expect(palette['--str-ai-glow-col-b']).not.toBe(twoColors['--str-ai-glow-col-b']);
    expect(palette['--str-ai-glow-col-d']).toBe(palette['--str-ai-glow-k0']);
    expect(palette['--str-ai-glow-w3']).toBe('0');
    expect(
      cssGlowPalette(toHsvPalette(['#f00', '#0f0', '#00f', '#ff0', '#0ff']), 0)[
        '--str-ai-glow-w4'
      ],
    ).toBe('1');
  });

  it('tints the halo less on a dark backdrop', () => {
    expect(cssGlowPalette(blue, 1)['--str-ai-glow-halo']).not.toBe(
      cssGlowPalette(blue, 0)['--str-ai-glow-halo'],
    );
  });

  it('returns nothing for an empty palette', () => {
    expect(cssGlowPalette([], 0)).toEqual({});
  });

  it('names which rate each animation plays at', () => {
    expect(cssGlowRateKind('str-ai-glow-spin')).toBe('orbit');
    expect(cssGlowRateKind('str-ai-glow-unspin')).toBe('orbit');
    expect(cssGlowRateKind('str-ai-glow-flow')).toBe('flow');
    expect(cssGlowRateKind('str-ai-glow-unflow')).toBe('flow');
    expect(cssGlowRateKind('str-ai-glow-mask-warp')).toBe('tempo');
    expect(cssGlowRateKind('str-ai-glow-bounce')).toBeNull();
    expect(cssGlowRateKind('str-ai-glow-ripple')).toBeNull();
  });
});
