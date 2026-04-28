import type { TFunction } from 'i18next';
import { formatTime } from './formatTime';

type GetAudioTrackSliderAriaValueTextParams = {
  durationSeconds?: number;
  progress: number;
  secondsElapsed?: number;
  t: TFunction;
};

export const getAudioTrackSliderAriaValueText = ({
  durationSeconds,
  progress,
  secondsElapsed,
  t,
}: GetAudioTrackSliderAriaValueTextParams) => {
  const normalizedProgress = Math.max(0, Math.min(100, progress));

  if (typeof durationSeconds === 'number' && Number.isFinite(durationSeconds)) {
    const normalizedDuration = Math.max(0, durationSeconds);
    const elapsed =
      typeof secondsElapsed === 'number' && Number.isFinite(secondsElapsed)
        ? Math.max(0, Math.min(secondsElapsed, normalizedDuration))
        : (normalizedDuration * normalizedProgress) / 100;
    const formattedElapsed = formatTime(elapsed, 'floor');
    const formattedDuration = formatTime(normalizedDuration, 'floor');

    if (formattedElapsed && formattedDuration) {
      return t('aria/Audio position {{ elapsed }} of {{ duration }}', {
        duration: formattedDuration,
        elapsed: formattedElapsed,
      });
    }
  }

  return t('aria/Audio position {{ progress }} percent', {
    progress: Math.round(normalizedProgress),
  });
};
