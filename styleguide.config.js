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
  propsParser: require('react-docgen-typescript').withCustomConfig('./tsconfig.json', {
    propFilter: { skipPropsWithoutDoc: true },
  }).parse,
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
        'src/components/Thread/Thread.tsx',
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
          name: 'ChannelActionContext',
          content: 'src/docs/ChannelActionContext.md',
        },
        {
          name: 'ChannelStateContext',
          content: 'src/docs/ChannelStateContext.md',
        },
        {
          name: 'MessageContext',
          content: 'src/docs/MessageContext.md',
        },
        {
          name: 'MessageInputContext',
          content: 'src/docs/MessageInputContext.md',
        },
        {
          name: 'ComponentContext',
          content: 'src/docs/ComponentContext.md',
        },
        {
          name: 'TranslationContext',
          content: 'src/docs/TranslationContext.md',
        },
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
            'src/components/Attachment/Attachment.tsx',
            'src/components/Attachment/AttachmentActions.tsx',
            'src/components/Reactions/ReactionSelector.tsx',
            'src/components/Reactions/ReactionsList.tsx',
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
      usageMode: 'expand',
      sections: [
        {
          name: 'Components',
          components: [
            'src/components/MessageInput/MessageInput.tsx',
            'src/components/MessageInput/MessageInputSmall.tsx',
            'src/components/MessageInput/MessageInputFlat.tsx',
            'src/components/MessageInput/EditMessageForm.tsx',
            'src/components/ChatAutoComplete/ChatAutoComplete.tsx',
          ],
          exampleMode: 'collapse',
        },
        {
          name: 'Custom Hooks',
          sections: [
            {
              name: 'useMessageInputContext',
              content: 'src/docs/useMessageInputContext.md',
            },
          ],
          exampleMode: 'collapse',
        },
      ],
    },
    {
      name: 'Utilities',
      components: [
        'src/components/ChannelSearch/ChannelSearch.tsx',
        'src/components/ChannelHeader/ChannelHeader.tsx',
        'src/components/Attachment/Card.tsx',
        'src/components/ChatDown/ChatDown.tsx',
        'src/components/Loading/LoadingChannels.tsx',
        'src/components/Avatar/Avatar.tsx',
        'src/components/Loading/LoadingIndicator.tsx',
        'src/components/Gallery/Image.tsx',
        'src/components/DateSeparator/DateSeparator.tsx',
        'src/components/Window/Window.tsx',
        'src/components/ChannelList/ChannelListMessenger.tsx',
        'src/components/ChannelPreview/ChannelPreviewMessenger.tsx',
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
  ],
  require: [
    path.join(path.resolve(path.dirname('')), 'dist/css/index.css'),
    path.join(path.resolve(path.dirname('')), 'styleguidist/styleguidist.css'),
  ],
  styles: {
    StyleGuide: {
      content: {
        maxWidth: '1300px', // default is 1000px
      },
      sidebar: {
        width: '270px',
      },
    },
  },
  template: {
    favicon: 'https://getstream.imgix.net/images/favicons/favicon-96x96.png',
    link: {
      rel: 'stylesheet',
      type: 'text/css',
      href: './dist/css/index.css',
    },
  },
};
