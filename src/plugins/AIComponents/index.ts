// The public API of `stream-chat-react/ai-components`, named one by one, so what the package
// exports is a choice rather than whatever a module happens to export.

export {
  AIMarkdown,
  type AIMarkdownProps,
  type ToolComponentProps,
} from './AIMarkdown/AIMarkdown';
export {
  AIMessageComposer,
  type AIMessageComposerLayout,
} from './AIMessageComposer/AIMessageComposer';
export {
  useAIMessageComposerContext,
  useAttachments,
  useIsDisabled,
  useText,
} from './AIMessageComposer/composerState';
export {
  type AIChatOption,
  ChatOptionsList,
  type ChatOptionsListProps,
  type ChatOptionsProps,
  SelectedChatOptionChip,
  type SelectedChatOptionChipProps,
} from './AIMessageComposer/ChatOptions';
export {
  useSpeechToText,
  type UseSpeechToTextOptions,
} from './AIMessageComposer/hooks/useSpeechToText';
export {
  type AIMessageComposerStore,
  createAIMessageComposerStore,
} from './AIMessageComposer/store';
export {
  AIStateIndicator,
  AIThinkingIndicator,
} from './AIStateIndicator/AIStateIndicator';
export {
  AIConversation,
  type AIConversationAssistantMessageProps,
  type AIConversationProps,
  type AIConversationReplyActionsProps,
  type AIConversationUserMessageProps,
  type AIUserMessageActions,
} from './Conversation/AIConversation';
export {
  AI_AGENT_ERROR_MESSAGE,
  AIAgentError,
} from './Conversation/controller/AIAgentError';
export {
  AIConversationController,
  type AIConversationControllerOptions,
  type AIConversationControllerState,
  type AIConversationSendData,
} from './Conversation/controller/AIConversationController';
export {
  type AIAgentActivity,
  type AIAgentActivityState,
  AIAgentActivityStates,
  type AIConversationActions,
  type AIConversationFeed,
  type AIConversationRequest,
  type AIConversationRequestKind,
  type AIConversationStatus,
  type AIConversationTransport,
  isAIConversationAnswering,
} from './Conversation/controller/types';
export { useAIConversationState } from './Conversation/controller/useAIConversationState';
export {
  type AIConversationCanShowUI,
  type AIConversationEntry,
  type AIConversationTurn,
} from './Conversation/entries';
export {
  fromStreamMessage,
  type FromStreamMessageOptions,
} from './Conversation/fromStreamMessage';
export {
  type AIMessage,
  type AIMessageBranch,
  type AIMessageRole,
  type AIPendingMessage,
} from './Conversation/types';
export {
  AI_UI_ACTION_CUSTOM_DATA_KEY,
  AI_UI_ACTION_MAX_BYTES,
  type AIUIAction,
  aiUIActionJSON,
  type AIUIActionJSON,
  aiUIActionProblem,
} from './GenerativeUI/AIUIAction';
export { decodeAIUIArguments } from './GenerativeUI/AIUIArguments';
export {
  type AIUIComponent,
  type AIUIComponentContext,
  type AIUIComponentProps,
  AIUIComponentView,
  defineAIUIComponent,
} from './GenerativeUI/AIUIComponent';
export {
  type AIUIComponentDefinition,
  aiUIComponentDefinitionJSON,
  type AIUIComponentEvent,
  type AIUIJSONSchema,
  type AIUIParameter,
  AIUIParameterType,
  optionalAIUIParameter,
  parseAIUIComponentDefinition,
  requiredAIUIParameter,
} from './GenerativeUI/AIUIComponentDefinition';
export {
  AI_UI_CUSTOM_DATA_KEY,
  AI_UI_SUPPORTED_VERSION,
  type AIUIDocument,
  type AIUIDocumentJSON,
  aiUIDocumentText,
  type AIUIFormat,
  parseAIUIDocument,
} from './GenerativeUI/AIUIDocument';
export {
  AIUICascade,
  AIUIEntrance,
  AIUIEntranceStage,
  useAIUIEntrance,
} from './GenerativeUI/AIUIEntrance';
export {
  AIUIHost,
  type AIUIHostOptions,
  type AIUIHostState,
  isWebOrEmailLink,
} from './GenerativeUI/AIUIHost';
export {
  aiUIMediaSource,
  type AIUIMediaURL,
  aiUIPublicMediaURL,
  isPublicWebURL,
} from './GenerativeUI/AIUIMedia';
export { type AIUIEngine, type AIUIRenderer } from './GenerativeUI/AIUIRenderer';
export {
  AIUIRuntimeLoader,
  AIUIRuntimeView,
  type AIUIRuntimeViewProps,
} from './GenerativeUI/AIUIRuntimeLoader';
export {
  type AIUIClientTool,
  type AIUIClientToolDefinition,
  aiUIClientToolJSON,
  AIUIToolError,
  isPersonActing,
} from './GenerativeUI/AIUITools';
export {
  AIUIView,
  type AIUIViewProps,
  useAIUIHostRefresh,
} from './GenerativeUI/AIUIView';
export {
  AIAssistantMessage,
  type AIAssistantMessageProps,
} from './Message/AIAssistantMessage';
export {
  type AIBranchSwitch,
  AIBranchSwitcher,
  type AIBranchSwitcherProps,
} from './Message/AIBranchSwitcher';
export {
  AIMessageAttachment,
  type AIMessageAttachmentData,
  type AIMessageAttachmentProps,
} from './Message/AIMessageAttachment';
export {
  type AIMessageRating,
  AIReplyActions,
  type AIReplyActionsProps,
} from './Message/AIReplyActions';
export {
  AITypingIndicator,
  type AITypingIndicatorProps,
} from './Message/AITypingIndicator';
export { AIUserMessage, type AIUserMessageProps } from './Message/AIUserMessage';
export {
  AIMessagePart,
  type AIMessagePartProps,
  AIMessageParts,
  type AIMessagePartsProps,
} from './MessageParts/AIMessageParts';
export {
  AIToolApproval,
  AIToolApprovalCard,
  type AIToolApprovalCardProps,
  type AIToolApprovalProps,
  type AIToolApprovalState,
  AIToolArguments,
  type AIToolArgumentsProps,
} from './MessageParts/AIToolApproval';
export {
  AIToolAuthorization,
  AIToolAuthorizationCard,
  type AIToolAuthorizationCardProps,
  type AIToolAuthorizationProps,
  type AIToolAuthorizationState,
} from './MessageParts/AIToolAuthorization';
export { AIToolCall, type AIToolCallProps } from './MessageParts/AIToolCall';
export {
  isAuthorizationExpired,
  isAwaitingApproval,
  isAwaitingAuthorization,
  isAwaitingClient,
  isDeclined,
  isSupportedPart,
  isToolCallFinished,
  parseMessagePart,
  parseMessageParts,
} from './MessageParts/parseMessageParts';
export {
  type AIMessagePartData,
  type AIMessagePartKind,
  type AIReasoningPart,
  type AIReasoningStatus,
  type AIToolApprovalData,
  type AIToolApprovalDecision,
  type AIToolAuthorizationData,
  type AIToolAuthorizationStatus,
  type AIToolAuthorizationType,
  type AIToolCallPart,
  type AIToolCallStatus,
  type AIToolExecutor,
} from './MessageParts/types';
export {
  AIReasoning,
  type AIReasoningProps,
  AIThinking,
  type AIThinkingProps,
} from './Reasoning/AIReasoning';
export {
  StreamingMessage,
  type StreamingMessagePaceProps,
  type StreamingMessageProps,
  type StreamingMessageRef,
  type UseMessageTextStreamingProps,
} from './StreamingMessage/StreamingMessage';
export { AISuggestions, type AISuggestionsProps } from './Suggestions/AISuggestions';
export { AIClientIdentity } from './ToolCalls/AIClientIdentity';
export {
  type AIToolApprover,
  AIToolApproverProvider,
  type AIToolAuthorizer,
  useAIToolApprover,
} from './ToolCalls/AIToolApprover';
export {
  AIConnectorSignInError,
  completeConnectorSignIn,
  type CompleteConnectorSignInOptions,
  type ConnectorSignInResult,
  type ConnectorSignInStatus,
  createPopupAuthorizer,
  type PopupAuthorizer,
  type PopupAuthorizerOptions,
  readConnectorSignInResult,
} from './ToolCalls/popupAuthorizer';
export { VoiceGlow, type VoiceGlowProps } from './VoiceVisualization/VoiceGlow';
export { VoiceWave, type VoiceWaveProps } from './VoiceVisualization/VoiceWave';
export {
  type VoiceAgentState,
  type VoiceGlowRendering,
  type VoiceVisualizationProps,
} from './VoiceVisualization/types';
export { useAudioLevel } from './VoiceVisualization/useAudioLevel';
export {
  type HeardTextFunction,
  type HeardTextProgress,
  type HeardTextSubscribe,
  useHeardText,
  type UseHeardTextParams,
  type UseHeardTextResult,
} from './hooks/useHeardText';
export {
  IconAIDevice,
  IconAIHandRaised,
  IconAIKey,
  IconAIReasoning,
  IconAIShare,
  IconAIThumbsDown,
  IconAIThumbsDownFill,
  IconAIThumbsUp,
  IconAIThumbsUpFill,
} from './icons';
export { ThemeScopeProvider } from './themeScope';
export { type AIIconName, type AIIconSlots, useAIIcons } from './useAIIcons';
