import React from 'react';
import { render, screen } from '@testing-library/react';

import { axe } from '../../../../axe-helper';
import { generateVoiceRecordingAttachment } from '../../../mock-builders';
import { VoiceRecordingTranscript } from '../VoiceRecordingTranscript';

const TRANSCRIPT_TEST_ID = 'voice-recording-transcript';
const TRANSCRIPT_TEXT = 'Running ten minutes late, start without me.';

describe('VoiceRecordingTranscript', () => {
  it('renders the title and the transcript text', () => {
    render(
      <VoiceRecordingTranscript
        attachment={generateVoiceRecordingAttachment({
          voice_transcript: { languages: [{ code: 'en' }], text: TRANSCRIPT_TEXT },
        })}
      />,
    );

    expect(screen.getByTestId(TRANSCRIPT_TEST_ID)).toBeInTheDocument();
    expect(screen.getByText('Transcript')).toBeInTheDocument();
    expect(screen.getByText(TRANSCRIPT_TEXT)).toBeInTheDocument();
  });

  it('renders nothing before the recording is transcribed', () => {
    const { container } = render(
      <VoiceRecordingTranscript attachment={generateVoiceRecordingAttachment()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the transcription failed', () => {
    const { container } = render(
      <VoiceRecordingTranscript
        attachment={generateVoiceRecordingAttachment({
          voice_transcript: { error: 'unsupported_format' },
        })}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the recording has no speech', () => {
    const { container } = render(
      <VoiceRecordingTranscript
        attachment={generateVoiceRecordingAttachment({ voice_transcript: {} })}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <VoiceRecordingTranscript
        attachment={generateVoiceRecordingAttachment({
          voice_transcript: { text: TRANSCRIPT_TEXT },
        })}
      />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
