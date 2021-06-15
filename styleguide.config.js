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
  sections: [
    {
      name: 'The React Chat SDK Docs Have Moved!',
      components: ['./styleguidist/Placeholder.js'],
    },
  ],
  require: [
    path.join(path.resolve(path.dirname('')), 'dist/css/index.css'),
    path.join(path.resolve(path.dirname('')), 'styleguidist/styleguidist.css'),
  ],
};
