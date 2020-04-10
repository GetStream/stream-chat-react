import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import { ChatContext, TranslationContext } from '../../context';
import { Streami18n } from '../../Streami18n';
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
class Chat extends PureComponent {
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
     *  - `livestream light`
     *  - `livestream dark`
     */
    theme: PropTypes.string,
  };

  static defaultProps = {
    theme: 'messaging light',
  };

  constructor(props) {
    super(props);

    this.state = {
      // currently active channel
      channel: {},
      navOpen: true,
      error: false,
    };
  }

  async componentDidMount() {
    const { i18nInstance } = this.props;
    let streami18n;

    if (i18nInstance && i18nInstance instanceof Streami18n) {
      streami18n = i18nInstance;
    } else {
      streami18n = new Streami18n({ language: 'en' });
    }

    streami18n.registerSetLanguageCallback((t) => {
      this.setState({ t });
    });

    const { t, tDateTimeParser } = await streami18n.getTranslators();
    this.setState({ t, tDateTimeParser });
  }

  setActiveChannel = async (channel, watchers = {}, e) => {
    if (e !== undefined && e.preventDefault) {
      e.preventDefault();
    }
    if (Object.keys(watchers).length) {
      await channel.query({ watch: true, watchers });
    }
    this.setState(() => ({
      channel,
    }));
    if (this.state.navOpen) {
      this.closeMobileNav();
    }
  };

  openMobileNav = () => {
    setTimeout(() => {
      this.setState({
        navOpen: true,
      });
    }, 100);
  };

  closeMobileNav = () => {
    this.setState({
      navOpen: false,
    });
  };

  getContext = () => ({
    client: this.props.client,
    channel: this.state.channel,
    setActiveChannel: this.setActiveChannel,
    openMobileNav: this.openMobileNav,
    closeMobileNav: this.closeMobileNav,
    navOpen: this.state.navOpen,
    theme: this.props.theme,
  });

  render() {
    if (!this.state.t) return null;

    return (
      <ChatContext.Provider value={this.getContext()}>
        <TranslationContext.Provider
          value={{
            t: this.state.t,
            tDateTimeParser: this.state.tDateTimeParser,
          }}
        >
          {this.props.children}
        </TranslationContext.Provider>
      </ChatContext.Provider>
    );
  }
}

export default Chat;
