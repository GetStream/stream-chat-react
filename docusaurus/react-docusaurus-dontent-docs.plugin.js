module.exports = {
  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        lastVersion: 'current',
        versions: {
          current: {
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
