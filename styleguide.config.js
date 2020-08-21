/* eslint-disable */
const path = require('path');

module.exports = {
  title: 'React Chat - Docs',
  styleguideDir: 'docs',
  assetsDir: 'src/assets',
  sortProps: (props) => props,
  resolver: require('react-docgen').resolver.findAllComponentDefinitions,
  webpackConfig: require('./styleguidist/webpack.config.styleguidist.js'),
  serverPort: 6068,
  styleguideComponents: {
    PathlineRenderer: path.join(__dirname, 'styleguidist/PathlineRenderer'),
  },

  /* getExampleFilename(componentPath) {
		componentPath = componentPath
			.replace('src/components/', 'src/components/docs/')
			.replace('.js', '.md');
		console.log('componentPath', componentPath);
		return componentPath;
	}, */
  sections: [
    {
      name: 'Top Level Components',
      components: [
        'src/components/Chat/Chat.js',
        'src/components/Channel/Channel.js',
        'src/components/ChannelList/ChannelList.js',
        'src/components/MessageList/MessageList.js',
        'src/components/MessageList/VirtualizedMessageList.js',
        'src/components/ChannelHeader/ChannelHeader.js',
        'src/components/Thread/Thread.js',
      ],
      exampleMode: 'collapse',
      usageMode: 'expand',
    },
    {
      name: 'Message',
      usageMode: 'expand',
      sections: [
        {
          name: 'Components',
          components: [
            'src/components/Message/Message.js',
            'src/components/Message/MessageSimple.js',
            'src/components/Message/MessageTeam.js',
            'src/components/Message/MessageLivestream.js',
            'src/components/Attachment/Attachment.js',
            'src/components/Attachment/AttachmentActions.js',
            'src/components/Reactions/ReactionSelector.js',
            'src/components/MessageActions/MessageActionsBox.js',
          ],
          exampleMode: 'collapse',
        },
        {
          name: 'Custom Hooks',
          content: 'src/docs/MessageCustomHooks.md',
          sections: [
            {
              name: 'useDeleteHandler',
              content: 'src/docs/useDeleteHandler.md',
            },
            {
              name: 'useEditHandler',
              content: 'src/docs/useEditHandler.md',
            },
            {
              name: 'useFlagHandler',
              content: 'src/docs/useFlagHandler.md',
            },
            {
              name: 'useMentionsHandler',
              content: 'src/docs/useMentionsHandler.md',
            },
            {
              name: 'useMuteHandler',
              content: 'src/docs/useMuteHandler.md',
            },
            {
              name: 'useOpenThreadHandler',
              content: 'src/docs/useOpenThreadHandler.md',
            },
            {
              name: 'useReactionHandler',
              content: 'src/docs/useReactionHandler.md',
            },
            {
              name: 'useRetryHandler',
              content: 'src/docs/useRetryHandler.md',
            },
            {
              name: 'useUserHandler',
              content: 'src/docs/useUserHandler.md',
            },
            {
              name: 'useUserRole',
              content: 'src/docs/useUserRole.md',
            },
          ],
        },
      ],
    },
    {
      name: 'Message Input',
      components: [
        'src/components/MessageInput/MessageInput.js',
        'src/components/MessageInput/MessageInputSmall.js',
        'src/components/MessageInput/MessageInputLarge.js',
        'src/components/MessageInput/MessageInputFlat.js',
        'src/components/ChatAutoComplete/ChatAutoComplete.js',
        'src/components/EditMessageForm/EditMessageForm.js',
      ],
      exampleMode: 'collapse',
      usageMode: 'expand',
    },
    {
      name: 'Utilities',
      components: [
        'src/components/Card/Card.js',
        'src/components/ChatDown/ChatDown.js',
        'src/components/Loading/LoadingChannels.js',
        'src/components/Avatar/Avatar.js',
        'src/components/Loading/LoadingIndicator.js',
        'src/components/Image/Image.js',
        'src/components/DateSeparator/DateSeparator.js',
        'src/components/Window/Window.js',
        'src/components/ChannelList/ChannelListMessenger.js',
        'src/components/ChannelList/ChannelListTeam.js',
        'src/components/ChannelPreview/ChannelPreviewMessenger.js',
        'src/components/ChannelPreview/ChannelPreviewCompact.js',
        'src/components/ChannelPreview/ChannelPreviewLastMessage.js',
      ],
      sections: [
        {
          name: 'Streami18n',
          content: 'src/docs/Streami18n.md',
        },
      ],
      exampleMode: 'collapse',
      usageMode: 'expand',
    },
    {
      name: 'Contexts',
      sections: [
        {
          name: 'ChatContext',
          content: 'src/docs/ChatContext.md',
        },
        {
          name: 'withChatContext',
          content: 'src/docs/withChatContext.md',
        },
        {
          name: 'ChannelContext',
          content: 'src/docs/ChannelContext.md',
        },
        {
          name: 'withChannelContext',
          content: 'src/docs/withChannelContext.md',
        },
      ],
      exampleMode: 'collapse',
      usageMode: 'expand',
    },
  ],
  require: [
    path.join(path.resolve(path.dirname('')), 'dist/css/index.css'),
    path.join(path.resolve(path.dirname('')), 'styleguidist/styleguidist.css'),
  ],
  template: {
    favicon: 'https://getstream.imgix.net/images/favicons/favicon-96x96.png',
    link: {
      rel: 'stylesheet',
      type: 'text/css',
      href: './dist/css/index.css',
    },
  },
};
