import type { AIUIActionJSON } from '../plugins/AIComponents/GenerativeUI/AIUIAction';
import type { AIUIDocumentJSON } from '../plugins/AIComponents/GenerativeUI/AIUIDocument';

/* eslint-disable @typescript-eslint/no-empty-object-type */
export interface DefaultChannelData {
  image?: string;
  name?: string;
  subtitle?: string;
  team?: string;
}

export interface DefaultAttachmentData {}

export interface DefaultCommandData {}

export interface DefaultEventData {}

export interface DefaultMemberData {}

export interface DefaultMessageData {
  /** The UI an agent wrote for its reply, which `AIConversation` shows in place of its text. */
  ai_ui?: AIUIDocumentJSON;
  /** What the person did in a reply's UI, on the message that tells the agent. */
  ai_ui_action?: AIUIActionJSON;
}

export interface DefaultPollOptionData {}

export interface DefaultPollData {}

export interface DefaultReactionData {}

export interface DefaultUserData {}

export interface DefaultThreadData {}

export interface DefaultMessageComposerData {}
