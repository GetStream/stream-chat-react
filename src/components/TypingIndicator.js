import React from 'react';

import { Avatar } from './Avatar';

export class TypingIndicator extends React.PureComponent {
  render() {
    if (Object.keys(this.props.typing).length <= 0) {
      return null;
    }

    const typing = Object.values(this.props.typing);

    return (
      <div className="str-chat__typing-indicator">
        <div className="str-chat__typing-indicator__avatars">
          {typing.map((user) => (
            <Avatar
              source={user.image}
              size={32}
              name={user.name || user.id}
              key={user.id}
            />
          ))}
        </div>
        <div className="str-chat__typing-indicator__dots">
          <span className="str-chat__typing-indicator__dot" />
          <span className="str-chat__typing-indicator__dot" />
          <span className="str-chat__typing-indicator__dot" />
        </div>
      </div>
    );
  }
}
