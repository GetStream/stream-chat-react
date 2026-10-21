export function escapeRegExp(text: string) {
  return text.replace(/[-[\]{}()*+?.,/\\^$|#]/g, '\\$&');
}

export const detectHttp = /(http(s?):\/\/)?(www\.)?/i;

// Module-level so they compile once. The global `codeRegex` and `regexMdLinks` are only used with
// `String#match`, which resets `lastIndex`; `singleMatch` is non-global, so `.exec` ignores it.
const codeRegex = /```[a-z]*\n[\s\S]*?\n```|`[a-z]*[\s\S]*?`/gm;
const regexMdLinks = /\[([^[]+)\](\(.*\))/gm;
const singleMatch = /\[([^[]+)\]\((.*)\)/;

export const messageCodeBlocks = (message: string) => {
  const matches = message.match(codeRegex);
  return matches || [];
};

export const matchMarkdownLinks = (message: string) => {
  const matches = message.match(regexMdLinks);

  const links = matches
    ? matches.map((match) => {
        const i = singleMatch.exec(match);
        return i && [i[1], i[2]];
      })
    : [];

  return links.flat();
};
