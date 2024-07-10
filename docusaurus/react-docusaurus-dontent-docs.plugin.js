module.exports = {
  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        lastVersion: '11.x.x',
        versions: {
          current: {
            banner: 'unreleased',
            label: 'v12 (rc)',
            path: 'v12',
          },
          '11.x.x': {
            label: 'v11',
          },
          '11.x.x-legacy': {
            label: 'v11 (legacy)',
            path: 'v11-legacy',
            banner: 'unmaintained',
          },
        },
      },
    ],
  ],
};
