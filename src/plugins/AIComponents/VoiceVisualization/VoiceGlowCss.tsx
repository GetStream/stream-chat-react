import {
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import clsx from 'clsx';

import { useReducedMotionPreference } from '../../../components/MessageList/hooks/useReducedMotionPreference';
import {
  CSS_GLOW_RATES,
  cssGlowPalette,
  cssGlowRateKind,
  massBackground,
  MASSES,
  orbitDistance,
  orbitMask,
  ORBITS,
  RIDING_BODIES,
} from './cssGlow';
import { ease, scales } from './driver';
import { audioLevelInput, expressivityInput } from './math';
import { glowContains } from './glowShape';
import { luminance, toHsvPalette } from './palette';
import type { VoiceVisualizationProps } from './types';
import { useVoiceStateLabel } from './useVoiceStateLabel';

/** Used when neither the `colors` prop nor the theme gives a readable color. */
const FALLBACK_COLOR = '#005fff';
/** How often the theme is read again, so a switch to dark mode is followed. */
const THEME_INTERVAL = 1000;
/** Matches the driver's easing of a live audio level. */
const MIC_EASE = 0.35;
const RIPPLE_DURATION = 900;
const REDUCED_MOTION_RATE = 0.07;

const block = 'str-chat__ai-voice-glow';

const Layer = ({
  children,
  className,
  style,
}: {
  children?: ReactNode;
  className: string;
  style?: CSSProperties;
}) => (
  <div className={`${block}__${className}`} style={style}>
    {children}
  </div>
);

const orbitStyle = (orbit: number) =>
  ({
    '--str-ai-glow-direction': ORBITS[orbit].direction,
    '--str-ai-glow-period': `${ORBITS[orbit].period}s`,
    '--str-ai-glow-start': `${ORBITS[orbit].start}deg`,
  }) as CSSProperties;

const swayStyle = (orbit: number) =>
  ({ '--str-ai-glow-sway-period': `${ORBITS[orbit].sway}s` }) as CSSProperties;

const warpStyle = (orbit: number, [period, turn]: [number, number]) =>
  ({
    '--str-ai-glow-dist': orbitDistance(orbit),
    '--str-ai-glow-warp-period': `${period}s`,
    '--str-ai-glow-warp-turn': `${turn}deg`,
  }) as CSSProperties;

/**
 * How much of the glow is drawn. `lite` is for the WebGL fallback, where the GPU is likely off
 * and the compositor blends every layer on the CPU: it keeps the colors and the opacity riding
 * the first orbit, and leaves out the second riding body, the stretches, the shade and the rim.
 */
type Detail = { colorCount: number; lite: boolean };

/** The masses the palette fills: the fourth and fifth only with that many colors. */
const massesFor = (colorCount: number) =>
  MASSES.filter((_, index) => index < 3 || index < colorCount);

/** The opaque color field: a base, the masses mixed over it in order, then shade and rim. */
const ColorField = ({ colorCount, lite }: Detail) => (
  <Layer className='field'>
    <Layer className='base' />
    <Layer className='flow'>
      {massesFor(colorCount).map((mass, index) => {
        const body = (
          <div
            className={`${block}__mass`}
            style={
              {
                '--str-ai-glow-dist': orbitDistance(mass.orbit),
                '--str-ai-glow-reach': mass.reach,
                background: massBackground(mass),
              } as CSSProperties
            }
          />
        );
        return (
          <Layer className='orbit' key={index} style={orbitStyle(mass.orbit)}>
            <Layer className='sway' style={swayStyle(mass.orbit)}>
              {lite ? (
                body
              ) : (
                <Layer className='warp' style={warpStyle(mass.orbit, mass.warp)}>
                  {body}
                </Layer>
              )}
            </Layer>
          </Layer>
        );
      })}
    </Layer>
    {!lite && <Layer className='shade' />}
    {!lite && <Layer className='rim' />}
  </Layer>
);

/**
 * The color field seen through opacity that rides an orbit: the mask turns and stretches with
 * the orbit, and the inverse turns and stretches inside it keep the colors where they are.
 */
const RidingBody = ({
  alpha,
  detail,
  orbit,
  reach,
  warp,
}: (typeof RIDING_BODIES)[number] & { detail: Detail }) => {
  const unturned = (
    <Layer className='unsway' style={swayStyle(orbit)}>
      <Layer className='unorbit' style={orbitStyle(orbit)}>
        <Layer className='unflow'>
          <ColorField {...detail} />
        </Layer>
      </Layer>
    </Layer>
  );
  const mask = { '--str-ai-glow-mask': orbitMask(orbit, reach, alpha) } as CSSProperties;
  return (
    <Layer className='body'>
      <Layer className='flow'>
        <Layer className='orbit' style={orbitStyle(orbit)}>
          {detail.lite ? (
            // Turns with the orbit but does not stretch, so it needs no inverse stretch.
            <div
              className={`${block}__sway ${block}__sway--mask`}
              style={{ ...swayStyle(orbit), ...mask }}
            >
              {unturned}
            </div>
          ) : (
            <Layer className='sway' style={swayStyle(orbit)}>
              <div
                className={`${block}__warp ${block}__warp--mask`}
                style={{ ...warpStyle(orbit, warp), ...mask }}
              >
                <Layer className='unwarp' style={warpStyle(orbit, warp)}>
                  {unturned}
                </Layer>
              </div>
            </Layer>
          )}
        </Layer>
      </Layer>
    </Layer>
  );
};

type Ripple = { id: number; x: number; y: number };

/**
 * VoiceGlow drawn with CSS: the same composition as the shader, with every gradient painted
 * once and only `transform` and `opacity` animated, so the browser's compositor runs the
 * motion. It keeps moving while the page is busy, needs no canvas or WebGL, and costs no
 * JavaScript per frame unless `audioLevel` is given.
 *
 * Script sets what the stylesheet cannot know: the palette (read from the theme when `colors`
 * is not given), the playback rate of each animation for the state, and the live audio level.
 */
export const VoiceGlowCss = ({
  audioLevel,
  className,
  colors,
  expressivity,
  lite = false,
  onPointerUp,
  state,
  style,
  ...restProps
}: VoiceVisualizationProps & {
  /** Draws fewer layers, for when it stands in for WebGL. See `Detail`. */
  lite?: boolean;
}) => {
  const label = useVoiceStateLabel(state);
  const reduceMotion = useReducedMotionPreference();
  const rootRef = useRef<HTMLDivElement>(null);
  const bounceRef = useRef<HTMLDivElement>(null);
  const audioLevelRef = useRef(audioLevel);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const { amplitude, speed } = scales(expressivityInput(expressivity));
  const colorsKey = (colors ?? []).join('|');
  const detail: Detail = { colorCount: Math.min(colors?.length || 1, 5), lite };
  const hasAudioLevel = !!audioLevel;

  useEffect(() => {
    audioLevelRef.current = audioLevel;
  });

  // The palette, from `colors` or the theme, and whether the glow sits on a dark backdrop. Read
  // again about once a second, so a theme switch is followed without a prop.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof getComputedStyle !== 'function') return;
    const own = colorsKey ? colorsKey.split('|') : [];
    let applied = '';
    const apply = () => {
      const computed = getComputedStyle(root);
      const backdrop = luminance(computed.textDecorationColor || '');
      const dark = backdrop !== null && backdrop < 0.5 ? 1 : 0;
      let palette = toHsvPalette(own.length ? own : [computed.color]);
      if (!palette.length) palette = toHsvPalette([FALLBACK_COLOR]);
      const properties = cssGlowPalette(palette, dark);
      const next = JSON.stringify(properties) + dark;
      if (next === applied) return;
      applied = next;
      for (const [name, value] of Object.entries(properties)) {
        root.style.setProperty(name, value);
      }
      root.setAttribute('data-dark', String(!!dark));
      // Fades in once the palette is in, so the theme color it starts from never shows.
      root.setAttribute('data-ready', 'true');
    };
    apply();
    const interval = setInterval(apply, THEME_INTERVAL);
    const scheme =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : null;
    scheme?.addEventListener?.('change', apply);
    return () => {
      clearInterval(interval);
      scheme?.removeEventListener?.('change', apply);
    };
  }, [colorsKey]);

  // Each state plays the animations at its own rates. Changing a playback rate keeps an
  // animation where it is, where changing its duration would make it jump; a turn and its
  // inverse always get the same rate, so they stay in step.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof root.getAnimations !== 'function') return;
    const rates = CSS_GLOW_RATES[state];
    const slow = reduceMotion ? REDUCED_MOTION_RATE : 1;
    for (const animation of root.getAnimations({ subtree: true })) {
      const kind = cssGlowRateKind((animation as CSSAnimation).animationName ?? '');
      if (kind) animation.updatePlaybackRate(rates[kind] * speed * slow);
    }
    // Layers come and go with the palette and the detail, so their animations need rates too.
  }, [colorsKey, lite, reduceMotion, speed, state]);

  // A live audio level, eased like the driver eases it, is the only value written per frame.
  useEffect(() => {
    const root = rootRef.current;
    if (!hasAudioLevel || !root || typeof requestAnimationFrame !== 'function') return;
    let frame = 0;
    let last = 0;
    let level = 0;
    let written = -1;
    let live: boolean | null = null;
    const tick = (now: number) => {
      const target = audioLevelInput(audioLevelRef.current?.());
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      level += ((target ?? 0) - level) * ease(MIC_EASE, dt);
      if (Math.abs(level - written) > 0.002) {
        written = level;
        root.style.setProperty('--str-ai-glow-level', level.toFixed(3));
      }
      if (live !== (target !== null)) {
        live = target !== null;
        root.setAttribute('data-live', String(live));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      root.style.removeProperty('--str-ai-glow-level');
      root.removeAttribute('data-live');
    };
  }, [hasAudioLevel]);

  const rippleTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => rippleTimers.current.forEach(clearTimeout), []);

  // A tap inside the globe bounces it and sends a ring out from the touch. Nothing is
  // prevented or stopped, so a click handler on the glow or a parent still gets it.
  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    onPointerUp?.(event);
    if (reduceMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const side = Math.min(rect.width, rect.height) || 1;
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (!glowContains((x - rect.width / 2) / side, (rect.height / 2 - y) / side)) return;
    const bounce = bounceRef.current;
    if (bounce) {
      bounce.classList.remove(`${block}__bounce--active`);
      // Restarts the bounce when taps come faster than it lasts.
      void bounce.offsetWidth;
      bounce.classList.add(`${block}__bounce--active`);
    }
    const id = Date.now() + Math.random();
    setRipples((current) => [...current, { id, x, y }]);
    rippleTimers.current.push(
      setTimeout(
        () => setRipples((current) => current.filter((ripple) => ripple.id !== id)),
        RIPPLE_DURATION,
      ),
    );
  };

  return (
    <div
      aria-label={label}
      className={clsx(
        'str-chat__ai-voice-visualization',
        block,
        `${block}--css`,
        className,
      )}
      data-detail={lite ? 'lite' : 'full'}
      data-rendering='css'
      data-state={state}
      role='img'
      style={{ '--str-ai-glow-amp': amplitude.toFixed(3), ...style } as CSSProperties}
      {...restProps}
      onPointerUp={handlePointerUp}
      ref={rootRef}
    >
      <Layer className='halo' />
      <Layer className='level'>
        <div className={`${block}__bounce`} ref={bounceRef}>
          <Layer className='breath'>
            <Layer className='gate'>
              <Layer className='speech'>
                <Layer className='pulse'>
                  <Layer className='globe'>
                    <div className={`${block}__body ${block}__body--still`}>
                      <ColorField {...detail} />
                    </div>
                    {(lite ? RIDING_BODIES.slice(0, 1) : RIDING_BODIES).map((body) => (
                      <RidingBody detail={detail} key={body.orbit} {...body} />
                    ))}
                  </Layer>
                </Layer>
              </Layer>
            </Layer>
          </Layer>
        </div>
      </Layer>
      {/* Only the globe takes the pointer; around it, events reach what is behind. */}
      <div aria-hidden='true' className='str-chat__ai-voice-visualization__hit' />
      {ripples.map((ripple) => (
        <span
          aria-hidden='true'
          className={`${block}__ripple`}
          key={ripple.id}
          style={{ left: ripple.x, top: ripple.y }}
        />
      ))}
    </div>
  );
};
