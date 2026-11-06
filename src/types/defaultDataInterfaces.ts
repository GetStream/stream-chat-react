/* eslint-disable @typescript-eslint/no-empty-object-type */
/** The fields of `channel.data.custom` that the SDK renders a channel's name and image from. */
export interface DefaultChannelData {
  image?: string;
  name?: string;
}

export interface DefaultAttachmentData {}

export interface DefaultEventData {}

export interface DefaultMemberData {}

export interface DefaultMessageData {}

export interface DefaultPollOptionData {}

export interface DefaultPollData {}

export interface DefaultReactionData {}

export interface DefaultUserData {}

export interface DefaultThreadData {}

export interface DefaultMessageComposerData {}

// Merges the Default*Data interfaces into stream-chat's custom-data interfaces. This module ships
// as a declaration file reachable from the package entry, so the merge reaches every app that
// imports stream-chat-react; an app's own augmentation of the same interfaces adds to it.
declare module 'stream-chat' {
  interface CustomChannelData extends DefaultChannelData {}

  interface CustomAttachmentData extends DefaultAttachmentData {}

  interface CustomEventData extends DefaultEventData {}

  interface CustomMemberData extends DefaultMemberData {}

  interface CustomMessageData extends DefaultMessageData {}

  interface CustomPollOptionData extends DefaultPollOptionData {}

  interface CustomPollData extends DefaultPollData {}

  interface CustomReactionData extends DefaultReactionData {}

  interface CustomUserData extends DefaultUserData {}

  interface CustomThreadData extends DefaultThreadData {}

  interface CustomMessageComposerData extends DefaultMessageComposerData {}
}
