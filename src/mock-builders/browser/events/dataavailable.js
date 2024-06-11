export const generateDataavailableEvent = (
  { dataOverrides, mediaRecorder } = {
    dataOverrides: {},
    mediaRecorder: new window.MediaRecorder(),
  },
) => ({
  bubbles: false,
  cancelable: false,
  cancelBubble: false,
  composed: false,
  currentTarget: mediaRecorder,
  data: new Blob([0x48], { type: 'audio/webm' }),
  defaultPrevented: false,
  eventPhase: 0,
  isTrusted: true,
  returnValue: true,
  srcElement: mediaRecorder,
  target: mediaRecorder,
  timecode: 1713214079256.997,
  timeStamp: 11853.20000000298,
  type: 'dataavailable',
  ...dataOverrides,
});
