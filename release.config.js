console.log('CHANGELOG: running');
export default {
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/changelog',
      {
        changelogFile: './CHANGELOG.md',
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: ['./CHANGELOG.md'],
      },
    ],
  ],
};
