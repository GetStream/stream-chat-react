import { type PointerEvent, useEffect, useRef } from 'react';
import clsx from 'clsx';

import { useReducedMotionPreference } from '../../../components/MessageList/hooks/useReducedMotionPreference';
import { useStableCallback } from '../../../utils/useStableCallback';
import { type VoiceDriverInput, VoiceVisualizationDriver } from './driver';
import { audioLevelInput, expressivityInput } from './math';
import { luminance, toHsvPalette } from './palette';
import type { VoiceRenderer } from './renderers/types';
import type { Hsv, VoiceVisualizationProps } from './types';
import { useVoiceStateLabel } from './useVoiceStateLabel';

/** Used when neither the `colors` prop nor the theme gives a readable color. */
const FALLBACK_COLOR = '#005fff';
/** How many frames pass between two reads of the theme, about once a second at 60 Hz. */
const THEME_FRAMES = 60;
/** Sharper than this is invisible on a soft drawing and only costs fill rate. */
const DEFAULT_MAX_PIXEL_RATIO = 2;

type ViewProps = VoiceVisualizationProps & {
  /** Whether a point, centred and normalized to the shorter side with y up, is on the shape. */
  contains: (x: number, y: number) => boolean;
  /** Makes the renderer for a freshly mounted canvas, or null when it cannot draw there. */
  createRenderer: (canvas: HTMLCanvasElement) => VoiceRenderer | null;
  /** Remounts the canvas and remakes the renderer when it changes. */
  rendererKey: string;
  /**
   * The most device pixels per CSS pixel the canvas gets. A blurred shape looks the same at 1,
   * at a quarter of the pixels of a 2x display.
   */
  maxPixelRatio?: number;
};

/**
 * What VoiceWave and VoiceGlow share: the motion advanced once a frame, the canvas kept at the
 * element's size, the theme's colors, reduced motion, the pointer and the accessible name.
 *
 * The loop runs only while the element is on screen, reads `audioLevel` once a frame and
 * redraws without re-rendering React.
 */
export const VoiceVisualizationView = ({
  audioLevel,
  className,
  colors,
  contains,
  createRenderer,
  expressivity,
  maxPixelRatio = DEFAULT_MAX_PIXEL_RATIO,
  onPointerLeave,
  onPointerMove,
  onPointerUp,
  rendererKey,
  state,
  ...restProps
}: ViewProps) => {
  const label = useVoiceStateLabel(state);
  const reduceMotion = useReducedMotionPreference();
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const driverRef = useRef<VoiceVisualizationDriver | null>(null);
  const audioLevelRef = useRef(audioLevel);
  const themeRef = useRef<{ dark: number; palette: Hsv[] }>({ dark: 0, palette: [] });
  const paletteRef = useRef<{ key: string; palette: Hsv[] }>({ key: '', palette: [] });
  const propsRef = useRef({ colors, expressivity, reduceMotion, state });

  /**
   * The theme's accent color (the root's `color`) and whether it sits on a dark backdrop (the
   * root's `text-decoration-color`, which carries the backdrop token and never paints).
   */
  const readTheme = useStableCallback(() => {
    const root = rootRef.current;
    if (!root || typeof getComputedStyle !== 'function') return;
    const style = getComputedStyle(root);
    const backdrop = luminance(style.textDecorationColor || '');
    themeRef.current = {
      dark: backdrop !== null && backdrop < 0.5 ? 1 : 0,
      palette: toHsvPalette(style.color ? [style.color] : []),
    };
  });

  /** The driver's input from the latest props and the theme, keeping the audio level it has. */
  const applyInput = useStableCallback(() => {
    // The first input settles the driver, so read the theme before it starts on a fallback.
    if (!driverRef.current) readTheme();
    const { colors, expressivity, reduceMotion, state } = propsRef.current;
    const key = (colors ?? []).join('|');
    if (paletteRef.current.key !== key) {
      paletteRef.current = { key, palette: toHsvPalette(colors ?? []) };
    }
    const own = paletteRef.current.palette;
    const theme = themeRef.current.palette;
    const input: VoiceDriverInput = {
      audioLevel: driverRef.current?.input.audioLevel ?? null,
      colors: own.length ? own : theme.length ? theme : toHsvPalette([FALLBACK_COLOR]),
      expressivity: expressivityInput(expressivity),
      reduceMotion,
      state,
    };
    if (driverRef.current) driverRef.current.input = input;
    else
      driverRef.current = new VoiceVisualizationDriver({
        ...input,
        audioLevel: audioLevelInput(audioLevelRef.current?.()),
      });
  });

  useEffect(() => {
    audioLevelRef.current = audioLevel;
    propsRef.current = { colors, expressivity, reduceMotion, state };
    applyInput();
  });

  const makeRenderer = useStableCallback(createRenderer);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas || typeof requestAnimationFrame !== 'function') return;

    const renderer = makeRenderer(canvas);
    if (!renderer) return;

    let pixelRatio = 1;
    const resize = () => {
      pixelRatio = Math.min(window.devicePixelRatio || 1, maxPixelRatio);
      const width = Math.round(root.clientWidth * pixelRatio);
      const height = Math.round(root.clientHeight * pixelRatio);
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
    };
    resize();
    const resizeObserver =
      typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
    resizeObserver?.observe(root);

    let frameId = 0;
    let last = 0;
    let frames = 0;
    let visible = true;

    const tick = (now: number) => {
      frameId = 0;
      const driver = driverRef.current;
      if (!driver) return;
      if (last !== 0) {
        driver.input = {
          ...driver.input,
          audioLevel: audioLevelInput(audioLevelRef.current?.()),
        };
        driver.advance((now - last) / 1000);
      }
      last = now;
      if (++frames % THEME_FRAMES === 0) {
        readTheme();
        applyInput();
      }
      renderer.draw({
        dark: themeRef.current.dark,
        dpr: pixelRatio,
        driver,
        height: canvas.height,
        width: canvas.width,
      });
      // The canvas fades in once it has something to show, as on iOS, rather than flashing
      // empty while a shader compiles or the first frame lands.
      if (!canvas.dataset.ready) canvas.dataset.ready = 'true';
      schedule();
    };

    const schedule = () => {
      if (visible && !frameId) frameId = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
      // The first frame back shows where it was rather than leaping over the pause.
      last = 0;
    };

    // Off screen, nothing is drawn; hidden tabs already pause requestAnimationFrame.
    const intersectionObserver =
      typeof IntersectionObserver === 'function'
        ? new IntersectionObserver((entries) => {
            visible = entries.some((entry) => entry.isIntersecting);
            if (visible) schedule();
            else stop();
          })
        : null;
    intersectionObserver?.observe(root);

    const colorScheme =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : null;
    const onSchemeChange = () => {
      readTheme();
      applyInput();
    };
    colorScheme?.addEventListener?.('change', onSchemeChange);

    schedule();

    return () => {
      stop();
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      colorScheme?.removeEventListener?.('change', onSchemeChange);
      renderer.dispose?.();
    };
  }, [applyInput, makeRenderer, maxPixelRatio, readTheme, rendererKey]);

  /** The pointer in the renderers' coordinates: centred, normalized to the shorter side, y up. */
  const toLocal = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const side = Math.min(rect.width, rect.height) || 1;
    return {
      x: (event.clientX - rect.left - rect.width / 2) / side,
      y: (rect.height / 2 - (event.clientY - rect.top)) / side,
    };
  };

  // Pointer events are only watched, never prevented or stopped, so a click handler on the
  // element or a parent still gets them. They come only from the shape's hit area: the rest of
  // the box lets them through to whatever is behind it.
  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    onPointerUp?.(event);
    const { x, y } = toLocal(event);
    if (contains(x, y)) driverRef.current?.tap(x, y);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event);
    // Only a hovering mouse or pen ripples it; a finger has no hover.
    if (event.pointerType === 'touch') return;
    const { x, y } = toLocal(event);
    const hovering = event.buttons === 0 && contains(x, y);
    driverRef.current?.hover(hovering ? x : null, hovering ? y : null);
  };

  const handlePointerLeave = (event: PointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(event);
    driverRef.current?.hover(null, null);
  };

  return (
    <div
      aria-label={label}
      className={clsx('str-chat__ai-voice-visualization', className)}
      data-state={state}
      role='img'
      {...restProps}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      ref={rootRef}
    >
      <canvas
        aria-hidden='true'
        className='str-chat__ai-voice-visualization__canvas'
        key={rendererKey}
        ref={canvasRef}
      />
      {/* Only the shape takes the pointer; around it, events reach what is behind. */}
      <div aria-hidden='true' className='str-chat__ai-voice-visualization__hit' />
    </div>
  );
};
