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
  RIDING_BODY,
} from './cssGlow';
import { ease, MIC, REDUCED, scales } from './driver';
import { glowContains, toLocalPoint } from './hitArea';
import { audioLevelInput, expressivityInput } from './math';
import { FALLBACK_COLOR, readVoiceTheme, toHsvPalette } from './palette';
import type { VoiceVisualizationProps } from './types';
import { useVoiceStateLabel } from './useVoiceStateLabel';

/** How often the theme is read again, so a switch to dark mode is followed. */
const THEME_INTERVAL = 1000;
const RIPPLE_DURATION = 900;

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

/** The masses the palette fills: the fourth and fifth only with that many colors. */
const massesFor = (colorCount: number) =>
  MASSES.filter((_, index) => index < 3 || index < colorCount);

/** The opaque color field: a base and the masses mixed over it in order. */
const ColorField = ({ colorCount }: { colorCount: number }) => (
  <Layer className='field'>
    <Layer className='base' />
    <Layer className='flow'>
      {massesFor(colorCount).map((mass, index) => (
        <Layer className='orbit' key={index} style={orbitStyle(mass.orbit)}>
          <Layer className='sway' style={swayStyle(mass.orbit)}>
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
          </Layer>
        </Layer>
      ))}
    </Layer>
  </Layer>
);

/**
 * The color field seen through opacity that rides the first orbit: the mask turns with the
 * orbit, and the inverse turns inside it keep the colors where they are.
 */
const RidingBody = ({ colorCount }: { colorCount: number }) => {
  const { alpha, orbit, reach } = RIDING_BODY;
  return (
    <Layer className='body'>
      <Layer className='flow'>
        <Layer className='orbit' style={orbitStyle(orbit)}>
          <div
            className={`${block}__sway ${block}__sway--mask`}
            style={
              {
                ...swayStyle(orbit),
                '--str-ai-glow-mask': orbitMask(orbit, reach, alpha),
              } as CSSProperties
            }
          >
            <Layer className='unsway' style={swayStyle(orbit)}>
              <Layer className='unorbit' style={orbitStyle(orbit)}>
                <Layer className='unflow'>
                  <ColorField colorCount={colorCount} />
                </Layer>
              </Layer>
            </Layer>
          </div>
        </Layer>
      </Layer>
    </Layer>
  );
};

type Ripple = { id: number; x: number; y: number };

/**
 * VoiceGlow drawn with CSS: the shader's composition, with every gradient painted once and only
 * `transform` and `opacity` animated, so the browser's compositor runs the motion. It keeps
 * moving while the page is busy, needs no canvas or WebGL, and costs no JavaScript per frame
 * unless `audioLevel` is given. Off screen, its animations pause and its script rests.
 *
 * Script sets what the stylesheet cannot know: the palette (read from the theme when `colors`
 * is not given), the playback rate of each animation for the state, and the live audio level.
 */
export const VoiceGlowCss = ({
  audioLevel,
  className,
  colors,
  expressivity,
  onPointerUp,
  state,
  style,
  ...restProps
}: VoiceVisualizationProps) => {
  const label = useVoiceStateLabel(state);
  const reduceMotion = useReducedMotionPreference();
  const rootRef = useRef<HTMLDivElement>(null);
  const bounceRef = useRef<HTMLDivElement>(null);
  const audioLevelRef = useRef(audioLevel);
  const rippleTimers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [onScreen, setOnScreen] = useState(true);
  const { amplitude, speed } = scales(expressivityInput(expressivity));
  const colorsKey = (colors ?? []).join('|');
  const colorCount = Math.min(colors?.length || 1, 5);
  const hasAudioLevel = !!audioLevel;

  useEffect(() => {
    audioLevelRef.current = audioLevel;
  });

  // Off screen, the animations pause (see the stylesheet) and the script below rests.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver !== 'function') return;
    const observer = new IntersectionObserver((entries) =>
      setOnScreen(entries.some((entry) => entry.isIntersecting)),
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  // The palette, from `colors` or the theme, and whether the glow sits on a dark backdrop. Read
  // again about once a second while on screen, so a theme switch is followed without a prop.
  useEffect(() => {
    const root = rootRef.current;
    if (!onScreen || !root || typeof getComputedStyle !== 'function') return;
    const own = toHsvPalette(colorsKey ? colorsKey.split('|') : []);
    let applied = '';
    const apply = () => {
      const theme = readVoiceTheme(root);
      const palette = own.length
        ? own
        : theme.palette.length
          ? theme.palette
          : toHsvPalette([FALLBACK_COLOR]);
      const properties = cssGlowPalette(palette, theme.dark);
      const next = JSON.stringify(properties) + theme.dark;
      if (next === applied) return;
      applied = next;
      for (const [name, value] of Object.entries(properties)) {
        root.style.setProperty(name, value);
      }
      root.setAttribute('data-dark', String(!!theme.dark));
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
  }, [colorsKey, onScreen]);

  // Each state plays the animations at its own rates. Changing a playback rate keeps an
  // animation where it is, where changing its duration would make it jump; a turn and its
  // inverse always get the same rate, so they stay in step.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof root.getAnimations !== 'function') return;
    const rates = CSS_GLOW_RATES[state];
    const slow = reduceMotion ? REDUCED : 1;
    for (const animation of root.getAnimations({ subtree: true })) {
      const kind = cssGlowRateKind((animation as CSSAnimation).animationName ?? '');
      if (kind) animation.updatePlaybackRate(rates[kind] * speed * slow);
    }
    // Masses come and go with the palette, so their animations need rates too.
  }, [colorsKey, reduceMotion, speed, state]);

  // A live audio level, eased like the driver eases it, is the only value written per frame,
  // and only while the glow is on screen.
  useEffect(() => {
    const root = rootRef.current;
    if (
      !hasAudioLevel ||
      !onScreen ||
      !root ||
      typeof requestAnimationFrame !== 'function'
    )
      return;
    let frame = 0;
    let last = 0;
    let level = 0;
    let written = -1;
    let live: boolean | null = null;
    const tick = (now: number) => {
      const target = audioLevelInput(audioLevelRef.current?.());
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      level += ((target ?? 0) - level) * ease(MIC, dt);
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
  }, [hasAudioLevel, onScreen]);

  useEffect(() => {
    const timers = rippleTimers.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  // A tap inside the globe bounces it and sends a ring out from the touch. Nothing is
  // prevented or stopped, so a click handler on the glow or a parent still gets it.
  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    onPointerUp?.(event);
    if (reduceMotion) return;
    const { x, y } = toLocalPoint(event);
    if (!glowContains(x, y)) return;
    const bounce = bounceRef.current;
    if (bounce) {
      bounce.classList.remove(`${block}__bounce--active`);
      // Restarts the bounce when taps come faster than it lasts.
      void bounce.offsetWidth;
      bounce.classList.add(`${block}__bounce--active`);
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const ripple = {
      id: Date.now() + Math.random(),
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    setRipples((current) => [...current, ripple]);
    const timer = setTimeout(() => {
      rippleTimers.current.delete(timer);
      setRipples((current) => current.filter(({ id }) => id !== ripple.id));
    }, RIPPLE_DURATION);
    rippleTimers.current.add(timer);
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
      data-offscreen={onScreen ? undefined : 'true'}
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
                      <ColorField colorCount={colorCount} />
                    </div>
                    <RidingBody colorCount={colorCount} />
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
