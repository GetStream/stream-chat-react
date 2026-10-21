import { useCallback, useEffect, useRef } from 'react';

/** Below this RMS the signal is treated as room noise. */
const NOISE_FLOOR = 0.01;
/** Maps the RMS of speech at a normal distance (about 0.05 to 0.2) across most of 0 to 1. */
const GAIN = 5;

type AudioContextConstructor = new () => AudioContext;

const getAudioContext = (): AudioContextConstructor | undefined => {
  if (typeof window === 'undefined') return undefined;
  return (
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: AudioContextConstructor })
      .webkitAudioContext
  );
};

/** The RMS of a block of 8-bit time-domain samples centred on 128, from 0 to 1. */
export const rootMeanSquare = (samples: Uint8Array) => {
  if (!samples.length) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    const value = (samples[i] - 128) / 128;
    sum += value * value;
  }
  return Math.sqrt(sum / samples.length);
};

/** An RMS as a level from 0 to 1, with room noise cut and speech spread across the range. */
export const levelFromRms = (rms: number) =>
  Math.min(Math.max((rms - NOISE_FLOOR) * GAIN, 0), 1);

/**
 * Reads the live level of a `MediaStream`'s audio, such as a microphone from
 * `getUserMedia({ audio: true })` or a remote participant's track, for `VoiceWave` and
 * `VoiceGlow`'s `audioLevel`.
 *
 * Returns a stable getter that measures the level when called, from 0 to 1, so a visualization
 * reading it once a frame re-renders nothing. It returns `null` while there is no stream or the
 * browser has no Web Audio, which lets the visualization animate speech on its own.
 *
 * The audio graph is torn down when the stream changes and on unmount; the stream's tracks are
 * left running, since they belong to the caller.
 */
export const useAudioLevel = (stream: MediaStream | null | undefined) => {
  const analyserRef = useRef<{
    analyser: AnalyserNode;
    samples: Uint8Array<ArrayBuffer>;
  } | null>(null);

  useEffect(() => {
    const AudioContextClass = getAudioContext();
    if (!stream || !AudioContextClass || !stream.getAudioTracks().length) return;

    const context = new AudioContextClass();
    const source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    // About 43 ms at 48 kHz: a few pitch periods of a voice, so the level holds steady on a vowel
    // instead of jittering with each period, as a shorter window would.
    analyser.fftSize = 2048;
    source.connect(analyser);
    analyserRef.current = { analyser, samples: new Uint8Array(analyser.fftSize) };
    // A context made outside a user gesture can start suspended.
    if (context.state === 'suspended') context.resume?.().catch(() => undefined);

    return () => {
      analyserRef.current = null;
      source.disconnect();
      analyser.disconnect();
      if (context.state !== 'closed') context.close().catch(() => undefined);
    };
  }, [stream]);

  return useCallback((): number | null => {
    const current = analyserRef.current;
    if (!current) return null;
    current.analyser.getByteTimeDomainData(current.samples);
    return levelFromRms(rootMeanSquare(current.samples));
  }, []);
};
