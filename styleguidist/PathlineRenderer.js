/* eslint-disable import/no-extraneous-dependencies */
import React from 'react';
import Link from 'react-styleguidist/lib/client/rsg-components/Link';
import Styled from 'react-styleguidist/lib/client/rsg-components/Styled';

const styles = ({ space, fontFamily, fontSize, color }) => ({
  pathline: {
    fontFamily: fontFamily.monospace,
    fontSize: fontSize.small,
    color: color.light,
    wordBreak: 'break-all',
  },
  copyButton: {
    marginLeft: space[0],
  },
});

export const PathlineRenderer = ({ classes, children: source }) => {
  return (
    <div className={classes.pathline}>
      <Link
        href={`https://github.com/GetStream/stream-chat-react/blob/master/${source}`}
        target="blank"
        rel="noopener"
      >
        {source}
      </Link>
    </div>
  );
};

export default Styled(styles)(PathlineRenderer);
