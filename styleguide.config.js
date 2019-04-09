// @noflow
/* eslint-env commonjs*/
const path = require('path');

module.exports = {
  title: 'React Chat - Docs',
  styleguideDir: 'docs',
  assetsDir: 'src/assets',
  sortProps: (props) => props,
  resolver: require('react-docgen').resolver.findAllComponentDefinitions,
  webpackConfig: require('./webpack.config.styleguidist.js'),

  /*getExampleFilename(componentPath) {
		componentPath = componentPath
			.replace('src/components/', 'src/components/docs/')
			.replace('.js', '.md');
		console.log('componentPath', componentPath);
		return componentPath;
	},*/
  sections: [
    {
      name: 'Top Level Components',
      components: [
        'src/components/Chat.js',
        'src/components/Channel.js',
        'src/components/ChannelList.js',
        'src/components/MessageList.js',
        'src/components/ChannelHeader.js',
        'src/components/Thread.js',
      ],
      exampleMode: 'collapse',
      usageMode: 'expand',
    },
    {
      name: 'Message Components',
      components: [
        'src/components/Message.js',
        'src/components/MessageSimple.js',
        'src/components/MessageTeam.js',
        'src/components/MessageLivestream.js',
        'src/components/Attachment.js',
        'src/components/AttachmentActions.js',
        'src/components/AutoComplete.js',
        'src/components/ReactionSelector.js',
        'src/components/MessageActionsBox.js',
      ],
      exampleMode: 'collapse',
      usageMode: 'expand',
    },
    {
      name: 'Message Input',
      components: [
        'src/components/MessageInput.js',
        'src/components/MessageInputSmall.js',
        'src/components/MessageInputLarge.js',
        'src/components/MessageInputFlat.js',
        'src/components/ChatAutoComplete.js',
        'src/components/AutoComplete.js',
        'src/components/EditMessageForm.js',
      ],
      exampleMode: 'collapse',
      usageMode: 'expand',
    },
    {
      name: 'Utilities',
      components: [
        'src/components/Card.js',
        'src/components/ChatDown.js',
        'src/components/LoadingChannels.js',
        'src/components/Avatar.js',
        'src/components/LoadingIndicator.js',
        'src/components/Image.js',
        'src/components/DateSeparator.js',
        'src/components/Window.js',
      ],
      exampleMode: 'collapse',
      usageMode: 'expand',
    },
  ],
  require: [
    path.join(path.resolve(path.dirname('')), 'dist/css/index.css'),
    path.join(path.resolve(path.dirname('')), 'styleguidist.css'),
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
