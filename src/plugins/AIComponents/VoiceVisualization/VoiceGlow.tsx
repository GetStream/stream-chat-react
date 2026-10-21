import { useCallback, useState } from 'react';
import clsx from 'clsx';

import { createGlowCanvasRenderer, glowContains } from './renderers/glowCanvasRenderer';
import { createGlowWebGLRenderer } from './renderers/glowWebGLRenderer';
import type { VoiceGlowRendering, VoiceVisualizationProps } from './types';
import { VoiceVisualizationView } from './VoiceVisualizationView';

export type VoiceGlowProps = VoiceVisualizationProps & {
  /** How the glow is drawn. See `VoiceGlowRendering`. Defaults to `auto`. */
  rendering?: VoiceGlowRendering;
};

/** Whether `rendering` tries WebGL first; any WebGL failure still falls back to Canvas. */
export const usesWebGL = (rendering: VoiceGlowRendering) => rendering !== 'canvas';

const createCanvasRenderer = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d');
  return ctx ? createGlowCanvasRenderer(ctx) : null;
};

/**
 * A voice agent as a soft, airy globe: color masses orbit inside it and swell with speech, and
 * the gaps between them let the background show through. Tapping the globe bounces it; drawn
 * with WebGL, it also ripples from the touch and under a hovering mouse or pen.
 *
 * It has no size of its own and draws in the middle of the box it is given, about half as wide
 * as its shorter side, so give it a square.
 */
export const VoiceGlow = ({
  className,
  rendering = 'auto',
  ...props
}: VoiceGlowProps) => {
  // A canvas that has had a WebGL context can never give a 2D one, so falling back remounts it.
  const [webGLFailed, setWebGLFailed] = useState(false);
  const webGL = usesWebGL(rendering) && !webGLFailed;

  const createRenderer = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (!webGL) return createCanvasRenderer(canvas);
      const renderer = createGlowWebGLRenderer(canvas, () => setWebGLFailed(true));
      if (!renderer) setWebGLFailed(true);
      return renderer;
    },
    [webGL],
  );

  return (
    <VoiceVisualizationView
      className={clsx('str-chat__ai-voice-glow', className)}
      contains={glowContains}
      createRenderer={createRenderer}
      data-rendering={webGL ? 'webgl' : 'canvas'}
      // The glow is all soft gradients: drawn at 1x it looks the same as at 2x, with a quarter
      // of the pixels to fill every frame.
      maxPixelRatio={1}
      rendererKey={webGL ? 'webgl' : 'canvas'}
      {...props}
    />
  );
};
