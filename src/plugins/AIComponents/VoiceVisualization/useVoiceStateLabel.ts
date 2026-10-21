import { useTranslationContext } from '../../../context/TranslationContext';
import type { VoiceAgentState } from './types';

/** The accessible name of a voice visualization: "Voice agent" and what it is doing. */
export const useVoiceStateLabel = (state: VoiceAgentState) => {
  const { t } = useTranslationContext();
  const labels: Record<VoiceAgentState, string> = {
    connecting: t('Connecting'),
    idle: t('Ready'),
    listening: t('Listening'),
    speaking: t('Speaking'),
    thinking: t('Thinking'),
  };
  return t('aria/Voice agent: {{ state }}', { state: labels[state] });
};
