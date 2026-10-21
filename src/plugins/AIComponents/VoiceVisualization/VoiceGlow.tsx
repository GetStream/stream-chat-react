import { useCallback, useState } from 'react';
import clsx from 'clsx';

import { glowContains } from './glowShape';
import { createGlowWebGLRenderer } from './renderers/glowWebGLRenderer';
import type { VoiceGlowRendering, VoiceVisualizationProps } from './types';
import { VoiceGlowCss } from './VoiceGlowCss';
import { VoiceVisualizationView } from './VoiceVisualizationView';

export type VoiceGlowProps = VoiceVisualizationProps & {
  /** How the glow is drawn. See `VoiceGlowRendering`. Defaults to `auto`. */
  rendering?: VoiceGlowRendering;
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
  // Set when WebGL cannot start or its context is lost; the CSS glow takes over from then on.
  const [webGLFailed, setWebGLFailed] = useState(false);

  const createRenderer = useCallback((canvas: HTMLCanvasElement) => {
    const renderer = createGlowWebGLRenderer(canvas, () => setWebGLFailed(true));
    if (!renderer) setWebGLFailed(true);
    return renderer;
  }, []);

  if (rendering === 'css' || webGLFailed) {
    // Standing in for WebGL, the GPU is likely off and the compositor works on the CPU, so the
    // fallback draws fewer layers than a glow asked to be CSS.
    return <VoiceGlowCss className={className} lite={rendering !== 'css'} {...props} />;
  }

  return (
    <VoiceVisualizationView
      className={clsx('str-chat__ai-voice-glow', className)}
      contains={glowContains}
      createRenderer={createRenderer}
      data-rendering='webgl'
      // The glow is all soft gradients: drawn at 1x it looks the same as at 2x, with a quarter
      // of the pixels to fill every frame.
      maxPixelRatio={1}
      rendererKey='webgl'
      {...props}
    />
  );
};
