import clsx from 'clsx';
import React from 'react';

export type TokenizedSuggestionDisplayName = {
  token: string;
  parts: string[];
};

export type TokenizedSuggestionPartsProps = {
  tokenizedDisplayName: TokenizedSuggestionDisplayName;
};

export const TokenizedSuggestionParts = ({
  tokenizedDisplayName,
}: TokenizedSuggestionPartsProps) =>
  tokenizedDisplayName.parts.map((part, i) => {
    const matches = part.toLowerCase() === tokenizedDisplayName.token;
    const partWithHTMLSpacesAround = part.replace(/^\s+|\s+$/g, '\u00A0');

    return (
      <span
        className={clsx({
          'str-chat__emoji-item-part': !matches,
          'str-chat__suggestion-item-part--match': matches,
        })}
        key={`part-${i}`}
      >
        {partWithHTMLSpacesAround}
      </span>
    );
  });
