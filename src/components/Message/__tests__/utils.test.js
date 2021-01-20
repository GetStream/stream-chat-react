import { generateReaction, generateMessage, generateUser } from 'mock-builders';
import {
  areMessagePropsEqual,
  getMessageActions,
  MESSAGE_ACTIONS,
  isUserMuted,
  validateAndGetMessage,
  shouldMessageComponentUpdate,
  messageHasAttachments,
  messageHasReactions,
  getImages,
  getNonImageAttachments,
} from '../utils';

const alice = generateUser({ name: 'alice' });
const bob = generateUser({ name: 'bob' });

describe('Message utils', () => {
  describe('validateAndGetMessage function', () => {
    it('should return null if called without a function as the first parameter', () => {
      const result = validateAndGetMessage({}, 'Message');
      expect(result).toBeNull();
    });

    it('should return null if result of function call is not a string', () => {
      const fn = () => null;
      const result = validateAndGetMessage(fn, 'something');
      expect(result).toBeNull();
    });

    it('should return the result of the function call when it is a string', () => {
      const fn = (msg) => msg;
      const message = 'message';
      const result = validateAndGetMessage(fn, [message]);
      expect(result).toBe(message);
    });
  });

  describe('isUserMuted function', () => {
    it('should return false if message is not defined', () => {
      const mutes = [
        {
          user: alice,
          target: bob,
          created_at: new Date('2019-03-30T13:24:10'),
        },
      ];
      const result = isUserMuted(undefined, mutes);
      expect(result).toBe(false);
    });

    it('should return false if mutes is not defined', () => {
      const message = generateMessage();
      const result = isUserMuted(message, undefined);
      expect(result).toBe(false);
    });

    it('should return true if user was muted', () => {
      const mutes = [
        {
          user: alice,
          target: bob,
          created_at: new Date('2019-03-30T13:24:10'),
        },
      ];
      const message = generateMessage({ user: bob });
      const result = isUserMuted(message, mutes);
      expect(result).toBe(true);
    });
  });

  describe('getMessageActions', () => {
    const defaultCapabilities = {
      canDelete: true,
      canEdit: true,
      canFlag: true,
      canMute: true,
      canPin: true,
      canReply: true,
      canReact: true,
    };
    const actions = Object.values(MESSAGE_ACTIONS);

    it.each([
      ['empty', []],
      ['false', false],
    ])(
      'should return no message actions if message actions are %s',
      (_, actionsValue) => {
        const messageActions = actionsValue;
        const result = getMessageActions(messageActions, defaultCapabilities);
        expect(result).toStrictEqual([]);
      },
    );

    it('should return all message actions if actions are set to true', () => {
      const result = getMessageActions(true, defaultCapabilities);
      expect(result).toStrictEqual(actions);
    });

    it.each([
      ['allow', 'edit', 'canEdit', true],
      ['not allow', 'edit', 'canEdit', false],
      ['allow', 'delete', 'canDelete', true],
      ['not allow', 'delete', 'canDelete', false],
      ['allow', 'flag', 'canFlag', true],
      ['not allow', 'flag', 'canFlag', false],
      ['allow', 'mute', 'canMute', true],
      ['not allow', 'mute', 'canMute', false],
    ])(
      'it should %s %s when %s is %s',
      (_, action, capabilityKey, capabilityValue) => {
        const capabilities = {
          [capabilityKey]: capabilityValue,
        };
        const result = getMessageActions(actions, capabilities);
        if (capabilityValue) {
          expect(result).toContain(action);
        } else {
          expect(result).not.toContain(action);
        }
      },
    );
  });

  describe('shouldMessageComponentUpdate', () => {
    it('should not update if rendered with the same message props', () => {
      const message = generateMessage();
      const currentProps = { message };
      const nextProps = { message };
      const shouldUpdate = shouldMessageComponentUpdate(
        nextProps,
        currentProps,
      );
      expect(shouldUpdate).toBe(false);
    });

    it('should update if rendered with a different message', () => {
      const message1 = generateMessage({ id: 'message-1' });
      const message2 = generateMessage({ id: 'message-2' });
      const currentProps = { message: message1 };
      const nextProps = { message: message2 };
      const shouldUpdate = shouldMessageComponentUpdate(
        nextProps,
        currentProps,
      );
      expect(shouldUpdate).toBe(true);
    });

    it('should update if rendered with a different message is read by other users', () => {
      const message = generateMessage();
      const currentReadBy = [alice];
      const currentProps = { message, readBy: currentReadBy };
      const nextReadBy = [alice, bob];
      const nextProps = { message, readBy: nextReadBy };
      const arePropsEqual = areMessagePropsEqual(nextProps, currentProps);
      const shouldUpdate = shouldMessageComponentUpdate(
        nextProps,
        currentProps,
      );
      expect(arePropsEqual).toBe(false);
      expect(shouldUpdate).toBe(true);
    });

    it('should update if rendered with different groupStyles', () => {
      const message = generateMessage();
      const currentGroupStyles = ['top'];
      const currentProps = { message, groupStyles: currentGroupStyles };
      const nextGroupStyles = ['bottom', 'right'];
      const nextProps = { message, groupStyles: nextGroupStyles };
      const arePropsEqual = areMessagePropsEqual(nextProps, currentProps);
      const shouldUpdate = shouldMessageComponentUpdate(
        nextProps,
        currentProps,
      );
      expect(arePropsEqual).toBe(false);
      expect(shouldUpdate).toBe(true);
    });

    it('should update if last received message in the channel changes', () => {
      const message = generateMessage();
      const currentLastReceivedId = 'some-message';
      const currentProps = { message, lastReceivedId: currentLastReceivedId };
      const nextLastReceivedId = 'some-other-message';
      const nextProps = { message, lastReceivedId: nextLastReceivedId };
      const arePropsEqual = areMessagePropsEqual(nextProps, currentProps);
      const shouldUpdate = shouldMessageComponentUpdate(
        nextProps,
        currentProps,
      );
      expect(arePropsEqual).toBe(false);
      expect(shouldUpdate).toBe(true);
    });

    it('should update if editing state changes', () => {
      const message = generateMessage();
      const currentEditing = true;
      const currentProps = { message, editing: currentEditing };
      const nextEditing = false;
      const nextProps = { message, editing: nextEditing };
      const arePropsEqual = areMessagePropsEqual(nextProps, currentProps);
      const shouldUpdate = shouldMessageComponentUpdate(
        nextProps,
        currentProps,
      );
      expect(arePropsEqual).toBe(false);
      expect(shouldUpdate).toBe(true);
    });

    it('should update if wrapper layout changes', () => {
      const message = generateMessage();
      const currentMessageListRect = { x: 0, y: 0, width: 100, height: 100 };
      const currentProps = { message, messageListRect: currentMessageListRect };
      const nextMessageListRect = { x: 20, y: 20, width: 200, height: 200 };
      const nextProps = { message, messageListRect: nextMessageListRect };
      const arePropsEqual = areMessagePropsEqual(nextProps, currentProps);
      const shouldUpdate = shouldMessageComponentUpdate(
        nextProps,
        currentProps,
      );
      expect(arePropsEqual).toBe(false);
      expect(shouldUpdate).toBe(true);
    });
  });

  describe('messageHasReactions', () => {
    it('should return false if message is undefined', () => {
      expect(messageHasReactions(undefined)).toBe(false);
    });
    it('should return false if message has no reactions', () => {
      const message = generateMessage({
        latest_reactions: [],
      });
      expect(messageHasReactions(message)).toBe(false);
    });
    it('should return true if message has reactions', () => {
      const message = generateMessage({
        latest_reactions: [generateReaction()],
      });
      expect(messageHasReactions(message)).toBe(true);
    });
  });

  describe('messageHasAttachments', () => {
    it('should return false if message is undefined', () => {
      expect(messageHasAttachments(undefined)).toBe(false);
    });
    it('should return false if message has no attachments', () => {
      const message = generateMessage({
        attachments: [],
      });
      expect(messageHasAttachments(message)).toBe(false);
    });
    it('should return true if message has attachments', () => {
      const attachment = {
        type: 'file',
        asset_url: 'file.pdf',
      };
      const message = generateMessage({
        attachments: [attachment],
      });
      expect(messageHasAttachments(message)).toBe(true);
    });
  });

  describe('getImages', () => {
    it('should return empty if message is undefined', () => {
      expect(getImages(undefined)).toStrictEqual([]);
    });
    it('should return empty if message has no image attachments', () => {
      const pdf = {
        type: 'file',
        asset_url: 'file.pdf',
      };
      const message = generateMessage({
        attachments: [pdf],
      });
      expect(getImages(message)).toStrictEqual([]);
    });
    it('should return just the image attachments when message has them', () => {
      const pdf = {
        type: 'file',
        asset_url: 'file.pdf',
      };
      const img = {
        type: 'image',
        asset_url: 'some-image.jpg',
      };
      const message = generateMessage({
        attachments: [pdf, img],
      });
      expect(getImages(message)).toStrictEqual([img]);
    });
  });

  describe('getNonImageAttachments', () => {
    it('should return empty if message is undefined', () => {
      expect(getNonImageAttachments(undefined)).toStrictEqual([]);
    });

    it('should return empty if message has only image attachments', () => {
      const img = {
        type: 'image',
        asset_url: 'image.jpg',
      };
      const message = generateMessage({
        attachments: [img],
      });
      expect(getNonImageAttachments(message)).toStrictEqual([]);
    });

    it('should return just the non-image attachments when message has them', () => {
      const pdf = {
        type: 'file',
        asset_url: 'file.pdf',
      };
      const img = {
        type: 'image',
        asset_url: 'some-image.jpg',
      };
      const message = generateMessage({
        attachments: [pdf, img],
      });
      expect(getNonImageAttachments(message)).toStrictEqual([pdf]);
    });
  });
});
