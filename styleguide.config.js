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
  compilerConfig: {
    transforms: {
      dangerousTaggedTemplateString: true,
      moduleImport: false,
    },
    objectAssign: 'Object.assign',
  },
  propsParser: require('react-docgen-typescript').withCustomConfig(
    './tsconfig.json',
    {
      propFilter: { skipPropsWithoutDoc: true },
    },
  ).parse,
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
        'src/components/Chat/Chat.tsx',
        'src/components/Channel/Channel.tsx',
        'src/components/ChannelList/ChannelList.tsx',
        'src/components/MessageList/MessageList.tsx',
        'src/components/MessageList/VirtualizedMessageList.tsx',
        'src/components/ChannelHeader/ChannelHeader.tsx',
        'src/components/Thread/Thread.tsx',
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
            'src/components/Message/Message.tsx',
            'src/components/Message/MessageSimple.tsx',
            'src/components/Message/MessageTeam.tsx',
            'src/components/Message/MessageLivestream.tsx',
            'src/components/Attachment/Attachment.tsx',
            'src/components/Attachment/AttachmentActions.tsx',
            'src/components/Reactions/ReactionSelector.tsx',
            'src/components/MessageActions/MessageActionsBox.tsx',
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
              name: 'usePinHandler',
              content: 'src/docs/usePinHandler.md',
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
        'src/components/Attachment/Card.tsx',
        'src/components/ChatDown/ChatDown.tsx',
        'src/components/Loading/LoadingChannels.tsx',
        'src/components/Avatar/Avatar.tsx',
        'src/components/Loading/LoadingIndicator.tsx',
        'src/components/Gallery/Image.tsx',
        'src/components/DateSeparator/DateSeparator.tsx',
        'src/components/Window/Window.tsx',
        'src/components/ChannelList/ChannelListMessenger.tsx',
        'src/components/ChannelList/ChannelListTeam.tsx',
        'src/components/ChannelPreview/ChannelPreviewMessenger.tsx',
        'src/components/ChannelPreview/ChannelPreviewCompact.tsx',
        'src/components/ChannelPreview/ChannelPreviewLastMessage.tsx',
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
