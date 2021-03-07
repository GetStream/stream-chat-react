'use strict';

var _mockBuilders = require('mock-builders');

var _utils = require('../utils');

var alice = (0, _mockBuilders.generateUser)({
  name: 'alice',
});
var bob = (0, _mockBuilders.generateUser)({
  name: 'bob',
});
describe('Message utils', function () {
  describe('validateAndGetMessage function', function () {
    it('should return null if called without a function as the first parameter', function () {
      var result = (0, _utils.validateAndGetMessage)({}, 'Message');
      expect(result).toBeNull();
    });
    it('should return null if result of function call is not a string', function () {
      var fn = function fn() {
        return null;
      };

      var result = (0, _utils.validateAndGetMessage)(fn, 'something');
      expect(result).toBeNull();
    });
    it('should return the result of the function call when it is a string', function () {
      var fn = function fn(msg) {
        return msg;
      };

      var message = 'message';
      var result = (0, _utils.validateAndGetMessage)(fn, [message]);
      expect(result).toBe(message);
    });
  });
  describe('isUserMuted function', function () {
    it('should return false if message is not defined', function () {
      var mutes = [
        {
          user: alice,
          target: bob,
          created_at: new Date('2019-03-30T13:24:10'),
        },
      ];
      var result = (0, _utils.isUserMuted)(undefined, mutes);
      expect(result).toBe(false);
    });
    it('should return false if mutes is not defined', function () {
      var message = (0, _mockBuilders.generateMessage)();
      var result = (0, _utils.isUserMuted)(message, undefined);
      expect(result).toBe(false);
    });
    it('should return true if user was muted', function () {
      var mutes = [
        {
          user: alice,
          target: bob,
          created_at: new Date('2019-03-30T13:24:10'),
        },
      ];
      var message = (0, _mockBuilders.generateMessage)({
        user: bob,
      });
      var result = (0, _utils.isUserMuted)(message, mutes);
      expect(result).toBe(true);
    });
  });
  describe('getMessageActions', function () {
    var defaultCapabilities = {
      canDelete: true,
      canEdit: true,
      canFlag: true,
      canMute: true,
      canPin: true,
      canReply: true,
      canReact: true,
    };
    var actions = Object.values(_utils.MESSAGE_ACTIONS);
    it.each([
      ['empty', []],
      ['false', false],
    ])(
      'should return no message actions if message actions are %s',
      function (_, actionsValue) {
        var messageActions = actionsValue;
        var result = (0, _utils.getMessageActions)(
          messageActions,
          defaultCapabilities,
        );
        expect(result).toStrictEqual([]);
      },
    );
    it('should return all message actions if actions are set to true', function () {
      var result = (0, _utils.getMessageActions)(true, defaultCapabilities);
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
      function (_, action, capabilityKey, capabilityValue) {
        var capabilities = {
          [capabilityKey]: capabilityValue,
        };
        var result = (0, _utils.getMessageActions)(actions, capabilities);

        if (capabilityValue) {
          expect(result).toContain(action);
        } else {
          expect(result).not.toContain(action);
        }
      },
    );
  });
  describe('shouldMessageComponentUpdate', function () {
    it('should not update if rendered with the same message props', function () {
      var message = (0, _mockBuilders.generateMessage)();
      var currentProps = {
        message,
      };
      var nextProps = {
        message,
      };
      var shouldUpdate = (0, _utils.shouldMessageComponentUpdate)(
        nextProps,
        currentProps,
      );
      expect(shouldUpdate).toBe(false);
    });
    it('should update if rendered with a different message', function () {
      var message1 = (0, _mockBuilders.generateMessage)({
        id: 'message-1',
      });
      var message2 = (0, _mockBuilders.generateMessage)({
        id: 'message-2',
      });
      var currentProps = {
        message: message1,
      };
      var nextProps = {
        message: message2,
      };
      var shouldUpdate = (0, _utils.shouldMessageComponentUpdate)(
        nextProps,
        currentProps,
      );
      expect(shouldUpdate).toBe(true);
    });
    it('should update if rendered with a different message is read by other users', function () {
      var message = (0, _mockBuilders.generateMessage)();
      var currentReadBy = [alice];
      var currentProps = {
        message,
        readBy: currentReadBy,
      };
      var nextReadBy = [alice, bob];
      var nextProps = {
        message,
        readBy: nextReadBy,
      };
      var arePropsEqual = (0, _utils.areMessagePropsEqual)(
        nextProps,
        currentProps,
      );
      var shouldUpdate = (0, _utils.shouldMessageComponentUpdate)(
        nextProps,
        currentProps,
      );
      expect(arePropsEqual).toBe(false);
      expect(shouldUpdate).toBe(true);
    });
    it('should update if rendered with different groupStyles', function () {
      var message = (0, _mockBuilders.generateMessage)();
      var currentGroupStyles = ['top'];
      var currentProps = {
        message,
        groupStyles: currentGroupStyles,
      };
      var nextGroupStyles = ['bottom', 'right'];
      var nextProps = {
        message,
        groupStyles: nextGroupStyles,
      };
      var arePropsEqual = (0, _utils.areMessagePropsEqual)(
        nextProps,
        currentProps,
      );
      var shouldUpdate = (0, _utils.shouldMessageComponentUpdate)(
        nextProps,
        currentProps,
      );
      expect(arePropsEqual).toBe(false);
      expect(shouldUpdate).toBe(true);
    });
    it('should update if last received message in the channel changes', function () {
      var message = (0, _mockBuilders.generateMessage)();
      var currentLastReceivedId = 'some-message';
      var currentProps = {
        message,
        lastReceivedId: currentLastReceivedId,
      };
      var nextLastReceivedId = 'some-other-message';
      var nextProps = {
        message,
        lastReceivedId: nextLastReceivedId,
      };
      var arePropsEqual = (0, _utils.areMessagePropsEqual)(
        nextProps,
        currentProps,
      );
      var shouldUpdate = (0, _utils.shouldMessageComponentUpdate)(
        nextProps,
        currentProps,
      );
      expect(arePropsEqual).toBe(false);
      expect(shouldUpdate).toBe(true);
    });
    it('should update if editing state changes', function () {
      var message = (0, _mockBuilders.generateMessage)();
      var currentEditing = true;
      var currentProps = {
        message,
        editing: currentEditing,
      };
      var nextEditing = false;
      var nextProps = {
        message,
        editing: nextEditing,
      };
      var arePropsEqual = (0, _utils.areMessagePropsEqual)(
        nextProps,
        currentProps,
      );
      var shouldUpdate = (0, _utils.shouldMessageComponentUpdate)(
        nextProps,
        currentProps,
      );
      expect(arePropsEqual).toBe(false);
      expect(shouldUpdate).toBe(true);
    });
    it('should update if wrapper layout changes', function () {
      var message = (0, _mockBuilders.generateMessage)();
      var currentMessageListRect = {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      };
      var currentProps = {
        message,
        messageListRect: currentMessageListRect,
      };
      var nextMessageListRect = {
        x: 20,
        y: 20,
        width: 200,
        height: 200,
      };
      var nextProps = {
        message,
        messageListRect: nextMessageListRect,
      };
      var arePropsEqual = (0, _utils.areMessagePropsEqual)(
        nextProps,
        currentProps,
      );
      var shouldUpdate = (0, _utils.shouldMessageComponentUpdate)(
        nextProps,
        currentProps,
      );
      expect(arePropsEqual).toBe(false);
      expect(shouldUpdate).toBe(true);
    });
  });
  describe('messageHasReactions', function () {
    it('should return false if message is undefined', function () {
      expect((0, _utils.messageHasReactions)(undefined)).toBe(false);
    });
    it('should return false if message has no reactions', function () {
      var message = (0, _mockBuilders.generateMessage)({
        latest_reactions: [],
      });
      expect((0, _utils.messageHasReactions)(message)).toBe(false);
    });
    it('should return true if message has reactions', function () {
      var message = (0, _mockBuilders.generateMessage)({
        latest_reactions: [(0, _mockBuilders.generateReaction)()],
      });
      expect((0, _utils.messageHasReactions)(message)).toBe(true);
    });
  });
  describe('messageHasAttachments', function () {
    it('should return false if message is undefined', function () {
      expect((0, _utils.messageHasAttachments)(undefined)).toBe(false);
    });
    it('should return false if message has no attachments', function () {
      var message = (0, _mockBuilders.generateMessage)({
        attachments: [],
      });
      expect((0, _utils.messageHasAttachments)(message)).toBe(false);
    });
    it('should return true if message has attachments', function () {
      var attachment = {
        type: 'file',
        asset_url: 'file.pdf',
      };
      var message = (0, _mockBuilders.generateMessage)({
        attachments: [attachment],
      });
      expect((0, _utils.messageHasAttachments)(message)).toBe(true);
    });
  });
  describe('getImages', function () {
    it('should return empty if message is undefined', function () {
      expect((0, _utils.getImages)(undefined)).toStrictEqual([]);
    });
    it('should return empty if message has no image attachments', function () {
      var pdf = {
        type: 'file',
        asset_url: 'file.pdf',
      };
      var message = (0, _mockBuilders.generateMessage)({
        attachments: [pdf],
      });
      expect((0, _utils.getImages)(message)).toStrictEqual([]);
    });
    it('should return just the image attachments when message has them', function () {
      var pdf = {
        type: 'file',
        asset_url: 'file.pdf',
      };
      var img = {
        type: 'image',
        asset_url: 'some-image.jpg',
      };
      var message = (0, _mockBuilders.generateMessage)({
        attachments: [pdf, img],
      });
      expect((0, _utils.getImages)(message)).toStrictEqual([img]);
    });
  });
  describe('getNonImageAttachments', function () {
    it('should return empty if message is undefined', function () {
      expect((0, _utils.getNonImageAttachments)(undefined)).toStrictEqual([]);
    });
    it('should return empty if message has only image attachments', function () {
      var img = {
        type: 'image',
        asset_url: 'image.jpg',
      };
      var message = (0, _mockBuilders.generateMessage)({
        attachments: [img],
      });
      expect((0, _utils.getNonImageAttachments)(message)).toStrictEqual([]);
    });
    it('should return just the non-image attachments when message has them', function () {
      var pdf = {
        type: 'file',
        asset_url: 'file.pdf',
      };
      var img = {
        type: 'image',
        asset_url: 'some-image.jpg',
      };
      var message = (0, _mockBuilders.generateMessage)({
        attachments: [pdf, img],
      });
      expect((0, _utils.getNonImageAttachments)(message)).toStrictEqual([pdf]);
    });
  });
});
