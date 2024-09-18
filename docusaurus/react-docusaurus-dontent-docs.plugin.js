module.exports = {
  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        lastVersion: 'current',
        versions: {
          current: {
            label: 'v12',
          },
          '11.x.x': {
            label: 'v11',
            path: 'v11',
          },
          '11.x.x-legacy': {
            label: 'v11 (legacy)',
            path: 'v11-legacy',
            banner: 'unmaintained',
          },
        },
      },
    ],
    [
      '@docusaurus/plugin-client-redirects',
      {
        createRedirects(existingPath) {
          // we need to replace /v12 in the path to the current version as v12 was previously rc
          const replacedToken = '/v12';
          if (existingPath.includes(replacedToken)) {
            // Redirect from /v12/X to /
            return [existingPath.replace('/', replacedToken)];
          }
          return undefined; // Return a falsy value: no redirect created
        },
      },
    ],
  ],
};
