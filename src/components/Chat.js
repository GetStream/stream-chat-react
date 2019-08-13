import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { ChatContext } from '../context';
import { IntlProvider } from 'react-intl';
import messages_en from '../translations/en';

const colors = ['light', 'dark'];
const baseUseCases = ['messaging', 'team', 'commerce', 'gaming', 'livestream'];
const themes = [];

for (const color of colors) {
  for (const useCase of baseUseCases) {
    themes.push(`${useCase} ${color}`);
  }
}

/**
 * Chat - Wrapper component for Chat. The needs to be placed around any other chat components.
 * This Chat component provides the ChatContext to all other components.
 *
 * The ChatContext provides the following props:
 *
 * - client (the client connection)
 * - channels (the list of channels)
 * - setActiveChannel (a function to set the currently active channel)
 * - channel (the currently active channel)
 *
 * It also exposes the withChatContext HOC which you can use to consume the ChatContext
 *
 * @example ./docs/Chat.md
 * @extends PureComponent
 */
export class Chat extends PureComponent {
  static propTypes = {
    /** The StreamChat client object */
    client: PropTypes.object.isRequired,
    /**
     *
     * Theme could be used for custom styling of the components.
     *
     * You can override the classes used in our components under parent theme class.
     *
     * e.g. If you want to build a theme where background of message is black
     *
     * ```
     *  <Chat client={client} theme={demo}>
     *    <Channel>
     *      <MessageList />
     *    </Channel>
     *  </Chat>
     * ```
     *
     * ```scss
     *  .demo.str-chat {
     *    .str-chat__message-simple {
     *      &-text-inner {
     *        background-color: black;
     *      }
     *    }
     *  }
     * ```
     *
     * Built in available themes:
     *
     *  - `messaging light`
     *  - `messaging dark`
     *  - `team light`
     *  - `team dark`
     *  - `commerce light`
     *  - `commerce dark`
     *  - `gaming light`
     *  - `gaming dark`
     *  - `livestream light`
     *  - `livestream dark`
     */
    theme: PropTypes.string,
    /** The App locale */
    locale: PropTypes.string,
    /** The messages for the given locale */
    messages: PropTypes.object,
  };

  static defaultProps = {
    theme: 'messaging light',
    locale: 'en',
    messages: messages_en,
  };

  constructor(props) {
    super(props);

    this.state = {
      // currently active channel
      channel: {},
      error: false,
    };
  }

  setActiveChannel = (channel, e) => {
    if (e !== undefined && e.preventDefault) {
      e.preventDefault();
    }

    this.setState(() => ({
      channel,
    }));
  };

  getContext = () => ({
    client: this.props.client,
    channel: this.state.channel,
    setActiveChannel: this.setActiveChannel,
    theme: this.props.theme,
  });

  render() {
    return (
      <IntlProvider locale={this.props.locale} messages={this.props.messages}>
        <ChatContext.Provider value={this.getContext()}>
          {this.props.children}
        </ChatContext.Provider>
      </IntlProvider>
    );
  }
}
