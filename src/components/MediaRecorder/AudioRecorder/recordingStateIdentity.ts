import { MediaRecordingState } from '../classes';

export const isPaused = (recordingState?: MediaRecordingState) =>
  recordingState === MediaRecordingState.PAUSED;
export const isStopped = (recordingState?: MediaRecordingState) =>
  recordingState === MediaRecordingState.STOPPED;
export const isRecording = (recordingState?: MediaRecordingState) =>
  recordingState === MediaRecordingState.RECORDING;
