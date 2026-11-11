import clsx from 'clsx';

import { createWaveRenderer, waveContains } from './renderers/waveRenderer';
import type { VoiceVisualizationProps } from './types';
import { VoiceVisualizationView } from './VoiceVisualizationView';

const createRenderer = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d');
  return ctx ? createWaveRenderer(ctx) : null;
};

export type VoiceWaveProps = VoiceVisualizationProps;

/**
 * A voice agent as a single string, flat at its ends, carrying a wave packet that erupts with
 * speech while its colors flow along it. Tapping the string ripples it from the touch, and so
 * does a hovering mouse or pen.
 *
 * It has no size of its own and draws in the middle of the box it is given, about 80% as wide as
 * its shorter side, so give it a square or a wide box.
 */
export const VoiceWave = ({ className, ...props }: VoiceWaveProps) => (
  <VoiceVisualizationView
    className={clsx('str-chat__ai-voice-wave', className)}
    contains={waveContains}
    createRenderer={createRenderer}
    // The thin line stays crisp at the screen's own density, up to 3x as on iOS.
    maxPixelRatio={3}
    rendererKey='wave'
    {...props}
  />
);
