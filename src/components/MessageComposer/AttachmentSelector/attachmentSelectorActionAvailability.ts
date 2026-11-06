import type { ChannelConfig, MessageComposer } from 'stream-chat';
import type { AttachmentSelectorAction } from './AttachmentSelector';

/**
 * What the attachment selector reads to decide which actions to offer. The selector re-renders
 * when any of these values change.
 */
export type AttachmentSelectorActionAvailabilityContext = {
  /** The composer's resolved `attachments.enabled`. */
  attachmentsEnabled: boolean;
  /** Commands of the channel type (`channel.configState`). */
  availableCommands: ChannelConfig['availableCommands'];
  /** The current user's `own_capabilities` in the channel. */
  channelCapabilities: Set<string>;
  /** The composer's `attachments.customCdn`: files are stored outside Stream. */
  customCdn: boolean;
  /** The composer's resolved `location.enabled`. */
  locationEnabled: boolean;
  /** The composer the selector adds attachments to. */
  messageComposer: MessageComposer;
  /** The composer's resolved `polls.enabled`. */
  pollsEnabled: boolean;
};

/** Decides whether an action of one of the built-in types is offered. */
type AttachmentSelectorActionAvailabilityRule = (
  context: AttachmentSelectorActionAvailabilityContext,
) => boolean;

/**
 * Files can be uploaded: attachments are enabled, and the user has `upload-file` unless the files
 * are stored outside Stream. This is `attachmentManager.isUploadEnabled` without its free-slot
 * condition, so the file limit disables the file buttons instead of hiding them.
 */
export const canUploadFiles: AttachmentSelectorActionAvailabilityRule = ({
  attachmentsEnabled,
  channelCapabilities,
  customCdn,
}) => attachmentsEnabled && (customCdn || channelCapabilities.has('upload-file'));

/** A poll can be created: polls are enabled, the user may send one, and it is not a thread reply. */
const canCreatePoll: AttachmentSelectorActionAvailabilityRule = ({
  channelCapabilities,
  messageComposer,
  pollsEnabled,
}) => pollsEnabled && channelCapabilities.has('send-poll') && !messageComposer.threadId;

/** A location can be shared: location sharing is enabled and it is not a thread reply. */
const canShareLocation: AttachmentSelectorActionAvailabilityRule = ({
  locationEnabled,
  messageComposer,
}) => locationEnabled && !messageComposer.threadId;

/** Commands can be selected: the channel type defines at least one named command. */
const hasNamedCommands: AttachmentSelectorActionAvailabilityRule = ({
  availableCommands,
}) => availableCommands.some((command) => !!command.name);

/** The rule for each built-in action type. */
const ruleByBuiltInActionType = new Map<
  AttachmentSelectorAction['type'],
  AttachmentSelectorActionAvailabilityRule
>([
  ['addLocation', canShareLocation],
  ['createPoll', canCreatePoll],
  ['selectCommand', hasNamedCommands],
  ['uploadFile', canUploadFiles],
]);

/**
 * Whether the selector offers an action: by the rule for its built-in type. An action of any
 * other type is always offered.
 */
export const isAttachmentSelectorActionAvailable = (
  { type }: AttachmentSelectorAction,
  context: AttachmentSelectorActionAvailabilityContext,
) => ruleByBuiltInActionType.get(type)?.(context) ?? true;
