import { useTranslationContext } from '../../../context/TranslationContext';
import type { VoiceAgentState } from './types';

/** The accessible name of a voice visualization: "Voice agent" and what it is doing. */
export const useVoiceStateLabel = (state: VoiceAgentState) => {
  const { t } = useTranslationContext();
  const labels: Record<VoiceAgentState, string> = {
    connecting: t('aiComponents.voiceVisualization.connecting.text', 'Connecting'),
    idle: t('aiComponents.voiceVisualization.ready.text', 'Ready'),
    listening: t('aiComponents.voiceVisualization.listening.text', 'Listening'),
    speaking: t('aiComponents.voiceVisualization.speaking.text', 'Speaking'),
    thinking: t('aiComponents.voiceVisualization.thinking.text', 'Thinking'),
  };
  return t(
    'aiComponents.voiceVisualization.voiceAgent.ariaLabel',
    'Voice agent: {{ state }}',
    { state: labels[state] },
  );
};
