export const formatTime = (
  totalSeconds?: number,
  rounding: 'ceil' | 'floor' = 'ceil',
) => {
  if (totalSeconds == null || Number.isNaN(totalSeconds) || totalSeconds < 0) {
    return null;
  }

  const roundedSeconds =
    rounding === 'floor' ? Math.floor(totalSeconds) : Math.ceil(totalSeconds);
  const hours = Math.floor(roundedSeconds / 3600);
  const minutes = Math.floor((roundedSeconds % 3600) / 60);
  const seconds = roundedSeconds % 60;
  const minSec = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
    2,
    '0',
  )}`;

  return hours ? `${String(hours).padStart(2, '0')}:${minSec}` : minSec;
};
